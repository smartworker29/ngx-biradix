'use strict';
var async = require("async");
var _ = require("lodash")
var moment = require('moment');
var DateService = require('../../utilities/services/dateService')
var DataPointsHelperService = require('./dataPointsHelperService')
var SurveySchema= require('../schemas/surveySchema')

module.exports = {
    getPoints: function(hide,subject,comps,summary,bedrooms,daterange,offset,show,callback) {

        var propertyids = _.pluck(comps,"_id");
        if (!propertyids || propertyids.length == 0) {
            return callback({});
        }

        var query = SurveySchema.find();

        query = query.where("propertyid").in(propertyids);
        var dr = DateService.convertRangeToParts(daterange);

        if (daterange.daterange != "Lifetime") {
            query = query.where("date").gte(dr.start).lte(dr.end);
        }

        var select = "_id date propertyid";

        if (show.occupancy) {
            select += "  occupancy"
        }

        if (show.leases) {
            select += "  weeklyleases"
        }

        if (show.traffic) {
            select += "  weeklytraffic"
        }

        if (show.ner) {
            select += " exclusions floorplans.id floorplans.rent floorplans.concessions floorplans.bedrooms floorplans.bathrooms floorplans.units"
        }

        query = query.select(select)

        query = query.sort("date");

        query.exec(function(err, surveys) {
            if (err) {
                return callback({});
            }

            var bedroomBeakdown = [];

            var points = {};
            var excluded = false;

            if (show.bedrooms && comps[0].survey){
                var includedFps = _.filter(comps[0].survey.floorplans, function (x) {
                    if (x.excluded) {
                        excluded = true;
                    }
                    return !hide || !x.excluded
                });

                bedroomBeakdown =  _.uniq(_.pluck(includedFps, 'bedrooms'));
            }


            surveys.forEach(function(s) {

                var dateKey = parseInt(moment.utc(s.date).add(offset,"minute").startOf("day").subtract(offset,"minute").format('x'));

                points[s.propertyid] = points[s.propertyid] || {};

                if (show.graphs !==  true) {
                    points[s.propertyid].surveys = points[s.propertyid].surveys || {};
                    points[s.propertyid].surveys[dateKey] = s._id;
                }

                if (show.occupancy) {
                    points[s.propertyid].occupancy = points[s.propertyid].occupancy || {};
                    points[s.propertyid].occupancy[dateKey] = s.occupancy;
                }
                if (show.leases) {
                    points[s.propertyid].leases = points[s.propertyid].leases || {};
                    points[s.propertyid].leases[dateKey] = s.weeklyleases;
                }

                if (show.traffic) {
                    points[s.propertyid].traffic = points[s.propertyid].traffic || {};
                    points[s.propertyid].traffic[dateKey] = s.weeklytraffic;
                }

                if (show.ner) {
                    points[s.propertyid].ner = points[s.propertyid].ner || {};

                    var nerPoint = DataPointsHelperService.getNerPoint(s, bedrooms, hide, subject, comps);
                    points[s.propertyid].ner[dateKey] = nerPoint.value;

                    if (nerPoint.excluded) {
                        excluded = true;
                    }

                    bedroomBeakdown.forEach(function(b) {
                        points[s.propertyid][b] = points[s.propertyid][b] || {};
                        points[s.propertyid][b][dateKey] = points[s.propertyid][b][dateKey] || {};

                        nerPoint = DataPointsHelperService.getNerPoint(s, b, hide, subject, comps);
                        points[s.propertyid][b][dateKey] = nerPoint.value;
                    })

                }

            })

            //console.log(points["5577c0f1541b40040baaa5eb"].occupancy)
            for (var prop in points) {

                if (show.graphs === true) {
                    if (show.occupancy) {
                        points[prop].occupancy = DataPointsHelperService.normailizePoints(points[prop].occupancy, offset, dr);
                    }
                    if (show.traffic) {
                        points[prop].traffic = DataPointsHelperService.normailizePoints(points[prop].traffic, offset, dr);
                    }
                    if (show.leases) {
                        points[prop].leases = DataPointsHelperService.normailizePoints(points[prop].leases, offset, dr);
                    }

                    if (show.ner) {
                        points[prop].ner = DataPointsHelperService.normailizePoints(points[prop].ner, offset, dr);

                        bedroomBeakdown.forEach(function (b) {
                            points[prop][b] = DataPointsHelperService.normailizePoints(points[prop][b], offset, dr);
                        })
                    }
                }

                if (show.occupancy) {
                    points[prop].occupancy = DataPointsHelperService.objectToArray(points[prop].occupancy);
                }
                if (show.traffic) {
                    points[prop].traffic = DataPointsHelperService.objectToArray(points[prop].traffic);
                }
                if (show.leases) {
                    points[prop].leases = DataPointsHelperService.objectToArray(points[prop].leases);
                }
                if (show.ner) {
                    points[prop].ner = DataPointsHelperService.objectToArray(points[prop].ner);
                    bedroomBeakdown.forEach(function(b) {
                        points[prop][b] = DataPointsHelperService.objectToArray(points[prop][b]);
                    })
                }

                if (show.occupancy) {
                    points[prop].occupancy = DataPointsHelperService.extrapolateMissingPoints(points[prop].occupancy);
                }
                if (show.traffic) {
                    points[prop].traffic = DataPointsHelperService.extrapolateMissingPoints(points[prop].traffic);
                }
                if (show.leases) {
                    points[prop].leases = DataPointsHelperService.extrapolateMissingPoints(points[prop].leases);
                }

                if (show.ner) {
                    points[prop].ner = DataPointsHelperService.extrapolateMissingPoints(points[prop].ner);
                    bedroomBeakdown.forEach(function(b) {
                        points[prop][b] = DataPointsHelperService.extrapolateMissingPoints(points[prop][b]);
                    })
                }

            }

            if (summary) {
                var newpoints = {averages:{}}
                if (show.occupancy) {
                    DataPointsHelperService.getSummary(points, subject._id, newpoints, 'occupancy');
                }

                if (show.traffic) {
                    DataPointsHelperService.getSummary(points, subject._id, newpoints, 'traffic');
                }

                if (show.leases) {
                    DataPointsHelperService.getSummary(points, subject._id, newpoints, 'leases');
                }

                if (show.ner) {
                    DataPointsHelperService.getSummary(points, subject._id, newpoints, 'ner');
                }

                points = newpoints;
            }

            points.excluded = excluded;
            callback(points);
        });
    },
}