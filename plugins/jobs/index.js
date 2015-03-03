var Hapi = require('hapi');
var Joi = require('joi');
var Hoek = require('hoek');
var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;
var MongoClient = mongodb.MongoClient;
var _ = require('lodash');
var Schema = require('./schema');
var Resource = require('./resource');
var Spawnish = require('../../../spawnish');
var Path = require('path');

exports.register = function(plugin, options, next) {
    var server = plugin.select('api');

    var helperPostHandler = {
        objectIdString: function(obj) {
            if (obj && obj._id instanceof ObjectID) {
                obj.id = obj._id.toString();
                delete obj._id;
            }
        }
    };

    server.ext('onPostHandler', function(request, reply) {
        var source = request.response.source;

        if (source) {
            if (_.isArray(source)) {
                _.each(source, helperPostHandler.objectIdString);
            } else if (_.isObject(source)) {
                helperPostHandler.objectIdString(source);
            }
        }

        reply.continue();
    });

    MongoClient.connect('mongodb://localhost:27017/ansible', function(err, db) {
        Hoek.assert(!err);

        var jobOptions = {
            db: db,
            schema: Schema.job,
            collection: 'job',
            prefix: '/job',
            tags: ['api', 'jobs']
        };

        server.route(Resource.create(db, jobOptions));

        var projectOptions = {
            db: db,
            schema: Schema.project,
            collection: 'project',
            prefix: '/project',
            tags: ['api', 'project']
        };

        server.route(Resource.create(db, projectOptions));

        server.route({
            path: projectOptions.prefix + '/{id}/sync',
            method: 'POST',
            config: {
                tags: projectOptions.tags,
                description: 'Sync',
                notes: 'Sync',
                validate: {
                    params: Schema.project.GetParams
                },
                handler: function(request, reply) {
                    var objectID = new ObjectID(request.params.id);

                    var internals = {
                        found: function(error, doc) {
                            if (error) {
                                return Resource.internals.replyError(reply, error);
                            } else if (!doc) {
                                return Resource.internals.replyNotFound(reply);
                            }

                            return internals.sync(doc);
                        },
                        sync: function(doc) {
                            var args = {
                                file: Path.join(__dirname, 'playbooks/checkout.yml'),
                                vars: {
                                    REPO: doc.url,
                                    TARGET: Path.join(options.path, doc._id.toString())
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

                    db.collection(projectOptions.collection).findOne({_id: objectID}, internals.found);
                },
                response: {
                    schema: Schema.Get
                }
            }
        });


        next();
    });
};

exports.register.attributes = {
    name: 'jobs',
    version: '1.0.0'
};
