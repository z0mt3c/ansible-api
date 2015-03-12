var Joi = require('joi');
var _ = require('lodash');

var schema = module.exports = {};
var Schema = require('../../common/schema');

schema.Post = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    type: Joi.string().valid('git').required(),
    url: Joi.string().required(),
    branch: Joi.string().optional()
}).meta({className: 'RepositoryCreate'});

schema.GetParams = Joi.object({
    id: Schema.ID.required()
}).meta({className: 'ResourceParams'});


schema.Get = Joi.object({
    id: Schema.ID.required()
}).concat(schema.Post).meta({className: 'Repository'});

schema.Put = schema.Post;
schema.Patch = schema.Post.meta({ className: 'RepositoryPatch' }).optionalKeys(_.keys(schema.Post.describe().children));
schema.Query = schema.Post.concat(Schema.Paging).meta({ className: 'RepositoryQuery' }).optionalKeys(_.keys(schema.Post.describe().children));

schema.List = Joi.array().items(schema.Get).meta({className: 'RepositoryList'});
schema.RepositoryFiles = Joi.array().items(Joi.string()).meta({className: 'RepositoryFiles'});

schema.RunRef = Joi.object({
    runId: Schema.ID.required()
}).meta({className: 'RunReference'});