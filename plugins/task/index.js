var ResourceFactory = require('../../common/resourceRoutesFactory');
var Schema = require('./schema');

var Joi = require('joi');
var Hoek = require('hoek');
var Path = require('path');
var dir = require('node-dir');
var Spawnish = require('../../../spawnish');
var _ = require('lodash');
var ObjectID = require('mongodb').ObjectID;

exports.register = function(server, options, next) {
    var db = server.plugins.mongodb.db;
    var collection = db.collection('task');
    var tags = ['api', 'tasks'];
    var routes = ResourceFactory.create(db, {
        db: db,
        schema: Schema,
        collection: 'task',
        prefix: '/task',
        tags: tags
    });

    server.route(routes);


    server.route({
        path: '/task/{id}/run',
        method: 'POST',
        config: {
            tags: tags,
            description: 'Run',
            notes: 'Run',
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

                        return internals.run(doc);
                    },
                    run: function(doc) {
                        var args = {
                            file: Path.join(options.repositoryPath, doc.project, doc.playbook),
                            verbosity: doc.verbosity,
                            vars: {}
                        };

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

    next();
};

exports.register.attributes = {
    name: 'task',
    version: require('../../package.json').version
};
