var Path = require('path');

exports.register = function(server, options, next) {
    server.route({
        path: '/{param*}',
        method: 'GET',
        handler: {
            directory: {
                path: options.path || Path.join(__dirname, '../../../web/build')
            }
        }
    });

    next();
};

exports.register.attributes = {
    name: 'web',
    version: require('../../package.json').version
};
