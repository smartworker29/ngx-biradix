'use strict';
var express = require('express');
var _ = require('lodash');
var packages = require('../package.json');
var OrgService = require('../api/organizations/services/organizationService')
var newrelic = require('newrelic');
module.exports = (function() {

    var ui = express.Router();

    ui.get('/', function (req, res) {
        var subdomain = req.hostname.split('.')[0].toLowerCase();

        OrgService.read(function(err, orgs) {

            var org = _.find(orgs, function(org) { return org.subdomain.toLowerCase() == subdomain})

            if (!org) {
                org = _.find(orgs, function(org) { return org.isDefault === true })
            }

            var phantom = req.headers['user-agent'].indexOf('PhantomJS') > -1;
            var local = (subdomain == 'localhost' || phantom);

            res.render('index', {version: packages.version, logoBig: org.logoBig, logoSmall : org.logoSmall, local: local, phantom: phantom,
                nreum : newrelic.getBrowserTimingHeader()
            });

        })

    })

    return ui;
})();