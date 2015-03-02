var ObjectID = require('mongodb').ObjectID;
var Boom = require('boom');
var Hoek = require('hoek');
var _ = require('lodash');

var defaults = {
    prefix: '/',
    tags: ['api']
};

module.exports = {
    create: function(db, Schema, options) {
        options = Hoek.applyToDefaults(defaults, options || {});

        var resourceName = Hoek.reach(Schema, 'Get._settings.className').toLowerCase();

        var internals = {
            replyError: function(reply, error) {
                return reply(Boom.badImplementation('Terrible implementation', error))
            },
            replyNotFound: function(reply) {
                return internals.replyNotFound(reply);
            }
        };

        var routes = [];

        routes.push({
            path: options.prefix,
            method: 'GET',
            config: {
                tags: options.tags,
                description: 'List resources',
                notes: 'List resources',
                handler: function(request, reply) {
                    db.collection(resourceName).find({}).toArray(function(error, docs) {
                        if (error) {
                            return internals.replyError(reply, error);
                        }

                        return reply(docs);
                    });
                },
                response: {
                    schema: Schema.List
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
                    params: Schema.GetParams
                },
                handler: function(request, reply) {
                    var objectID = new ObjectID(request.params.id);
                    db.collection(resourceName).findOne({_id: objectID}, function(error, doc) {
                        if (error) {
                            return internals.replyError(reply, error);
                        } else if (!doc) {
                            return internals.replyNotFound(reply);
                        }

                        return reply(doc);
                    });
                },
                response: {
                    schema: Schema.Get
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
                    params: Schema.GetParams
                },
                handler: function(request, reply) {
                    var objectID = new ObjectID(request.params.id);
                    db.collection(resourceName).findOneAndDelete({_id: objectID}, function(error, doc) {
                        console.log(doc);
                        if (error) {
                            return internals.replyError(reply, error);
                        } else if (!doc || !doc.value) {
                            return internals.replyNotFound(reply);
                        }

                        return reply(doc.value);
                    });
                },
                response: {
                    schema: Schema.Get
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
                    payload: Schema.Post
                },
                handler: function(request, reply) {
                    db.collection(resourceName).insertOne(request.payload, {returnOriginal: false}, function(error, doc) {
                        if (error) {
                            return internals.replyError(reply, error);
                        }
                        return reply(request.payload);
                    });
                },
                response: {
                    schema: Schema.Get
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
                    params: Schema.GetParams,
                    payload: Schema.Put
                },
                handler: function(request, reply) {
                    var objectID = new ObjectID(request.params.id);

                    db.collection(resourceName).findOneAndReplace({_id: objectID}, request.payload, {returnOriginal: false}, function(error, doc) {
                        if (error) {
                            return internals.replyError(reply, error);
                        } else if (!doc || !doc.value) {
                            return internals.replyNotFound(reply);
                        }

                        return reply(doc.value);
                    });
                },
                response: {
                    schema: Schema.Get
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
                    params: Schema.GetParams,
                    payload: Schema.Patch
                },
                handler: function(request, reply) {
                    var objectID = new ObjectID(request.params.id);

                    db.collection(resourceName).findOneAndUpdate({_id: objectID}, {$set: request.payload}, {returnOriginal: false}, function(error, doc) {
                        if (error) {
                            return internals.replyError(reply, error);
                        } else if (!doc || !doc.value) {
                            return internals.replyNotFound(reply);
                        }

                        return reply(doc.value);
                    });
                },
                response: {
                    schema: Schema.Get
                }
            }
        });

        return routes;
    }
};
