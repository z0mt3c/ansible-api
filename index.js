var _ = require('lodash');
var Glue = require('glue');
var Path = require('path');
var server = null;

var internals = {
    compose(manifest) {
        Glue.compose(manifest, {
            relativeTo: Path.join(__dirname, 'plugins')
        }, internals.done);
    },
    done(error, _server) {
        if (error) {
            throw error;
        }

        server = _server;
        server.start(internals.started);
    },
    started(error) {
        if (error) {
            throw error;
        }

        console.log('Server(s) listening at:');

        _.each(server.connections, function(connection) {
            console.log(' - ' + connection.info.uri);
        });
    }
};

var apiPluginOptions = [{
    select: 'api',
    routes: {
        prefix: '/api'
    },
    options: {
        credentialPath: __dirname + '/data',
        repositoryPath: __dirname + '/data'
    }
}];

internals.compose({
    server: {},
    connections: [{
        port: 7000,
        labels: ['api'],
        routes: {
            validate: {
                options: {
                    abortEarly: false,
                    stripUnknown: true
                }
            }
        }
    }],
    plugins: {
        'hapi-swaggered': [{
            select: 'api',
            routes: {
                prefix: '/swagger'
            },
            options: {
                cache: false,
                responseValidation: false,
                stripPrefix: '/api',
                info: {
                    title: 'Ansible Master API',
                    description: 'Powered by node, hapi, joi, hapi-swaggered, hapi-swaggered-ui and swagger-ui',
                    version: require('./package.json').version
                }
            }
        }],
        'hapi-swaggered-ui': [{
            select: 'api',
            routes: {
                prefix: '/docs'
            },
            options: {
                title: 'Ansible Master API'
            }
        }],


        './mongodb': {},
        './common': {},
        './authentication': {},

        // Run & persist results
        './run': apiPluginOptions,
        // Listens to logs an pushs them out through socket.io
        './push': apiPluginOptions,
        // User
        './user': apiPluginOptions,

        // Git repos with anible playbooks
        './repository': apiPluginOptions,
        // Ansible host inventory
        './inventory': apiPluginOptions,
        './host': apiPluginOptions,
        // Task definitions repo + playbook + parameters
        './task': apiPluginOptions,


        // Storing SSH Credentials
        './credential': apiPluginOptions,

        './web': {}
    }
});
