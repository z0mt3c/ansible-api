var Joi = require('joi');
var _ = require('lodash');

var schema = module.exports = {};
var id = Joi.string().regex(/^[a-f0-9]+$/i).length(24);

schema.Job = Joi.object({
    type: Joi.string().valid('repository', 'task').required(),
    referenceId: id.required()
}).meta({className: 'Job'});

schema.GetParams = Joi.object({
    id: Joi.string().regex(/^[a-f0-9]+$/i).length(24)
}).meta({className: 'ResourceParams'});