var _ = require('lodash');
var ObjectID = require('mongodb').ObjectID;

var internals = {
    objectIdString(obj) {
        if (obj && obj._id instanceof ObjectID) {
            obj.id = obj._id.toString();
            delete obj._id;
        }
    }
};

exports.register = function(server, options, next) {
    server.ext('onPostHandler', function(request, reply) {
        var source = request.response.source;

        if (source) {
            if (_.isArray(source)) {
                _.each(source, internals.objectIdString);
            } else if (_.isObject(source)) {
                internals.objectIdString(source);
            }
        }

        reply.continue();
    });


    server.on('log', function(event, tags) {
        console.log('Server error: ' + (event.data || 'unspecified'), tags);
    });

    server.on('request-internal', function(request, event, tags) {
        if (tags.validation) {
            console.error('-> ' + event.data);
        }
    });

    next();
};

exports.register.attributes = {
    name: 'common',
    version: require('../../package.json').version
};
