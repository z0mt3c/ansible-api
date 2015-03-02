var Hapi = require('hapi');
var Joi = require('joi');
var Hoek = require('hoek');
var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;
var MongoClient = mongodb.MongoClient;
var _ = require('lodash');
var Schema = require('./schema');
var Resource = require('./resource');

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

        server.route(Resource.create(db, Schema.job, { prefix: '/job', tags: ['api', 'jobs'] }));
        server.route(Resource.create(db, Schema.project, { prefix: '/project', tags: ['api', 'project'] }));

        next();
    });
};

exports.register.attributes = {
    name: 'jobs',
    version: '1.0.0'
};
