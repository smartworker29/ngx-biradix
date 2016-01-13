'use strict';
var express = require('express');
var async = require("async");
var _ = require("lodash")
var Routes = express.Router();
/////////////////////////////////
var userService = require('../../users/services/userService')
var queueService = require('../services/queueService');

Routes.get('/notifications', function (req, res) {
    userService.getUsersForNotifications(function (err, users) {
        async.eachLimit(users, 10, function (user, callbackp) {
            userService.getFullUser(user, function(full) {
                full.operator.settings.notifications.last = new Date();
                userService.updateSettings(full.operator, full.operator.settings, {ip: '127.0.0.1', user_agent: 'server'}, function () {
                    queueService.sendNotification(full.operator, full.operator.settings.notifications.props, function() {})
                    callbackp()
                });
            })

        }, function (err) {
            res.status(200).json({queued: users.length})
        });

    });
});

module.exports = Routes;