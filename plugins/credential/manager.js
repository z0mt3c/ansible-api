var Path = require('path');
var Hoek = require('hoek');
var fs = require('fs');
var ObjectID = require('mongodb').ObjectID;
var _ = require('lodash');

var Manager = function Manager(collection, options) {
    Hoek.assert(collection, 'Collection missing');
    Hoek.assert(options, 'Options missing');
    this.collection = collection;
    this.options = options;
};

Manager.prototype.prepare = function(id, reply) {
    id = _.isString(id) ? new ObjectID(id) : id;
    this.collection.findOne({_id: id}, function(error, credential) {
        if (error) {
            return reply(error, null);
        }

        var targetKeyPath = Path.join(this.options.credentialPath, id.toString());
        var ansibleVars = {
            host_key_checking: false,
            ansible_ssh_user: credential.sshUser
        };

        switch (credential.sshAuthType) {
            case 'key':
                ansibleVars = _.extend(ansibleVars, {
                    ansible_ssh_private_key_file: targetKeyPath
                });
                break;
            case 'keyPath':
                ansibleVars = _.extend(ansibleVars, {
                    ansible_ssh_private_key_file: credential.sshKeyPath
                });
                break;
            case 'password':
                ansibleVars = _.extend(ansibleVars, {
                    ansible_ssh_pass: credential.sshPassword
                });
                break;
        }

        if (credential.sshAuthType === 'key') {
            fs.writeFile(targetKeyPath, credential.sshKey, {mode: '600'}, function(error) {
                return reply(error, credential, ansibleVars);
            });
        } else {
            return reply(error, credential, ansibleVars);
        }
    }.bind(this))
};

module.exports = Manager;