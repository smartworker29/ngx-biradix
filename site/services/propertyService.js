angular.module('biradix.global').factory('$propertyService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};

    fac.getUnapproved = function(type, fields) {
        var query = {
            query: "query {\n" +
                "  UnapprovedList(type:"+ type +") {\n" + fields +
                "  }\n" +
                "}",
        };

        return $http.post(gAPI + "/graphql"+ "?bust=" + (new Date()).getTime(), query, {
            headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    };
    fac.clone = function (id, comps) {
        return $http.post(gAPI + '/api/1.0/properties/' + id + '/clone'+ '?bust=' + (new Date()).getTime(), {comps: comps}, {
            headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
            return response;
        }).error(function (response) {
            return response;
        });
    }

        fac.checkDupe = function (criteria) {
            return $http.post(gAPI + '/api/1.0/properties/checkDupe?bust=' + (new Date()).getTime(), criteria,  {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

    fac.checkDupeSubject = function (criteria) {
        return $http.post(gAPI + '/api/1.0/properties/checkDupeSubject?bust=' + (new Date()).getTime(), criteria,  {
            headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
            return response;
        }).error(function (response) {
            return response;
        });
    }
        fac.notifications_test = function (properties,showLeases,notification_columns, groupComps, perspectives, alerts) {
            return $http.post(gAPI + '/api/1.0/properties/notifications_test?bust=' + (new Date()).getTime(), {
                properties:properties,
                showLeases: showLeases,
                notification_columns: notification_columns,
                groupComps: groupComps,
                options: {
                  perspectives: perspectives,
                  alerts: alerts
                },

            },  {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.profile = function (id, daterange, show, subjectId, perspective) {
            var timezone = moment().utcOffset();
            if ($cookies.get("timezone")) {
                timezone = parseInt($cookies.get("timezone"));
            }

            return $http.post(gAPI + '/api/1.0/properties/' + id + '/profile'+ '?bust=' + (new Date()).getTime(), {
                daterange: daterange,
                offset: timezone,
                show: show,
                subjectId: subjectId,
                perspective: perspective
            },  {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

    fac.getDeletedFloorplans = function (propertyIds) {
        return $http.post(gAPI + '/api/1.0/properties/deletedFloorplans?bust=' + (new Date()).getTime(), {propertyIds: propertyIds}, {
            headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
            return response;
        }).error(function (response) {
            return response;
        });
    };

        fac.getSubjects = function (propertyid) {
            return $http.get(gAPI + '/api/1.0/properties/' + propertyid+ '/subjects?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        };

    fac.getSubjectPerspectives = function (compId) {
        return $http.get(gAPI + '/api/1.0/properties/' + compId+ '/subjectPerspectives?bust=' + (new Date()).getTime(), {
            headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
            return response;
        }).error(function (response) {
            return response;
        });
    }

    fac.getGuestComps = function (propertyid) {
        return $http.get(gAPI + '/api/1.0/properties/' + propertyid+ '/guestComps?bust=' + (new Date()).getTime(), {
            headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
            return response;
        }).error(function (response) {
            return response;
        });
    }
        fac.getAmenityCounts = function () {
            return $http.get(gAPI + '/api/1.0/properties/getAmenityCounts?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.emailGuest = function (propertyid, guestid, subjectid, subjectname) {
            return $http.post(gAPI + '/api/1.0/properties/' + propertyid + '/survey/guests/' + guestid + '/email?bust=' + (new Date()).getTime(), {subjectid: subjectid, subjectname: subjectname}, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.emailProperty = function (comp, email, items, logo) {
            return $http.post(gAPI + '/api/1.0/properties/' + comp._id + '/email?bust=' + (new Date()).getTime(), { comp: comp, email: email, items: items, logo: logo }, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.getSurvey = function (id, surveyid) {
            return $http.get(gAPI + '/api/1.0/properties/' + id + '/survey/' + surveyid + '?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.getSurveyDates = function (id) {
            return $http.get(gAPI + '/api/1.0/properties/' + id + '/surveys?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.full = function (id,summary,bedrooms,daterange, show) {
            return $http.post(gAPI + '/api/1.0/properties/' + id + '/full'+ '?bust=' + (new Date()).getTime(), {
                summary: summary,
                bedrooms: bedrooms,
                daterange:daterange,
                offset: moment().utcOffset(),
                show: show
            }, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.dashboard = function (id,summary,bedrooms,daterange, show, perspective) {
            return $http.post(gAPI + '/api/1.0/properties/' + id + '/dashboard'+ '?bust=' + (new Date()).getTime(), {
                summary: summary,
                bedrooms: bedrooms,
                daterange:daterange,
                offset: moment().utcOffset(),
                show: show,
                perspective: perspective
            }, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.search = function (criteria) {
            return $http.post(gAPI + '/api/1.0/properties'+ '?bust=' + (new Date()).getTime(), criteria, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.create = function (property) {
            return $http.put(gAPI + '/api/1.0/properties'+ '?bust=' + (new Date()).getTime(), property, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

    fac.massUpdate = function (propertyIds, type, newValue, oldValue) {
        return $http.post(gAPI + '/api/1.0/properties/massUpdate?bust=' + (new Date()).getTime(), {propertyIds: propertyIds, type: type, newValue: newValue, oldValue: oldValue}, {
            headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
            return response;
        }).error(function (response) {
            return response;
        });
    }

        fac.update = function (property) {
            return $http.put(gAPI + '/api/1.0/properties/' + property._id+ '?bust=' + (new Date()).getTime(), property, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.setActive = function (active, userId) {
            return $http.put(gAPI + '/api/1.0/properties/' + userId + '/active'+ '?bust=' + (new Date()).getTime(), { active: active}, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        };

    fac.updatePms = function (userId, pms) {
        return $http.put(gAPI + "/api/1.0/properties/" + userId + "/pms"+ "?bust=" + (new Date()).getTime(), {pms: pms}, {
            headers: {"Authorization": "Bearer " + $cookies.get("token")}}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    };
        fac.Approve = function (id) {
            return $http.get(gAPI + '/api/1.0/properties/' + id + '/approve'+ '?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.lookups = function () {
            return $http.get(gAPI + '/api/1.0/properties/lookups'+ '?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.saveCompOrder = function (propertyid, compids, progressId) {
            return $http.post(gAPI + '/api/1.0/properties/' + propertyid + '/comps/saveOrder?bust=' + (new Date()).getTime(), {compids: compids, progressId: progressId}, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.createSurvey = function (propertyid, survey, additionalDetails) {
            return $http.post(gAPI + '/api/1.0/properties/' + propertyid + '/survey'+ '?bust=' + (new Date()).getTime(), {survey: survey, additionalDetails: additionalDetails}, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.getSurveyWarnings = function (propertyid, survey) {
            return $http.post(gAPI + '/api/1.0/properties/' + propertyid + '/survey/warnings'+ '?bust=' + (new Date()).getTime(), survey, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.updateSurvey = function (propertyid, surveyid, survey, additionalDetails) {
            return $http.put(gAPI + '/api/1.0/properties/' + propertyid + '/survey/' + surveyid+ '?bust=' + (new Date()).getTime(), {survey: survey, additionalDetails: additionalDetails}, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

    fac.deleteSurvey = function (propertyid, surveyid) {
        return $http.delete(gAPI + '/api/1.0/properties/' + propertyid + '/survey/' + surveyid+ '?bust=' + (new Date()).getTime(), {
            headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
            return response;
        }).error(function (response) {
            return response;
        });
    }

        fac.floorplanName = function(fp) {
            var name = fp.bedrooms + "x" + fp.bathrooms;

            if (fp.description && fp.description != "") {
                name += " " + fp.description;
            } else {
                name += " - ";
            }

            name += " " + fp.sqft + " Sqft";
            name += ", " + fp.units + " Units";

            return name
        }

        fac.extractSeries = function(p, ks, ls, axis, defaultMin, defaultMax, decinalPlaces, allComps, summary, selectedBedroom, bedrooms) {
            var series = [];
            var hasPoints = false;
            var comps = allComps;


            var lines = [];
            if (selectedBedroom == -2) {
                for (var b in bedrooms) {
                    lines.push({key: b.toString(), name: "(" + (b == 0 ? "Studios" : b + " Bdrs.") + ") " + comps[0].name, prop: comps[0]._id})
                    lines.push({key: b.toString(), name: "(" + (b == 0 ? "Studios" : b + " Bdrs.") + ") Comp Average" , prop: 'averages'})
                }

                if (Object.keys(bedrooms).length == 0) {
                    lines.push({key: -1, name: comps[0].name, prop: comps[0]._id})
                }


            }
            else
            //summary, show first prop then averages series
            if (summary) {
                lines.push({key: ks[0], name: comps[0].name, prop: comps[0]._id})
                lines.push({key: ks[0], name: "Comp Average", prop: 'averages'})
            }
            else
            //multiple series on 1 chart for subject
            if (ls.length > 0) {
                ks.forEach(function(k,i) {
                    lines.push({key: k, name: ls[i], prop: comps[0]._id})
                });
            }
            //compare to other props
            else {
                comps.forEach(function(c) {
                    lines.push({key: ks[0], name: c.name, prop: c._id})
                })
            }
            var s;
            var data;
            var v;
            lines.forEach(function(c, lineIndex) {
                s = {data:[], name: c.name, _max: 0,  _min: 99999, _last : 0, yAxis: axis[lineIndex]};
                data = [];
                if (p[c.prop] && p[c.prop][c.key]) {
                    data = p[c.prop][c.key];
                }

                if (data) {
                    data.forEach(function (point) {
                        v = point.v;

                        if (v != null) {
                            v = Math.round(v * Math.pow(10, decinalPlaces)) / Math.pow(10, decinalPlaces)
                            if (s._max < v) {
                                s._max = v;
                            }

                            if (s._min > v) {
                                s._min = v;
                            }

                            hasPoints = true;

                            s._last = v;

                            s.data.push([point.d, v])
                        }
                    });

                    s.data = _.sortBy(s.data, function(o) { return o[0]; });
                }

                if (s.data.length > 0 || lineIndex == 0) {
                    series.push(s)
                }

            })


            var min, max;

            var uniqueAxis = _.unique(axis);
            var extremes = {};

            min = defaultMin;
            max = defaultMax;

            uniqueAxis.forEach(function(i) {
                extremes[i] = {};
                extremes[i].min = defaultMin;
                extremes[i].max = defaultMax;
            });

            if (hasPoints) {
                if (!summary && !selectedBedroom == -2 && ls.length == 0 && series.length > 1) {
                    series = _.sortBy(series, function(x) {
                        return -x._last;
                    });
                }
                min = _.min(series, function (x) {
                    return x._min;
                })._min;
                max = _.max(series, function (x) {
                    return x._max;
                })._max;

                var axisseries;

                uniqueAxis.forEach(function(i) {
                    axisseries = _.filter(series, function(s) {
                        return s.yAxis == i;
                    });

                    extremes[i].min = _.min(axisseries, function (x) {
                        return x._min;
                    })._min;
                    extremes[i].max = _.max(axisseries, function (x) {
                        return x._max;
                    })._max;
                });

                //console.log(uniqueAxis, max, defaultMax);
            }
            return {data: series, min: min, max: max, extremes: extremes};
        };

        var markerContent = function(property) {
            return "<div style='min-height:50px;min-width:150px'><a href='#/profile/" + property._id + "'>" + property.name + "</a><br />" + property.address + "</div>";
        }

        var extractTableViews = function(surveys, occupancy, pts, nerColumns, showLeases, showRenewal, showATR) {
            var table = [];

            var tr, ls, surveyid, leased, renewal, n, row, atr, o;

            pts.traffic.forEach(function(tr) {
                o = _.find(pts['occupancy'], function(x) {return x.d == tr.d})
                ls = _.find(pts['leases'], function(x) {return x.d == tr.d})
                surveyid = _.find(surveys, function(x,y) {return y == tr.d})

                if (showLeases) {
                    leased = _.find(pts['leased'], function(x) {return x.d == tr.d})
                } else {
                    leased = null;
                }

                if (showRenewal) {
                    renewal = _.find(pts['renewal'], function(x) {return x.d == tr.d})
                } else {
                    renewal = null;
                }

                if (showATR) {
                    atr = _.find(pts['atr'], function(x) {return x.d == tr.d})
                } else {
                    atr = null;
                }

                if (!tr.f) {

                    row = {d: tr.d, traffic: tr.v, leases: ls.v, surveyid: surveyid}

                    nerColumns.forEach(function (k) {
                        n = _.find(pts[k], function (x) {
                            return x.d == tr.d
                        })

                        if(n) {
                            row[k] = n.v
                        }
                    })

                    if (o && !o.f) {
                        row.occ = o.v;
                    }

                    if (leased && !leased.f) {
                        row.leased = leased.v;
                    }

                    if (renewal && !renewal.f) {
                        row.renewal = renewal.v;
                    }

                    if (atr && !atr.f) {
                        row.atr = atr.v;
                    }

                    table.push(row);
                }
            } )

            table = _.sortBy(table, function(x) {return -x.d})

            return table;

        }
        fac.parseProfile = function(profile, tableView, showLeases, showRenewal, scale, showATR) {

            var resp = {};
            resp.lookups = profile.lookups;

            if (!profile.property) {
                return null;
            } else {
                resp.property = profile.property;
                resp.canManage = profile.canManage;
                resp.canSurvey = profile.canSurvey;
                resp.owner = profile.owner;
                resp.comp = profile.comps[0];
            }

            // console.log(resp);

            resp.property.hasName = resp.property.contactName && resp.property.contactName.length > 0;
            resp.property.hasEmail = resp.property.contactEmail && resp.property.contactEmail.length > 0;
            resp.property.hasWebsite = resp.property.website && resp.property.website.length > 0;
            resp.property.hasSurveyNotes = resp.property.survey && resp.property.survey.notes && resp.property.survey.notes.length > 0;
            resp.property.hasNotes = resp.property.notes && resp.property.notes.length > 0;
            resp.property.hasContact = resp.property.hasName || resp.property.hasEmail || resp.property.hasWebsite;
            resp.property.notes = (resp.property.notes || '').replace(/(?:\r\n|\r|\n)/g, '<br />');

            if (resp.property.hasSurveyNotes) {
                resp.property.survey.notes = (resp.property.survey.notes || '').replace(/(?:\r\n|\r|\n)/g, '<br />');
            }

            if (resp.property.website) {
                if (resp.property.website.length > 40) {
                    resp.property.websiteLabel = resp.property.website.replace("http://", '').substring(0, 40) + "...";
                } else {
                    resp.property.websiteLabel = resp.property.website.replace("http://", '')
                }
            }

            resp.comp.hasName = resp.comp.contactName && resp.comp.contactName.length > 0;
            resp.comp.hasEmail = resp.comp.contactEmail && resp.comp.contactEmail.length > 0;
            resp.comp.hasWebsite = resp.comp.website && resp.comp.website.length > 0;
            resp.comp.hasSurveyNotes = resp.comp.survey && resp.comp.survey.notes && resp.comp.survey.notes.length > 0;
            resp.comp.hasNotes = resp.comp.notes && resp.comp.notes.length > 0;
            resp.comp.hasContact = resp.comp.hasName || resp.comp.hasEmail || resp.comp.hasWebsite;
            resp.comp.notes = (resp.comp.notes || '').replace(/(?:\r\n|\r|\n)/g, '<br />');

            if (resp.comp.hasSurveyNotes) {
                resp.comp.survey.notes = (resp.comp.survey.notes || '').replace(/(?:\r\n|\r|\n)/g, '<br />');
            }

            if (resp.comp.website) {
                if (resp.comp.website.length > 40) {
                    resp.comp.websiteLabel = resp.comp.website.replace("http://", '').substring(0, 40) + "...";
                } else {
                    resp.comp.websiteLabel = resp.comp.website.replace("http://", '')
                }
            }

            resp.comp.strRangeEnd = resp.property.strRangeEnd;

            var am;
            resp.property.location_am = [];
            resp.property.location_amenities.forEach(function (la) {
                am = _.find(resp.lookups.amenities, function (a) {
                    return a._id.toString() == la.toString()
                })
                if (am) {
                    resp.property.location_am.push(am.name)
                }
            })

            resp.property.community_am = [];
            resp.property.community_amenities.forEach(function (la) {
                am = _.find(resp.lookups.amenities, function (a) {
                    return a._id.toString() == la.toString()
                })
                if (am) {
                    resp.property.community_am.push(am.name)
                }
            })

            resp.property.floorplan_am = [];
            resp.property.floorplans.forEach(function (fp) {
                fp.amenities.forEach(function (la) {
                    am = _.find(resp.lookups.amenities, function (a) {
                        return a._id.toString() == la.toString()
                    })
                    if (am) {
                        if (resp.property.floorplan_am.indexOf(am.name) == -1)
                            resp.property.floorplan_am.push(am.name)
                    }
                })
            })

            resp.points = {excludedList: profile.points.excludedList, missingList: profile.points.missingList};

            var keys = ['ner'];
            var labels = ['Entire Property'];
            var axis = [0];

            var pts = profile.points[resp.property._id];

            if (pts) {
                for (var p in pts) {
                    if (!isNaN(p)) {
                        keys.push(p)
                        labels.push(p + ' Bedrooms')
                        axis.push(0);
                    }
                }

                resp.surveyData = pts.surveys;
            }


            var scaleDecimals = 0;
            var scaleText = "Net Eff. Rent";

            if (scale == "nersqft") {
                scaleDecimals = 2;
                scaleText = "Net Eff. Rent / Sqft";
            }

            var ner = fac.extractSeries(profile.points, keys,labels,axis,0,1000,scaleDecimals, [resp.property], false);

            var occ ;
            var points = ['occupancy'];
            var labels = ['Occupancy %'];
            var axis = [0];
            var title1 = 'Occupancy';
            var title2 = '';
            var count = 1;

            if (showLeases) {
                points.push('leased');
                labels.push('Leased %');
                axis.push(0);
                title1 += ' / Leased';
                count++;
            }

            if (showRenewal) {
                points.push('renewal');
                labels.push('Renewal %');
                axis.push(0);
                title1 += ' / Renewal';
                count++;
            }

            if (showATR) {
                points.push('atr');
                labels.push('ATR %');
                axis.push(1);
                title2 = 'ATR';
            }

            occ = fac.extractSeries(profile.points, points,labels,axis,80,100,1, [resp.property], false);

            // if ((showRenewal || showLeases) && occ.min > 0) {
            //     occ.min = occ.min * .9;
            //     occ.extremes[0].min *= .9;
            // }

            if (occ.extremes[0].max > 100) {
                occ.extremes[0].max = 100;
            }

            if (occ.extremes[1]) {
                occ.extremes[0].title = title1;
                occ.extremes[1].title = title2;
                if (occ.extremes[1].max > 100) {
                    occ.extremes[1].max = 100;
                }
            }

            resp.occData = {height:250, printWidth:380, decimalPlaces: 1, prefix:'',suffix:'%',title: '', marker: false, data: occ.data, extremes: occ.extremes};

            if (count > 2) {
                resp.occData.additionalMargin = 10;
            }


            var other = fac.extractSeries(profile.points, ['traffic','leases'],['Traffic/Wk','Leases/Wk'],[0,0],0,10,0, [resp.property], false);

            resp.nerData = {height:300, printWidth:800, decimalPlaces: scaleDecimals, prefix:'$',suffix:'', title: scaleText, marker: true, data: ner.data, min: ner.min, max: ner.max};

            resp.otherData = {height:250, printWidth:380, decimalPlaces: 0, prefix:'',suffix:'', title: '', marker: true, data: other.data, min: other.min, max: other.max};

            if (pts && tableView) {
                resp.nerKeys = keys;
                resp.otherTable = extractTableViews(resp.surveyData, resp.occData, pts, keys, showLeases, showRenewal, showATR);
            }

            return resp;
        }

        fac.parseDashboard = function(dashboard, summary, showLeases, scale, selectedBedroom, selectedPerspective) {

            var resp = {};

            resp.property = dashboard.property;
            resp.comps = dashboard.comps;

            resp.mapOptions = {
                loc: resp.property.loc,
                height: "300",
                width: "100%",
                printWidth: "300",
                points: [{
                    loc: resp.property.loc,
                    marker: '0',
                    content: markerContent(resp.property)
                }]
            }

            if (resp.property.website) {
                if (resp.property.website.length > 40) {
                    resp.property.websiteLabel = resp.property.website.replace("http://", '').substring(0, 40) + "...";
                } else {
                    resp.property.websiteLabel = resp.property.website.replace("http://", '')
                }
            }

            resp.comps.forEach(function (c, i) {
                if (c._id.toString() != resp.property._id.toString()) {
                    resp.mapOptions.points.push({
                        loc: c.loc,
                        marker: "" + i,
                        content: markerContent(c)
                    })
                }

                if (c.website) {
                    if (c.website.length > 40) {
                       c.websiteLabel = c.website.replace("http://", '').substring(0, 40) + "...";
                    } else {
                        c.websiteLabel = c.website.replace("http://", '');
                    }
                }
            })

            resp.bedrooms = [{value: -1, text: "Average"}, {value: -2, text: "All"}];

            if (resp.comps && resp.comps[0] && resp.comps[0].survey && resp.comps[0].survey.floorplans) {
                var bedrooms = _.groupBy(resp.comps[0].survey.floorplans, function(x) {
                    return parseInt(x.bedrooms.toString(), 10);
                });

                for (var b in bedrooms) {
                    switch (parseInt(b)) {
                        case 0:
                            resp.bedrooms.push({value: 0, text: "Studios"})
                            break;
                        default:
                            resp.bedrooms.push({value: b, text: b + " Bdrs."})
                            break;
                    }
                }

                _.sortBy(resp.bedrooms, function(x) {
                    return x.value;
                });
            }

            resp.bedroom = _.find(resp.bedrooms, function(x) {
                return x.value.toString() === selectedBedroom.toString();
            });

            if (!resp.bedroom) {
                resp.bedroom = resp.bedrooms[0];
            }

            selectedPerspective = selectedPerspective || "";
            resp.perspectives = [{value: "", text: "All Data"}];

            var tempP = [];
            if (resp.property.perspectives) {
                resp.property.perspectives.forEach(function(p) {
                    tempP.push({value: p.id, text: p.name});
                });
            }

            tempP = _.sortByAll(tempP, "name");
            resp.perspectives = resp.perspectives.concat(tempP);

            resp.perspectives.push({value: "-1", text: " + Add/Edit Perspective"});

            resp.perspective = _.find(resp.perspectives, function(x) {
                return x.value.toString() === selectedPerspective.toString();
            });

            if (!resp.perspective) {
                resp.perspective = _.find(resp.perspectives, function(x) {
                    return x.value.toString() === "";
                });
            }

            var scaleDecimals = 0;
            var scaleText = "Net Eff. Rent (" + resp.bedroom.text + ")";

            if (scale == "nersqft") {
                scaleDecimals = 2;
                scaleText = "Net Eff. Rent / Sqft (" + resp.bedroom.text + ")";
            }

            resp.points = {excludedList: dashboard.points.excludedList, missingList: dashboard.points.missingList};
            var ner = fac.extractSeries(dashboard.points, ['ner'],[],[0],0,1000,scaleDecimals, resp.comps, summary, selectedBedroom, bedrooms);
            var occ = fac.extractSeries(dashboard.points, ['occupancy'],[],[0],80,100,1, resp.comps, summary);
            var leased = fac.extractSeries(dashboard.points, ['leased'],[],[0],0,100,1, resp.comps, summary);

            resp.nerData = {height:300, printWidth:800, decimalPlaces: scaleDecimals, prefix:'$',suffix:'', title: scaleText, marker: true, data: ner.data, min: ner.min, max: ner.max};

            var printWidth = 800;
            if (showLeases) {
                printWidth = 380;
            }
            resp.occData = {height:300, printWidth:printWidth, decimalPlaces: 1, prefix:'',suffix:'%',title: 'Occupancy', marker: false, data: occ.data, min: (summary ? occ.min : 80), max: (summary ? occ.max : 100)};
            resp.leasedData = {height:300, printWidth:printWidth, decimalPlaces: 1, prefix:'',suffix:'%',title: 'Leased', marker: false, data: leased.data, min: (summary ? leased.min : leased.min), max: (summary ? leased.max : leased.max)};

            return resp;
        }

        fac.getFullProperty = function(id) {
            return fac.search({
                limit: 1,
                permission: ["PropertyManage", "CompManage"],
                _id: id,
                select: "_id name address city state zip phone owner management constructionType yearBuilt yearRenovated phone contactName contactEmail website notes fees orgid orgid_owner floorplans totalUnits community_amenities location_amenities media custom survey needsSurvey reputation custom_fees"
            });
        }

        return fac;
    }]);
