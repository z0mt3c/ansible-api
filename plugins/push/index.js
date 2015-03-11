var SocketIO = require('socket.io');

exports.register = function(plugin, options, next) {
    var server = plugin.select('api');

    // TODO: implement logging through websockets through hapi log events
    var io = SocketIO.listen(server.listener, {log: false});

    var internals = {
        onTaskMessage(data) {
            var message = data.data;
            io.in('task:' + message.id).emit('task:update', message);
        }
    };

    io.sockets.on('connection', function(socket) {
        console.log('connection');

        socket.on('task:listen', function(taskId) {
            if (taskId && taskId.length === 24) {
                if (socket.taskListen) {
                    socket.leave(socket.taskListen);
                }

                var room = 'task:' + taskId;
                console.log('joined: ' + room);
                socket.join(room);
                socket.taskListen = room;
            }
        });

        socket.on('disconnect', function() {
            console.log('disconnect');
        });
    });

    server.on('log', function(message, tags) {
        if (tags.push && tags.task) {
            internals.onTaskMessage(message);
        }
    });

    next();
};

exports.register.attributes = {
    name: 'push',
    version: require('../../package.json').version
};
