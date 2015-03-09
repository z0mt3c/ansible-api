var Spawnish = require('../../../spawnish');





var Execution = function() {
    var args = {
        file: Path.join(options.repositoryPath, doc.project, doc.playbook),
        verbosity: doc.verbosity,
        vars: {}
    };

    this.task = new Spawnish.AnsiblePlaybook(args);
    this._listen(task);

    git.on('std', function(msg) {
        console.log(msg)
    });

    git.run();
};

Execution.prototype._listen = function(task) {
    task.on('stdout', this._stdout);
    task.on('stderr', this._stderr);
    task.on('message', this._message);
    task.on('error', this._error);
    task.on('exit', this._exit);
};







exports.register = function(server, options, next) {
    next();
};

exports.register.attributes = {
    name: 'execution',
    version: require('../../package.json').version
};
