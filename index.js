var Hapi = require('hapi');
var Joi = require('joi');
var hapiSwaggered = require('hapi-swaggered');
var hapiSwaggeredUi = require('hapi-swaggered-ui');
var _ = require('lodash');

var server = new Hapi.Server();
server.connection({
    port: 7000,
    labels: ['api']
});

server.register({
    register: hapiSwaggered,
    options: {
        cache: false,
        stripPrefix: '/api',
        responseValidation: false,
        descriptions: {
            'api': 'Example foobar description'
        },
        info: {
            title: 'Example API',
            description: 'Powered by node, hapi, joi, hapi-swaggered, hapi-swaggered-ui and swagger-ui',
            version: '1.0'
        }
    }
}, {
    select: 'api',
    routes: {
        prefix: '/swagger'
    }
}, function(err) {
    if (err) {
        throw err;
    }
});

server.register({
    register: hapiSwaggeredUi,
    options: {
        title: 'Example API'
    }
}, {
    select: 'api',
    routes: {
        prefix: '/docs'
    }
}, function(err) {
    if (err) {
        throw err;
    }
});

server.register({
    register: require('./plugins/buildish'),
    options: {}
}, {
    select: 'api',
    routes: {
        prefix: '/api'
    }
}, function(err) {
    if (err) {
        throw err;
    }
});

server.register({
    register: require('./plugins/jobs'),
    options: {}
}, {
    select: 'api',
    routes: {
        prefix: '/api'
    }
}, function(err) {
    if (err) {
        throw err;
    }
});

server.route({
    path: '/',
    method: 'GET',
    handler: function(request, reply) {
        reply.redirect('/docs');
    }
});

server.start(function() {
    console.log('started on http://localhost:7000');
});

