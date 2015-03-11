var Spawnish = require('../../../spawnish');
var ResourceFactory = require('../../common/resourceRoutesFactory');
var ObjectID = require('mongodb').ObjectID;
var Path = require('path');
var Hoek = require('hoek');
var _ = require('lodash');
var Run = require('./run');
var Schema = require('./schema');

exports.register = function(server, options, next) {
    var db = server.plugins.mongodb.db;
    var collection = db.collection('run');
    var tags = ['api', 'runs'];
    var runs = [];

    var internals = {
        createSpawnableForTask(task) {
            var args = {
                file: Path.join(options.repositoryPath, task.repositoryId, task.playbook),
                verbosity: task.verbosity,
                vars: {}
            };

            return new Spawnish.AnsiblePlaybook(args);
        },
        createSpawnableForSync(repository) {
            var args = {
                file: Path.join(__dirname, 'playbooks/checkout.yml'),
                vars: {
                    REPO: repository.url,
                    TARGET: Path.join(options.repositoryPath, repository._id.toString())
                }
            };

            if (repository.branch) {
                args.vars.VERSION = repository.branch;
            }

            return new Spawnish.AnsiblePlaybook(args);
        },
        trackSpawn(run) {
            var removeRun = function() {
                runs = _.without(runs, run);
            };

            if (!_.contains(runs, run)) {
                runs.push(run);
            }

            run.once('exit', removeRun);
            run.once('error', removeRun);
        },
        logger: function(data) {
            server.log(['push', 'task'], data);
        }
    };

    server.expose('task', function(task, reply) {
        var spawn = internals.createSpawnableForTask(task);
        var run = new Run({type: 'task', collection: collection, spawn: spawn, task: task, log: internals.logger });

        // Make sure initial job is persisted
        run.save(function(error) {
            reply(error, run);
            internals.trackSpawn(spawn);
            return run.start();
        });
    });

    server.expose('sync', function(repository, reply) {
        var spawn = internals.createSpawnableForSync(repository);
        var run = new Run({type: 'sync', collection: collection, spawn: spawn, repository: repository, log: internals.logger });

        // Make sure initial job is persisted
        run.save(function(error) {
            reply(error, run);
            internals.trackSpawn(spawn);
            return run.start();
        });
    });

    server.expose('kill', function(id, signal) {
        var run = _.find(runs, {id: new ObjectID(id)});

        if (run) {
            run.kill(signal);
        }
    });

    server.route({
        path: '/run/active',
        method: 'GET',
        config: {
            tags: tags,
            description: 'List active runs',
            notes: 'List active runs',
            handler: function(request, reply) {
                return reply(_.map(runs, function(run) {
                    return {
                        id: run.id.toString(),
                        type: run.meta.type
                    };
                }));
            }
        }
    });

    var routes = ResourceFactory.create(db, {
        db: db,
        schema: Schema,
        collection: 'run',
        prefix: '/run',
        tags: tags
    });
    server.route(routes);

    next();
};

exports.register.attributes = {
    name: 'run',
    version: require('../../package.json').version
};
