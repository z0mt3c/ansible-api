var Schema = require('./schema')
var ResourceFactory = require('../../common/resourceRoutesFactory')
var tags = ['api', 'inventories']
var Hoek = require('hoek')

exports.register = function (server, options, next) {
  var db = server.plugins.mongodb.db
  var collection = db.collection('host')
  var routes = ResourceFactory.create(collection, {
    schema: Schema,
    prefix: '/host',
    tags: tags
  })

  server.on('log', function (message, tags) {
    if (tags.push && tags.task && tags.ansible && tags.facts) {
      var messageData = Hoek.reach(message.data, 'update.$push.messages')
      var facts = Hoek.reach(message, 'result.ansible_facts')
      var host = messageData.host
      collection.updateOne({ name: host }, { $set: { factsUpdated: new Date(), facts: facts }}, { upsert: true }, function (error) {
        if (error) {
          server.log(['error', 'host', 'facts'], 'Error during facts persistence', error)
        }
      })
    }
  })

  server.route(routes)
  next()
}

exports.register.attributes = {
  name: 'host',
  version: require('../../package.json').version
}
