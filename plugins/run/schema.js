var Joi = require('joi');
var _ = require('lodash');

var Schema = require('../../common/schema');
var schema = module.exports = {};
var id = Joi.string().regex(/^[a-f0-9]+$/i).length(24);

schema.Get = Joi.object({
    type: Joi.string().valid('repository', 'task').required()
}).meta({className: 'Run'});

schema.List = Joi.array().items(schema.Get).meta({className: 'RunList', itemProjection: { messages: 0, output: 0 }});

schema.GetParams = Joi.object({
    id: Schema.ID.required()
}).meta({className: 'ResourceParams'});

schema.Query = schema.Get.concat(Schema.Paging).meta({className: 'RunQuery'}).optionalKeys(_.keys(schema.Get.describe().children));