exports.register = function(server, options, next) {
    next();
};

exports.register.attributes = {
    name: 'execution',
    version: require('../../package.json').version
};
