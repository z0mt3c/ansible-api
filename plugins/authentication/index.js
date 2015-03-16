var _ = require('lodash');
var ObjectID = require('mongodb').ObjectID;
var schema = require('./schema');
var Boom = require('boom');
var Path = require('path');

exports.register = function(server, options, next) {
    server.views({
        engines: {
            hbs: require('handlebars')
        },
        path: Path.join(__dirname, 'templates')
    });

    server.register(require('hapi-auth-cookie'), function(error) {
        if (error) {
            throw error;
        }

        server.auth.strategy('session', 'cookie', {
            password: 'secret',
            cookie: 'sid',
            redirectTo: false,
            isSecure: false
        });

        var db = server.plugins.mongodb.db;
        var users = db.collection('user');

        server.route({
            method: 'POST',
            path: '/login',
            config: {
                tags: ['authentication'],
                validate: {
                    payload: schema.Login
                },
                handler(request, reply) {
                    if (request.auth.isAuthenticated) {
                        return reply.redirect('/');
                    }

                    users.findOne({ email: request.payload.username }, function(error, user) {
                        if (user && user.password === request.payload.password) {
                            request.auth.session.set({
                                id: user._id.toString(),
                                name: user.name,
                                email: user.email
                            });

                            return reply.redirect('/');
                        } else {
                            return reply.view('login', { message: 'Invalid username/password' });
                        }
                    });
                },
                auth: {
                    mode: 'try',
                    strategy: 'session'
                },
                plugins: {
                    'hapi-auth-cookie': {
                        redirectTo: false
                    }
                }
            }
        });

        server.route({
            method: 'GET',
            path: '/login',
            config: {
                tags: ['authentication'],
                handler(request, reply) {
                    if (request.auth.isAuthenticated) {
                        return reply.redirect('/');
                    }

                    return reply.view('login', {});
                },
                auth: {
                    mode: 'try',
                    strategy: 'session'
                },
                plugins: {
                    'hapi-auth-cookie': {
                        redirectTo: false
                    }
                }
            }
        });

        server.route({
            method: 'GET',
            path: '/logout',
            config: {
                tags: ['authentication'],
                auth: 'session',
                handler(request, reply) {
                    request.auth.session.clear();
                    return reply.redirect('/');
                }
            }
        });

        next();
    });
};

exports.register.attributes = {
    name: 'authentication',
    version: require('../../package.json').version
};
