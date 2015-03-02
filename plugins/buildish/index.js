var Hapi = require('hapi');
var Joi = require('joi');
var Path = require('path');
var SocketIO = require('socket.io');
var Spawnish = require('../../../spawnish');

exports.register = function (plugin, options, next) {
    var server = plugin.select('api');

    server.views({
        engines: {
            hbs: require('handlebars')
        },
        relativeTo: __dirname,
        path: './templates'
    });

    var io = SocketIO.listen(server.listener, {log: false});
    io.sockets.on('connection', function (socket) {
        socket.emit('queue', []);

        socket.on('say', function (msg) {
            socket.emit('echo', 'you said: ' + msg);
        });
    });
/*
    server.route({
        path: '/test',
        method: 'GET',
        config: {
            tags: ['api'],
            description: 'My route description',
            notes: 'My route notes',
            handler: function (request, reply) {
                reply.view('index');
            }
        }
    });
*/
    next();
};

exports.register.attributes = {
    name: 'info',
    version: '1.0.0'
};
