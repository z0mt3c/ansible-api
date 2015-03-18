var Schema = require('./schema');
var ResourceFactory = require('../../common/resourceRoutesFactory');
var tags = ['api', 'credentials'];
var Path = require('path');
var fs = require('fs');
var _ = require('lodash');

exports.register = function(server, options, next) {
    var db = server.plugins.mongodb.db;
    var collection = db.collection('credential');
    var routes = ResourceFactory.create(collection, {
        schema: Schema,
        prefix: '/credential',
        tags: tags
    });

    server.expose('prepare', function(id, reply) {
        collection.findOne({_id: id}, function(error, doc) {
            if (error) {
                return reply(error, null);
            }

            if (doc.sshAuthType === 'key') {
                var target = doc.sshKeyPath = Path.join(options.credentialPath, id.toString());

                fs.writeFile(target, doc.sshKey, { mode: '600' }, function (error) {
                    return reply(error, doc);
                });
            } else {
                return reply(error, doc);
            }
        })
    });


    server.route(routes);
    next();
};

exports.register.attributes = {
    name: 'credential',
    version: require('../../package.json').version
};
