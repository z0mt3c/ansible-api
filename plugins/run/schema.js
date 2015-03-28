var Joi = require('joi')

var Schema = require('../../common/schema')
var schema = module.exports = {}

schema.Get = Joi.object({
  type: Joi.string().valid('repository', 'task').required()
}).meta({className: 'Run'})

schema.List = Joi.array().items(schema.Get).meta({className: 'RunList', itemProjection: { messages: 0, output: 0 }})

schema.GetParams = Joi.object({
  id: Schema.ID.required()
}).meta({className: 'ResourceParams'})

schema.Query = Joi.object({
  type: Joi.string().optional()
}).concat(Schema.Paging).meta({className: 'RunQuery'})
