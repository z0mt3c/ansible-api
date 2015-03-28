var Joi = require('joi')
var _ = require('lodash')

var schema = module.exports = {}
var Schema = require('../../common/schema')

schema.Post = Joi.object({
  active: Joi.boolean().required(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required()
}).meta({className: 'UserCreate'})

schema.GetParams = Joi.object({
  id: Schema.ID.required()
}).meta({className: 'ResourceParams'})

schema.Get = Joi.object({
  id: Schema.ID.required()
}).concat(schema.Post).optionalKeys(['password']).meta({className: 'User'})

schema.Put = schema.Post.meta({ className: 'UserPatch' }).optionalKeys(['password'])
schema.Patch = schema.Post.meta({ className: 'UserPatch' }).optionalKeys(_.keys(schema.Post.describe().children))
schema.Query = schema.Post.concat(Schema.Paging).meta({ className: 'UserQuery' }).optionalKeys(_.keys(schema.Post.describe().children))
schema.List = Joi.array().items(schema.Get).meta({className: 'UserList'})
