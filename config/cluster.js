'use strict';
var settings = require('./settings.js')
var cluster = require('cluster');
var os = require('os');

module.exports = {
        init: function (options,callback) {

            if ((cluster.isMaster) && (process.execArgv.indexOf('--debug') < 0) && (settings.MODE === 'production') && (process.execArgv.indexOf('--singleProcess') < 0)) {
                // Count the machine's CPUs
                var cpuCount = os.cpus().length;

                if ((options.maxThreads || 0) < cpuCount) {
                    cpuCount = options.maxThreads;
                }

                // Create a worker for each CPU
                for (var i = 0; i < cpuCount; i += 1) {
                    console.log('forking ', i);
                    cluster.fork();
                }

                // Listen for dying workers
                cluster.on('exit', function (worker) {
                    // Replace the dead worker, we're not sentimental
                    console.log('Worker ' + worker.id + ' died :(');
                    cluster.fork();

                });

                // Code to run if we're in a worker process
            } else {

                var workerId = 0;
                if (!cluster.isMaster) {
                    workerId = cluster.worker.id;
                }

                callback(workerId);
            }
        }
}