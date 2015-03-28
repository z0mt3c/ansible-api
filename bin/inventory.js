#!/usr/bin/env node
var fs = require('fs');
var argv = require('yargs').argv;
var Hoek = require('hoek');
var _ = require('lodash');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;
var async = require('async');
var Path = require('path');

var CredentialManager = require('../plugins/credential/manager');
var InventoryManager = require('../plugins/inventory/manager');

var config = require('../config');

var inventoryId = process.env['ANSIBLE_MASTER_INVENTORY_ID'];
Hoek.assert(inventoryId, 'No inventory id present');

var credentialID = process.env['ANSIBLE_MASTER_CREDENTIAL_ID'];
Hoek.assert(credentialID, 'No credential id present');

MongoClient.connect(config.mongodb, function (error, db) {
  Hoek.assert(!error, 'DB Connection failed');
  async.parallel([
    function (next) {
      var inventoryManager = new InventoryManager(db.collection('inventory'), db.collection('host'), config);
      inventoryManager.prepare(new ObjectID(inventoryId), function (error, inventory, result) {
        Hoek.assert(!error, 'Error while fetchting credential');
        Hoek.assert(inventory || result, 'Inventory not found');
        return next(null, result);
      });
    },
    function (next) {
      var credentialManager = new CredentialManager(db.collection('credential'), config);
      credentialManager.prepare(new ObjectID(credentialID), function (error, credential, ansibleVars) {
        Hoek.assert(!error, 'Error while fetchting credential');
        Hoek.assert(credential, 'Credential not found');
        Hoek.assert(credential.type === 'machine', 'Wrong credential type');
        return next(null, ansibleVars);
      });
    }
  ], function (error, results) {
    var result = results[0];
    var credentialVars = results[1];

    var all = result.all = result.all || {vars: {}};
    all.vars = _.extend(all.vars || {}, credentialVars);

    db.close();

    // finally: return the result
    console.log(JSON.stringify(result || {}, null, '  '));
  });
});
