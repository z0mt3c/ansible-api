var Joi = require('joi')
var schema = module.exports = {}
schema.ID = Joi.string().regex(/^[a-f0-9]+$/i).length(24)
schema.Paging = Joi.object({
  limit: Joi.number().integer().min(1).default(10).optional(),
  skip: Joi.number().integer().min(0).default(0).optional(),
  sort: Joi.string().optional()
}).meta({className: 'Paging'})

schema.Vars = Joi.object().pattern(/./, [Joi.number(), Joi.string()]).optional()
