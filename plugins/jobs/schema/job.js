var Joi = require('joi');
var _ = require('lodash');

var schema = module.exports = {};
var id = Joi.string().regex(/^[a-f0-9]+$/i).length(24);

schema.Post = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('ansible').required(),
    description: Joi.string().required(),
    project: id.required(),
    test: Joi.array().includes(Joi.object({test: Joi.string()})),
    test2: Joi.array().includes(Joi.string()),
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
