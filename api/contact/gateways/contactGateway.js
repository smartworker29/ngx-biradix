'use strict';

var express = require('express');
var _ = require('lodash');
var OrgService = require('../../organizations/services/organizationService')
var BizEmailService = require('../../business/services/emailService')

var Routes = express.Router()

Routes.post('/send', function (req, res) {
    var modelErrors = [];
    var base = "http://" + req.headers.host;

    if (!req.body.name)
    {
        modelErrors.push({param: 'name', msg : 'Please enter your name'});
    }

    if (!req.body.email)
    {
        modelErrors.push({param: 'email', msg : 'Please enter your email'});
    }

    if (!req.body.subject)
    {
        modelErrors.push({param: 'subject', msg : 'Please enter a subject'});
    }

    if (!req.body.message)
    {
        modelErrors.push({param: 'message', msg : 'Please enter a message'});
    }

    if (modelErrors.length > 0) {
        return res.status(200).json({success:false, errors: modelErrors});
    }

    OrgService.read(function (err, orgs) {
        var biradix = _.find(orgs, function(x) {return x.isDefault === true});
        var logo = base + "/images/organizations/" + biradix.logoBig;
        var email = {
            from: req.body.name + " <" + req.body.email +">",
            to: "support@biradix.com",
            logo: logo,
            subject: req.body.subject,
            template: 'contact.html',
            templateData: req.body

        }

       BizEmailService.send(email, function(emailError, status) {

            if (emailError) {
                throw Error(emailError)
            }

            return res.status(200).json({success:true});
        })

    });

})

module.exports = Routes;