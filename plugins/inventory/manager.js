var Path = require('path');
var Hoek = require('hoek');
var fs = require('fs');
var ObjectID = require('mongodb').ObjectID;
var _ = require('lodash');

var Manager = function Manager(inventoryCollection, hostCollection, options) {
    Hoek.assert(inventoryCollection, 'inventoryCollection missing');
    Hoek.assert(hostCollection, 'hostCollection missing');
    Hoek.assert(options, 'Options missing');
    this.hostCollection = hostCollection;
    this.inventoryCollection = inventoryCollection;
    this.options = options;
};

Manager.prototype.prepare = function(id, reply) {
    id = _.isString(id) ? new ObjectID(id) : id;

    var inventoryCollection = this.inventoryCollection;
    var hostCollection = this.hostCollection;

    inventoryCollection.findOne(id, function(error, inventory) {
        Hoek.assert(!error, 'Error while fetchting inventory');
        Hoek.assert(inventory, 'Inventory not found');

        var containingHosts = _.unique(_.reduce(inventory.groups, function(memo, group) {
            if (_.isArray(group.hosts) && group.hosts.length > 0) {
                memo = memo.concat(group.hosts);
            }
            return memo;
        }, []));

        hostCollection.find({name: {$in: containingHosts}}, {name: 1, vars: 1}).toArray(function(error, hostDocuments) {
            Hoek.assert(!error, 'Error while fetchting hosts');

            var result = _.indexBy(inventory.groups, 'name');
            var hostvars = _.reduce(hostDocuments, function(memo, entry) {
                memo[entry.name] = entry.vars;
                return memo;
            }, {});

            result = _.extend({_meta: {hostvars: hostvars}}, result);
            return reply(null, inventory, result);
        });
    });
};

module.exports = Manager;