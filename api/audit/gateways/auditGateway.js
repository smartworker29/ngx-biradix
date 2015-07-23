'use strict';

var express = require('express');
var AuditService = require('../services/auditService')
var AccessService = require('../../access/services/accessService')
var Routes = express.Router();

Routes.post('/', function (req, res) {
    AccessService.canAccess(req.user,"History", function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        AuditService.get(req.body, function (err, obj, pager) {
            if (err) {
                return res.status(200).json({errors: err});
            }

            return res.status(200).json({errors: null, activity: obj, pager: pager, audits: AuditService.audits});
        });

    })
});

module.exports = Routes;