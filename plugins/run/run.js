var Hoek = require('hoek')
var _ = require('lodash')
var ObjectID = require('mongodb').ObjectID

var Run = function (options) {
  Hoek.assert(options.spawn, 'spawn missing')
  Hoek.assert(options.collection, 'collection missing')
  this.id = new ObjectID()
  this.spawn = options.spawn
  this.collection = options.collection
  this.log = options.log
  this.meta = _.pick(options, ['type', 'task', 'repository'])
  this._bind(this.spawn)
}

Run.prototype._bind = function (task) {
  var stdout = _.partial(this._log_output, 'stdout').bind(this)
  var stderr = _.partial(this._log_output, 'stderr').bind(this)
  var message = this._log_message.bind(this)
  var error = this._log_error.bind(this)
  var exit = this._log_exit.bind(this)
  task.on('stdout', stdout)
  task.on('stderr', stderr)
  task.on('message', message)
  task.on('error', error)
  task.on('exit', exit)
}

Run.prototype.save = function (reply) {
  var data = _.extend({_id: this.id, createdAt: new Date()}, this.meta)
  this.collection.insert(data, {w: 1}, function (error) {
    reply(error)
  })
}

Run.prototype.__apply = function (update) {
  this.collection.update({_id: this.id}, update, function (error, result) {
    if (error) {
      console.error('Error occurred', error, result)
    }
  })

  if (this.log) {
    this.log({ id: this.id.toString(), update: update })
  }
}

Run.prototype._log_output = function (type, data) {
  var push = {time: new Date(), channel: type, data: data}
  this.__apply({$push: {output: push}})
}

Run.prototype._log_exit = function (code) {
  this.duration = new Date().getTime() - this.startTime
  this.__apply({$set: {duration: this.duration, exitCode: code}})
}

Run.prototype._log_message = function (data) {
  var push = {time: new Date()}

  if (_.isObject(data)) {
    push = _.extend(push, data)
  } else {
    push.data = data
  }

  this.__apply({$push: {messages: push}})
}

Run.prototype._log_error = function (error) {
  this.__apply({$set: {error: error}})
}

Run.prototype.start = function () {
  this.startTime = new Date().getTime()
  this.spawn.run()
}

Run.prototype.kill = function (signal) {
  this.spawn.kill(signal)
  this.__apply({$set: {killedAt: new Date()}})
}

module.exports = Run
