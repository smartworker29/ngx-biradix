'use strict';
var async = require("async");
var _ = require("lodash")
var uuid = require('node-uuid');
var PropertyService = require('../services/propertyService')
var PropertyHelperService = require('../services/propertyHelperService')
var AmenitiesService = require('../../amenities/services/amenityService')
var CreateService = require('../services/createService')
var SurveyHelperService = require('../services/surveyHelperService')

module.exports = {
    cloneCustom(operator, context, property, orgid, callback) {
        var fp_map = {};
        var newid;
        property.floorplans.forEach(function(fp) {
            newid = uuid.v1();
            fp_map[fp.id] = newid;
            fp.id = newid;
        })


        var newProperty = _.cloneDeep(property);
        newProperty.isCustom = true;

        if (orgid) {
            newProperty.orgid = orgid;
        }
        else {
            delete newProperty.orgid;
        }
        newProperty.comps = [];
        newProperty.media = [];

        AmenitiesService.search({}, function(err, amenities) {
            PropertyHelperService.fixAmenities(newProperty,amenities);

            CreateService.create(operator,  context, newProperty, function (err, newprop) {
                SurveyHelperService.getAllSurveys(property._id, function(err,surveys) {
                    var newSurvey;
                    async.each(surveys, function(survey, callbacks) {
                        newSurvey = JSON.parse(JSON.stringify(survey));
                        delete newSurvey._id;

                        newSurvey.floorplans.forEach(function(fp) {
                            if (fp.id && fp_map[fp.id]) {
                                fp.id = fp_map[fp.id];
                            }
                        })

                        PropertyService.createSurvey(operator,context,null,newprop._id,newSurvey,function(err, created) {
                            callbacks();
                        })
                    }, function() {
                        callback(newprop._id);
                    })

                })

            });
        });
    },
    getClonedComps(operator, context, subject, compids, callback) {
        var self = this;
        if (subject.custom && subject.custom.owner) {
            PropertyService.search(operator, {
                limit: 100,
                permission: 'PropertyView',
                ids: compids,
                select: "*"}, function(err, comps) {

                var newcompids = [];
                async.each(compids, function(compid, callbacks) {

                    var comp = _.find(comps, function(x) {return x._id.toString() == compid.toString()});
                    if (comp.custom && comp.custom.owner) {
                        newcompids.push(compid);
                        callbacks();
                    } else {
                        self.cloneCustom(operator, context, comp, null, function(newCompId) {
                            newcompids.push(newCompId);
                            callbacks();
                        })

                    }
                }, function() {
                    return callback(newcompids);
                })



            });
        } else {
            return callback(compids);
        }

    }
}