exports.register = function(server, options, next) {
    next();
};

exports.register.attributes = {
    name: 'result',
    version: require('../../package.json').version
};
