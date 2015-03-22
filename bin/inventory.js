#!/usr/bin/env node
var fs = require('fs');
var argv = require('yargs').argv;
var Hoek = require('hoek');

var dummyResult = {
    _meta: {
        hostvars: {
            'mongo001.int.w0rk.de': {asdf: 1234}
        }
    },
    mongodb: {
        hosts: ['mongo001.int.w0rk.de'],
        vars: {
            b: false
        },
        children: ['mongodb2']
    },
    mongodb2: ['mongo001.int.w0rk.de']
};

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;

var inventoryId = process.env['ANSIBLE_MASTER_INVENTORY_ID'];
Hoek.assert(inventoryId, 'No inventory id present');
var options = {url: 'mongodb://localhost:27017/ansible'};

var internals = {
    log: function(data) {
        fs.writeFileSync(__dirname + '/test.log', data);
    },
    result: function(result) {
        var formattedResult = JSON.stringify(result || {}, null, '  ');
        internals.log(formattedResult);
        console.log(formattedResult);
    }
};

MongoClient.connect(options.url, function(error, db) {
    Hoek.assert(!error, 'DB Connection failed');
    var inventories = db.collection('inventory');

    inventories.findOne(new ObjectID(inventoryId), function(error, inventory) {
        Hoek.assert(!error, 'Error while fetchting inventory');
        Hoek.assert(inventory, 'Inventory not found');
        //console.log(inventory);
        internals.result(dummyResult);
        db.close();
    });
});