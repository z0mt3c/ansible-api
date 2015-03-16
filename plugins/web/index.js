var Path = require('path');
var _ = require('lodash');

exports.register = function(server, options, next) {
    server.route({
        path: '/{param*}',
        method: 'GET',
        config: {
            auth: 'session',
            handler: {
                directory: {
                    path: Path.join(__dirname, '../../../web/build')
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
                        path: Path.join(__dirname, '../../../web/build', folder)
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
