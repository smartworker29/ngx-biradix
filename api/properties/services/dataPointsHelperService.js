'use strict';
var async = require("async");
var _ = require("lodash")
var moment = require('moment');

var WEEK = 7 * 24 * 60 * 60 * 1000;

module.exports = {
    getNerPoint: function(s, bedrooms, hide, subject, comps) {
        var fps = _.flatten(s.floorplans);

        if (bedrooms > -1) {
            fps = _.filter(fps, function (x) {
                return x.bedrooms == bedrooms
            })
        }

        var excluded = false;
        if (hide) {
            var excfps = [];

            //remove any historical exclusions saved in each survey
            if (s.exclusions && s.exclusions.length > 0) {
                var exc = _.find(s.exclusions, function (x) {
                    return x.subjectid == subject._id
                });

                if (exc) {
                    excfps = excfps.concat(exc.floorplans.map(function (x) {
                        return x.toString()
                    }));
                }
            }

            //compare current floorplan to current exclusions to get a current exclusion list
            var currentfps = _.pluck(_.find(comps, function (x) {
                return x._id == s.propertyid
            }).floorplans, "id").map(function (x) {
                return x.toString()
            });

            var incfps = _.find(subject.comps, function (x) {
                return x.id == s.propertyid
            }).floorplans.map(function (x) {
                return x.toString()
            });

            excfps = excfps.concat(_.difference(currentfps, incfps))

            if (excfps.length > 0) {
                var removed = _.remove(fps, function (x) {
                    return excfps.indexOf(x.id.toString()) > -1
                });
                if (removed && removed.length > 0) {
                    excluded = true;
                }
            }
        }

        var tot = _.sum(fps, function (x) {
            return x.units
        });
        var ret = _.sum(fps, function (x) {
            return (x.rent - x.concessions / 12) * x.units / tot
        })


        return {value: ret, excluded: excluded};
    },
    normailizePoints: function (points, offset, dr) {
        if (points == {}) {
            return {}
        }

        var monday = parseInt(moment.utc().add(offset, "minute").day("Monday").startOf("day").subtract(offset, "minute").format('x'))
        var nextMonday = monday + WEEK;

        var minDate;

        for (minDate in points) break;

        var ret = {};

        var first = null;

        while (parseInt(minDate) < nextMonday) {
            var rangePoints = [];

            for (var d in points) {
                if (parseInt(d) >= monday && parseInt(d) < nextMonday) {
                    rangePoints.push(points[d])
                }
            }

            if (rangePoints.length > 0) {
                //console.log(rangePoints)
                ret[monday] = _.sum(rangePoints) / rangePoints.length;

                if (first == null) {
                    first = ret[monday];
                }
            }


            monday = monday - WEEK;
            nextMonday = nextMonday - WEEK;
        }

        var today = parseInt(moment.utc(dr.end).add(offset, "minute").startOf("day").subtract(offset, "minute").format('x'))

        ret[today] = first;

        return ret;
    },
    extrapolateMissingPoints: function (pts) {

        var Count = pts.length;

        if (Count < 2) {
            return pts;
        }

        var i = 0;
        var Current;
        var Last = null;
        var Delta = 0;

        while (i < Count) {
            Current = pts[i];
            if (Last != null && Current.d - Last.d > WEEK) {
                Delta = (Current.v - Last.v) / (Current.d - Last.d) * WEEK;
                Current =
                {
                    d: Last.d + WEEK,
                    v: Last.v + Delta,
                    f: true
                };

                pts.splice(i, 0, Current);

                i--;
                Count++;
            }

            Last = Current;
            i++;
        }

        return pts;
    },
    objectToArray: function (obj) {
        var ar = [];

        for (var k in obj) {
            ar.push({d: parseInt(k), v: obj[k]});
        }

        ar = _.sortBy(ar, function (x) {
            return x.d
        });

        return ar;
    },
    getSummary: function(points, subjectid, newpoints, dimension) {
        newpoints['averages'][dimension] = [];
        for (var prop in points) {
            if (prop == subjectid) {
                newpoints[prop] = points[prop];
            } else {
                newpoints['averages'][dimension] = newpoints['averages'][dimension].concat(points[prop][dimension]);
            }
        }

        var g = _.chain(newpoints['averages'][dimension]).groupBy("d").map(function (v, k) {
            return {
                d: parseInt(k),
                v: _.sum(v, function (x) {
                    return x.v
                }) / v.length
            }
        }).value();

        newpoints['averages'][dimension] = g;
    }
}