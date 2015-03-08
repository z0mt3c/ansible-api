var ResourceFactory = require('../../common/resourceRoutesFactory');
var Schema = require('./schema');
var ObjectID = require('mongodb').ObjectID;

var Joi = require('joi');
var Path = require('path');
var dir = require('node-dir');
var Spawnish = require('../../../spawnish');
var _ = require('lodash');
var Hoek = require('hoek');

exports.register = function(server, options, next) {
    Hoek.assert(options.repositoryPath, 'repositoryPath missing');

    var db = server.plugins.mongodb.db;
    var collection = db.collection('repository');
    var tags = ['api', 'repositorys'];
    var routes = ResourceFactory.create(db, {
        db: db,
        schema: Schema,
        collection: 'repository',
        prefix: '/repository',
        tags: tags
    });

    server.route(routes);

    server.route({
        path: '/repository/{id}/sync',
        method: 'POST',
        config: {
            tags: tags,
            description: 'Sync',
            notes: 'Sync',
            validate: {
                params: Schema.GetParams
            },
            handler: function(request, reply) {
                var objectID = new ObjectID(request.params.id);

                var internals = {
                    found: function(error, doc) {
                        if (error) {
                            return ResourceFactory.internals.replyError(reply, error);
                        } else if (!doc) {
                            return ResourceFactory.internals.replyNotFound(reply);
                        }

                        return internals.sync(doc);
                    },
                    sync: function(doc) {
                        var args = {
                            file: Path.join(__dirname, 'playbooks/checkout.yml'),
                            vars: {
                                REPO: doc.url,
                                TARGET: Path.join(options.repositoryPath, doc._id.toString())
                            }
                        };

                        if (doc.branch) {
                            args.vars.VERSION = doc.branch;
                        }

                        var git = new Spawnish.AnsiblePlaybook(args);

                        git.on('std', function(msg) {
                            console.log(msg)
                        });

                        git.run();

                        return reply(doc);
                    }
                };

                collection.findOne({_id: objectID}, internals.found);
            },
            response: {
                schema: Schema.Get
            }
        }
    });



    server.route({
        path: '/repository/{id}/files',
        method: 'GET',
        config: {
            tags: tags,
            description: 'List files',
            notes: 'List files',
            validate: {
                params: Schema.GetParams
            },
            handler: function(request, reply) {
                var path = Path.join(options.repositoryPath, request.params.id);

                dir.files(path,
                    function(err, files) {
                        if (err) throw err;

                        var pattern = /.yml$/i;

                        files = _.filter(files, function(file) {
                            return pattern.test(file);
                        });

                        files = _.map(files, function(file) {
                            return file.substr(path.length + 1);
                        });

                        reply(files);
                    }
                );
            },
            response: {
                //schema: Schema.Get
            }
        }
    });

    next();
};

exports.register.attributes = {
    name: 'repository',
    version: require('../../package.json').version
};
