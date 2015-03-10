var Hoek = require('hoek');
var _ = require('lodash');
var ObjectID = require('mongodb').ObjectID;

var Run = function(options) {
    Hoek.assert(options.spawn, 'spawn missing');
    Hoek.assert(options.collection, 'collection missing');
    this.id = new ObjectID();
    this.spawn = options.spawn;
    this.collection = options.collection;
    this.logger = options.logger;
    this.meta = _.pick(options, ['type', 'task', 'repository']);
    this._bind(this.spawn);
};

Run.prototype._bind = function(task) {
    var stdout = _.partial(this._log_output, 'stdout').bind(this);
    var stderr = _.partial(this._log_output, 'stderr').bind(this);
    var message = this._log_message.bind(this);
    var error = this._log_error.bind(this);
    var exit = this._log_exit.bind(this);

    task.on('stdout', stdout);
    task.on('stderr', stderr);
    task.on('message', message);
    task.on('error', error);
    task.on('exit', exit);
};

Run.prototype.save = function(reply) {
    var data = _.extend({_id: this.id, createdAt: new Date()}, this.meta);
    this.collection.insert(data, {w: 1}, function(error) {
        reply(error);
    });
};

Run.prototype.__log = function(error, result) {
    if (error) {
        console.error('Error occurred', error, result);
    }
};

Run.prototype._log_output = function(type, data) {
    var push = {time: new Date(), channel: type, data: data};
    this.collection.update({_id: this.id}, {$push: {output: push}}, this.__log.bind(this));
};

Run.prototype._log_exit = function(code) {
    this.duration = new Date().getTime() - this.startTime;
    this.collection.update({_id: this.id}, {$set: {duration: this.duration, exitCode: code}}, this.__log.bind(this));
};

Run.prototype._log_message = function(data) {
    var push = {time: new Date()};

    if (_.isObject(data)) {
        push = _.extend(push, data);
    } else {
        push.data = data;
    }

    this.collection.update({_id: this.id}, {$push: {messages: push}}, this.__log.bind(this));
};

Run.prototype._log_error = function(error) {
    this.collection.update({_id: this.id}, {$set: {error: error}}, this.__log.bind(this));
};

Run.prototype.start = function() {
    this.startTime = new Date().getTime();
    this.spawn.run();
};

Run.prototype.kill = function(signal) {
    this.spawn.kill(signal);
    this.collection.update({_id: this.id}, {$set: {killedAt: new Date()}}, this.__log.bind(this));
};

module.exports = Run;