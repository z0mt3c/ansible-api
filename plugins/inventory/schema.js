var Joi = require('joi');
var _ = require('lodash');

var schema = module.exports = {};
var Schema = require('../../common/schema');

schema.Post = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    groups: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        hosts: Joi.array().items(Joi.string()),
        vars: Schema.Vars,
        children: Joi.array().items(Joi.string())
    }))
}).meta({className: 'InventoryCreate'});

schema.GetParams = Joi.object({
    id: Schema.ID.required()
}).meta({className: 'ResourceParams'});

schema.Get = Joi.object({
    id: Schema.ID.required()
}).concat(schema.Post).meta({className: 'Inventory'});

schema.Put = schema.Post;
schema.Patch = schema.Post.meta({ className: 'InventoryPatch' }).optionalKeys(_.keys(schema.Post.describe().children));
schema.Query = schema.Post.concat(Schema.Paging).meta({ className: 'InventoryQuery' }).optionalKeys(_.keys(schema.Post.describe().children));
schema.List = Joi.array().items(schema.Get).meta({className: 'InventoryList'});