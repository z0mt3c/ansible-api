var Joi = require('joi');

var schema = module.exports = {};
schema.Login = Joi.object({
    username: Joi.string().email().required(),
    password: Joi.string().required()
}).meta({className: 'Login'});