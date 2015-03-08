var Joi = require('joi');
var _ = require('lodash');

var schema = module.exports = {};
var id = Joi.string().regex(/^[a-f0-9]+$/i).length(24);

schema.Post = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('ansible').default('ansible').optional(),
    description: Joi.string().optional(),
    project: id.required(),
    playbook: Joi.string().required(),
    verbosity: Joi.string().valid(['default', 'verbose', 'debug']).default('default')
}).options({className: 'CreateJob'});

schema.GetParams = Joi.object({
    id: Joi.string().regex(/^[a-f0-9]+$/i).length(24)
}).options({className: 'ResourceParams'});

schema.Put = schema.Post;
var keys = _.keys(schema.Post.describe().children);
schema.Patch = schema.Post.options({className: 'PatchJob'}).optionalKeys(keys);

schema.Get = Joi.object({
    id: Joi.string().regex(/^[a-f0-9]+$/i).length(24)
}).concat(schema.Post).options({className: 'Job'});

schema.List = Joi.array().includes(schema.Get).options({className: 'JobList'});
