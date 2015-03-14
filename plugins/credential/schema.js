var Joi = require('joi');
var _ = require('lodash');

var schema = module.exports = {};
var Schema = require('../../common/schema');

schema.Post = Joi.object({
    name: Joi.string().required()
}).meta({className: 'CredentialCreate'});

schema.GetParams = Joi.object({
    id: Schema.ID.required()
}).meta({className: 'ResourceParams'});

schema.Get = Joi.object({
    id: Schema.ID.required()
}).concat(schema.Post).meta({className: 'Credential'});

schema.Put = schema.Post;
schema.Patch = schema.Post.meta({ className: 'CredentialPatch' }).optionalKeys(_.keys(schema.Post.describe().children));
schema.Query = schema.Post.concat(Schema.Paging).meta({ className: 'CredentialQuery' }).optionalKeys(_.keys(schema.Post.describe().children));
schema.List = Joi.array().items(schema.Get).meta({className: 'CredentialList'});