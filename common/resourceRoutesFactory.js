var ObjectID = require('mongodb').ObjectID;
var Boom = require('boom');
var Hoek = require('hoek');
var _ = require('lodash');
var async = require('async');
var xResultCount = require('x-result-count');
var bcrypt = require('bcrypt');

var defaults = {
    prefix: '/',
    tags: ['api']
};

var resource = module.exports = {
    internals: {
        prepareSort: function(sort) {
            if (typeof sort === 'string' && sort.length > 2) {
                var firstChar = sort.substr(0, 1);
                var asc = firstChar === '+';
                var desc = firstChar === '-';
                var field = asc || desc ? sort.substr(1) : sort;

                if (field === 'id') {
                    field = '_id';
                }

                var sort = {};
                sort[field] = asc ? 1 : -1;
                return sort;
            }

            return {_id: -1};
        },
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

            return query || {};
        },
        replyError: function(reply, error) {
            return reply(Boom.badImplementation('Terrible implementation', error))
        },
        replyNotFound: function(reply) {
            return reply(Boom.notFound());
        }
    },
    create: function(collection, options) {
        options = Hoek.applyToDefaults(defaults, options || {});

        var schema = options.schema;
        var routes = [];

        var getCollection = function() {
            return collection;
        };

        var listDescription = schema.List.describe();
        var listMeta = _.extend.apply(this, [{}].concat(listDescription.meta)) || {};
        var itemProjection = listMeta.itemProjection || {};

        routes.push({
            path: options.prefix,
            method: 'GET',
            config: {
                auth: 'session',
                tags: options.tags,
                description: 'List resources',
                notes: 'List resources',
                validate: {
                    query: schema.Query
                },
                handler: function(request, reply) {
                    var query = resource.internals.prepareQuery(request.query);
                    var sort = resource.internals.prepareSort(request.query.sort);
                    var cursor = getCollection().find(query, itemProjection).limit(request.query.limit).skip(request.query.skip).sort(sort);

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

                            return reply(results[0]).header('X-Result-Count', xResultCount.generate({
                                skip: request.query.skip,
                                count: results[0].length,
                                total: results[1]
                            }));
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
                auth: 'session',
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
                auth: 'session',
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
                    auth: 'session',
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
                    auth: 'session',
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
                    auth: 'session',
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
