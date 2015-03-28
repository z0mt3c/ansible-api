var Path = require('path');
var _ = require('lodash');
var ansibleWeb = require('ansible-web');

exports.register = function(server, options, next) {
    server.route({
        path: '/{param*}',
        method: 'GET',
        config: {
            auth: 'session',
            handler: {
                directory: {
                    path: ansibleWeb.path
                }
            },
            plugins: {
                'hapi-auth-cookie': {
                    redirectTo: '/login'
                }
            }
        }
    });

    server.route(_.map(['styles', 'images', 'fonts'], function(folder) {
        return {
            path: '/' + folder + '/{param*}',
            method: 'GET',
            config: {
                handler: {
                    directory: {
                        path: Path.join(ansibleWeb.path, folder)
                    }
                }
            }
        };
    }));

    next();
};

exports.register.attributes = {
    name: 'web',
    version: require('../../package.json').version
};
