var Schema = require('./schema');
var ResourceFactory = require('../../common/resourceRoutesFactory');
var tags = ['api', 'users'];

exports.register = function(server, options, next) {
    var db = server.plugins.mongodb.db;
    var collection = db.collection('user');

    var routes = ResourceFactory.create(collection, {
        schema: Schema,
        prefix: '/user',
        tags: tags
    });

    server.route(routes);
    next();
};

exports.register.attributes = {
    name: 'user',
    version: require('../../package.json').version
};
