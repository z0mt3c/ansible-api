#!/usr/bin/env node
var fs = require('fs');
var argv = require('yargs').argv;
var Hoek = require('hoek');
var _ = require('lodash');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;

var options = {url: 'mongodb://localhost:27017/ansible'};

var internals = {
    assert: function(condition, message) {
        if (!condition) {
            console.error('ERROR: ' + message);
            process.exit(1);
        }
    },
    result: function(result) {
        var formattedResult = JSON.stringify(result || {}, null, '  ');
        console.log(formattedResult);
    }
};

var inventoryId = process.env['ANSIBLE_MASTER_INVENTORY_ID'];
internals.assert(inventoryId, 'No inventory id present');

MongoClient.connect(options.url, function(error, db) {
    internals.assert(!error, 'DB Connection failed');
    var inventories = db.collection('inventory');
    var hosts = db.collection('host');

    inventories.findOne(new ObjectID(inventoryId), function(error, inventory) {
        internals.assert(!error, 'Error while fetchting inventory');
        internals.assert(inventory, 'Inventory not found');

        var containingHosts = _.unique(_.reduce(inventory.groups, function(memo, group) {
            if (_.isArray(group.hosts) && group.hosts.length > 0) {
                memo = memo.concat(group.hosts);
            }
            return memo;
        }, []));

        hosts.find({name: {$in: containingHosts}}, {name: 1, vars: 1}).toArray(function(error, hostDocuments) {
            internals.assert(!error, 'Error while fetchting hosts');

            var result = _.indexBy(inventory.groups, 'name');
            var hostvars = _.reduce(hostDocuments, function(memo, entry) {
                memo[entry.name] = entry.vars;
                return memo;
            }, {});

            result = _.extend({_meta: {hostvars: hostvars}}, result);
            internals.result(result);

            db.close();
        });
    });
});
