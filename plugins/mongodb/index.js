var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;
var MongoClient = mongodb.MongoClient;
var Hoek = require('hoek');

var defaults = {
    url: 'mongodb://localhost:27017/ansible'
};

exports.register = function(server, options, next) {
    options = Hoek.applyToDefaults(defaults, options || {});

    MongoClient.connect(options.url, function(error, db) {
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
