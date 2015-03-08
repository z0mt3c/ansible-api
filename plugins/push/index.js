var SocketIO = require('socket.io');

exports.register = function(plugin, options, next) {
    var server = plugin.select('api');

    // TODO: implement logging through websockets through hapi log events
    var io = SocketIO.listen(server.listener, {log: false});
    io.sockets.on('connection', function(socket) {
        socket.emit('queue', []);

        socket.on('say', function(msg) {
            socket.emit('echo', 'you said: ' + msg);
        });
    });

    next();
};

exports.register.attributes = {
    name: 'push',
    version: require('../../package.json').version
};
