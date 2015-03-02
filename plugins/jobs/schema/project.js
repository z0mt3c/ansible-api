var Joi = require('joi');
var _ = require('lodash');

var schema = module.exports = {};
var id = Joi.string().regex(/^[a-f0-9]+$/i).length(24);

schema.Post = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    type: Joi.string().valid('git').required(),
    url: Joi.string().required(),
    branch: Joi.string().optional()
}).options({className: 'CreateProject'});

schema.GetParams = Joi.object({
    id: id.required()
}).options({className: 'ResourceParams'});

schema.Put = schema.Post;
var keys = _.keys(schema.Post.describe().children);
schema.Patch = schema.Post.options({ className: 'PatchProject' }).optionalKeys(keys);

schema.Get = Joi.object({
    id: id.required()
}).concat(schema.Post).options({className: 'Project'});

schema.List = Joi.array().includes(schema.Get).options({className: 'ProjectList'});
