var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;
var MongoClient = mongodb.MongoClient;
var Hoek = require('hoek');

var defaults = {
};

exports.register = function(server, options, next) {
    options = Hoek.applyToDefaults(defaults, options || {});
    Hoek.assert(options.mongodb, 'Mongodb config missing');

    MongoClient.connect(options.mongodb, function(error, db) {
        server.expose('db', db);
        server.db = db;

        server.ext('onPreHandler', function(request, next) {
            request.db = db;
            next.continue();
        });

        next();
    });
};

exports.register.attributes = {
    name: 'mongodb',
    version: require('../../package.json').version
};
