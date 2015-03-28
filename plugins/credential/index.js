var Schema = require('./schema')
var ResourceFactory = require('../../common/resourceRoutesFactory')
var tags = ['api', 'credentials']
var Manager = require('./manager')

exports.register = function (server, options, next) {
  var db = server.plugins.mongodb.db
  var collection = db.collection('credential')
  var routes = ResourceFactory.create(collection, {
    schema: Schema,
    prefix: '/credential',
    tags: tags
  })

  var manager = new Manager(collection, options)

  server.expose('prepare', function (id, reply) {
    manager.prepare(id, reply)
  })

  server.route(routes)
  next()
}

exports.register.attributes = {
  name: 'credential',
  version: require('../../package.json').version
}
