exports.register = function(server, options, next) {
    next();
};

exports.register.attributes = {
    name: 'inventory',
    version: require('../../package.json').version
};
