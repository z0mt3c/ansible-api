var Joi = require('joi');
var _ = require('lodash');

var schema = module.exports = {};
var id = Joi.string().regex(/^[a-f0-9]+$/i).length(24);

schema.Post = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    type: Joi.string().valid('git').required(),
    url: Joi.string().required(),
    branch: Joi.string().optional()
}).meta({className: 'CreateProject'});

schema.GetParams = Joi.object({
    id: id.required()
}).meta({className: 'ResourceParams'});

schema.Put = schema.Post;
var keys = _.keys(schema.Post.describe().children);
schema.Patch = schema.Post.meta({ className: 'PatchProject' }).optionalKeys(keys);

schema.Get = Joi.object({
    id: id.required()
}).concat(schema.Post).meta({className: 'Project'});

schema.List = Joi.array().items(schema.Get).meta({className: 'ProjectList'});
schema.RepositoryFiles = Joi.array().items(Joi.string()).meta({className: 'RepositoryFiles'});

schema.RunRef = Joi.object({
    runId: id.required()
}).meta({className: 'RunReference'});