var ObjectID = require('mongodb').ObjectID;
var Boom = require('boom');
var Hoek = require('hoek');
var _ = require('lodash');

var defaults = {
    prefix: '/',
    tags: ['api']
};

var resource = module.exports = {
    internals: {
        replyError: function(reply, error) {
            return reply(Boom.badImplementation('Terrible implementation', error))
        },
        replyNotFound: function(reply) {
            return internals.replyNotFound(reply);
        }
    },
    create: function(db, options) {
        Hoek.assert(options.collection);
        options = Hoek.applyToDefaults(defaults, options || {});

        var schema = options.schema;
        var routes = [];

        var getCollection = function() {
            return db.collection(options.collection);
        };

        routes.push({
            path: options.prefix,
            method: 'GET',
            config: {
                tags: options.tags,
                description: 'List resources',
                notes: 'List resources',
                handler: function(request, reply) {
                    getCollection().find({}).toArray(function(error, docs) {
                        if (error) {
                            return resource.internals.replyError(reply, error);
                        }

                        return reply(docs);
                    });
                },
                response: {
                    schema: schema.List
                }
            }
        });

        routes.push({
            path: options.prefix + '/{id}',
            method: 'GET',
            config: {
                tags: options.tags,
                description: 'List resources',
                notes: 'List resources',
                validate: {
                    params: schema.GetParams
                },
                handler: function(request, reply) {
                    var objectID = new ObjectID(request.params.id);
                    getCollection().findOne({_id: objectID}, function(error, doc) {
                        if (error) {
                            return resource.internals.replyError(reply, error);
                        } else if (!doc) {
                            return resource.internals.replyNotFound(reply);
                        }

                        return reply(doc);
                    });
                },
                response: {
                    schema: schema.Get
                }
            }
        });

        routes.push({
            path: options.prefix + '/{id}',
            method: 'DELETE',
            config: {
                tags: options.tags,
                description: 'Delete resource with ID',
                notes: 'Delete resource with ID',
                validate: {
                    params: schema.GetParams
                },
                handler: function(request, reply) {
                    var objectID = new ObjectID(request.params.id);
                    getCollection().findOneAndDelete({_id: objectID}, function(error, doc) {
                        console.log(doc);
                        if (error) {
                            return resource.internals.replyError(reply, error);
                        } else if (!doc || !doc.value) {
                            return resource.internals.replyNotFound(reply);
                        }

                        return reply(doc.value);
                    });
                },
                response: {
                    schema: schema.Get
                }
            }
        });

        routes.push({
            path: options.prefix,
            method: 'POST',
            config: {
                tags: options.tags,
                description: 'Create resource',
                notes: 'Create resource',
                validate: {
                    payload: schema.Post
                },
                handler: function(request, reply) {
                    getCollection().insertOne(request.payload, {returnOriginal: false}, function(error, doc) {
                        if (error) {
                            return resource.internals.replyError(reply, error);
                        }
                        return reply(request.payload);
                    });
                },
                response: {
                    schema: schema.Get
                }
            }
        });

        routes.push({
            path: options.prefix + '/{id}',
            method: 'PUT',
            config: {
                tags: options.tags,
                description: 'Update resource with ID',
                notes: 'Update resource with ID',
                validate: {
                    params: schema.GetParams,
                    payload: schema.Put
                },
                handler: function(request, reply) {
                    var objectID = new ObjectID(request.params.id);

                    getCollection().findOneAndReplace({_id: objectID}, request.payload, {returnOriginal: false}, function(error, doc) {
                        if (error) {
                            return resource.internals.replyError(reply, error);
                        } else if (!doc || !doc.value) {
                            return resource.internals.replyNotFound(reply);
                        }

                        return reply(doc.value);
                    });
                },
                response: {
                    schema: schema.Get
                }
            }
        });

        routes.push({
            path: options.prefix + '/{id}',
            method: 'PATCH',
            config: {
                tags: options.tags,
                description: 'Patch resource with ID',
                notes: 'Patch resource with ID',
                validate: {
                    params: schema.GetParams,
                    payload: schema.Patch
                },
                handler: function(request, reply) {
                    var objectID = new ObjectID(request.params.id);

                    getCollection().findOneAndUpdate({_id: objectID}, {$set: request.payload}, {returnOriginal: false}, function(error, doc) {
                        if (error) {
                            return resource.internals.replyError(reply, error);
                        } else if (!doc || !doc.value) {
                            return resource.internals.replyNotFound(reply);
                        }

                        return reply(doc.value);
                    });
                },
                response: {
                    schema: schema.Get
                }
            }
        });

        return routes;
    }
};
