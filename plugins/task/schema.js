var Joi = require('joi');
var _ = require('lodash');
var Schema = require('../../common/schema');
var schema = module.exports = {};

schema.Post = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('ansible').optional(),
    runType: Joi.string().valid('normal', 'check').default('normal').optional(),
    description: Joi.string().allow('').optional(),
    repositoryId: Schema.ID.required(),
    inventoryId: Schema.ID.required(),
    credentialId: Schema.ID.required(),
    playbook: Joi.string().required(),
    forks: Joi.number().default(0).optional(),
    extraVars: Schema.Vars,
    hostLimit: Joi.string().allow('').optional(),
    verbosity: Joi.string().valid(['default', 'verbose', 'debug'])
}).meta({className: 'TaskCreate'});

schema.GetParams = Joi.object({
    id: Schema.ID
}).meta({className: 'ResourceParams'});

schema.Put = schema.Post;
schema.Patch = schema.Post.meta({className: 'TaskPatch'}).optionalKeys(_.keys(schema.Post.describe().children));
schema.Query = Schema.Paging.meta({className: 'TaskQuery'});

schema.Get = Joi.object({
    id: Schema.ID
}).concat(schema.Post).meta({className: 'Task'});

schema.List = Joi.array().items(schema.Get).meta({className: 'TaskList'});

schema.RunRef = Joi.object({
    runId: Schema.ID.required()
}).meta({className: 'RunReference'});
