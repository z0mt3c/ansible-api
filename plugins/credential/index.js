exports.register = function(server, options, next) {
    next();
};

exports.register.attributes = {
    name: 'credential',
    version: require('../../package.json').version
};
