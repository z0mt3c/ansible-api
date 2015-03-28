var Schema = require('./schema')
var ResourceFactory = require('../../common/resourceRoutesFactory')
var tags = ['api', 'inventories']

exports.register = function (server, options, next) {
  var db = server.plugins.mongodb.db
  var collection = db.collection('inventory')
  var routes = ResourceFactory.create(collection, {
    schema: Schema,
    prefix: '/inventory',
    tags: tags
  })

  server.route(routes)
  next()
}

exports.register.attributes = {
  name: 'inventory',
  version: require('../../package.json').version
}
