var settings = require('../config/settings')
var errors = require("../config/error")

var d= require("domain").create();

d.on("error", function(err) {
    console.log(err);
    errors.send(err);
});

d.run(function() {
    var mongoose = require('mongoose');
    var queues = require("../config/queues")

    var connectedCount = 0;

    queues.connect(function () {
        connectedCount++;
        ready();
    })

    mongoose.connect(settings.MONGODB_URI);
    var conn = mongoose.connection;
    conn.once('open', function () {
        console.log({type: 'info', msg: 'connected', service: 'mongodb'});
        connectedCount++;
        ready();
    });


    function ready() {
        if (connectedCount < 2) {
            return;
        }

        var clusterConfig = require('../config/cluster')

        //Initialize CPU clustering
        clusterConfig.init({maxThreads: 1}, function (workerId) {
            console.log('WorkerID: %s', workerId)
            require('../api/properties/consumers/dashboardConsumer')
        });

    }
});


