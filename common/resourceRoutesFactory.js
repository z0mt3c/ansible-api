var ObjectID = require('mongodb').ObjectID;
var Boom = require('boom');
var Hoek = require('hoek');
var _ = require('lodash');
var async = require('async');

var defaults = {
    prefix: '/',
    tags: ['api']
};

var resource = module.exports = {
    internals: {
        prepareQuery: function(rawQuery) {
            var query = _.omit(rawQuery, ['sort', 'skip', 'limit']);
            _.each(query, function(value, key) {
                if (_.isString(value)) {
                    var lastIndexOf = value.lastIndexOf('/');
                    var indexOf = value.indexOf('/');

                    if (indexOf === 0 && lastIndexOf !== 0 && lastIndexOf > value.length - 3) {
                        var pattern = value.substring(1, lastIndexOf);
                        var options = value.substr(lastIndexOf + 1);
                        query[key] = new RegExp(pattern, options);
                    }
                }
            });

            return query || {};
        },
        replyError: function(reply, error) {
            return reply(Boom.badImplementation('Terrible implementation', error))
        },
        replyNotFound: function(reply) {
            return reply(Boom.notFound());
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

        var listDescription = schema.List.describe();
        var listMeta = _.extend.apply(this, [{}].concat(listDescription.meta)) || {};
        var itemProjection = listMeta.itemProjection || {};

        routes.push({
            path: options.prefix,
            method: 'GET',
            config: {
                tags: options.tags,
                description: 'List resources',
                notes: 'List resources',
                validate: {
                    query: schema.Query
                },
                handler: function(request, reply) {
                    var query = resource.internals.prepareQuery(request.query);
                    var cursor = getCollection().find(query, itemProjection).limit(request.query.limit).skip(request.query.skip).sort({_id: -1});

                    async.parallel([
                            function(next) {
                                return cursor.toArray(next);
                            },
                            function(next) {
                                return cursor.count(false, next);
                            }
                        ],
                        function(error, results) {
                            if (error) {
                                return resource.internals.replyError(reply, error);
                            }

                            var from = request.query.skip;
                            var to = (from + results[0].length);
                            var total = results[1];
                            return reply(results[0]).header('X-Result-Count', from + '-' + to + '/' + total);
                        });
                },
                response: {
                    failAction: 'log',
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
                    failAction: 'log',
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
                    failAction: 'log',
                    schema: schema.Get
                }
            }
        });

        if (schema.Post) {
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
                        failAction: 'log',
                        schema: schema.Get
                    }
                }
            });
        }


        if (schema.Put) {
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
                        failAction: 'log',
                        schema: schema.Get
                    }
                }
            });
        }

        if (schema.Patch) {
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
                        failAction: 'log',
                        schema: schema.Get
                    }
                }
            });
        }

        return routes;
    }
};
