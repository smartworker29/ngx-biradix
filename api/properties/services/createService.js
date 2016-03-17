'use strict';
var PropertySchema= require('../schemas/propertySchema')
var async = require("async");
var _ = require("lodash")
var uuid = require('node-uuid');
var moment = require('moment');
var AuditService = require('../../audit/services/auditService')
var CompsService = require('./compsService')
var PropertyService = require('./propertyService')
var PropertyHelperService = require('./propertyHelperService')
var GeocodeService = require('../../utilities/services/geocodeService')
var AccessService = require('../../access/services/accessService')
var AmenityService = require('../../amenities/services/amenityService')
var OrganizationService = require('../../organizations/services/organizationService')

module.exports = {
    update: function(operator, context,revertedFromId, property, callback) {

        var modelErrors = [];

        errorCheck(property, modelErrors);


        if (modelErrors.length > 0) {
            callback(modelErrors, null);
            return;
        }

        getHelpers(property,  function(err, all) {
            if (err) {
                return callback([{msg: err}], null)
            }

            populateAmenitiesandFloorplans(property, all);

            var permissions = [];
            var removePermissions = [];

            PropertySchema.findOne({_id:property._id}, function(err, n) {

                if (err || !n) {
                    return callback([{msg: "Unable to update property. Please contact the administrator."}], null)
                }



                //Check if we can update orgs
                AccessService.canAccess(operator,"Properties/Create", function(canAccess) {

                    var profileChanges = getProfileChanges(property, n, all);
                    var contactChanges = getContactChanges(property, n, all);
                    var feesChanges = getFeesChanges(property,n, all);
                    var amenitiesChanges = getAmenitiesChanges(property,n, all,"community_amenities", "Community");
                    amenitiesChanges = amenitiesChanges.concat(getAmenitiesChanges(property,n, all,"location_amenities", "Location"));

                    var floorplansAddedChanges = getFloorplansAddedChanges(property,n, all);
                    var floorplansRemovedChanges = getFloorplansRemovedChanges(property,n, all);
                    var floorplansUpdatedChanges = getFloorplansUpdatedChanges(property,n, all);
                    var floorplansAmenitiesUpdatedChanges = getFloorplansAmenitiesUpdatedChanges(property,n, all);

                    //Get Comps so that we can un-link them and re-link them to get all the new permissions
                    var comps = _.pluck(n.comps,"id").map(function(x) {return x.toString()});
                    _.remove(comps,function(x) {return x == property._id.toString()});

                    var reLinkComps = false;


                     if (canAccess) {
                        //we have access to update orgs, lets see if the org changed
                        if ((n.orgid || '').toString() != (property.orgid || '').toString()) {
                            reLinkComps = true;
                            //Remove all implicit (CM) PropertyManage permissions for old org
                            if (n.orgid) {
                                var oldCMs;
                                oldCMs = _.filter(all.roles, function(x) {return x.orgid == n.orgid.toString() && x.tags.indexOf('CM') > -1})
                                oldCMs.forEach(function(x) {
                                    removePermissions.push({executorid: x._id.toString(), type: 'PropertyManage', resource : n._id.toString()})
                                })
                            }

                            //Add all implicit (CM) PropertyManage permission for new org if org is provided
                            if (property.orgid) {
                                var newCMs;
                                newCMs = _.filter(all.roles, function(x) {return x.orgid == property.orgid.toString() && x.tags.indexOf('CM') > -1})
                                newCMs.forEach(function(x) {
                                    permissions.push({executorid: x._id.toString(), allow: true, type: 'PropertyManage', resource : n._id.toString()})
                                })
                            }

                            var oldName = "None";
                            var newName = "None";

                            if (n.orgid) {
                                oldName = _.find(all.orgs, function(x) {return x._id.toString() == n.orgid.toString()}).name
                            }

                            if (property.orgid) {
                                newName = _.find(all.orgs, function(x) {return x._id.toString() == property.orgid.toString()}).name
                            }

                            profileChanges.push({description:  "Company: " + oldName + " => " + newName, field: "orgid", old_value: n.orgid  });

                            //update org
                            n.orgid = property.orgid;

                        }
                    }


                    populateSchema(property, n, all);

                    n.save(function (err, prop) {

                        if (err) {
                            return callback([{msg: "Unable to update property. Please contact the administrator."}], null)
                        }

                        //find all subjects and their comp links to this comp and update with new floorplans asynchornously
                        if (property.addedFloorplans.length > 0) {
                            CompsService.getSubjects(prop._id, {select: "_id name comps"}, function (err, subjects) {
                                async.eachLimit(subjects, 10, function(subject, callbackp){
                                    //find the comp link inside all the subject comps and grab its floorplan links
                                    var comp = _.find(subject.comps, function(x) {return x.id.toString() == prop._id.toString()});

                                    comp.floorplans = comp.floorplans || [];
                                    comp.floorplans = comp.floorplans.concat(property.addedFloorplans);

                                    PropertyService.saveCompLink(operator, context, null, subject._id, prop._id, comp.floorplans, function(err, link) {
                                        callbackp(err, link)
                                    })

                                }, function(err) {

                                });
                            });
                        }

                        //Add  all permissions  asynchornously
                        async.eachLimit(permissions, 10, function(permission, callbackp){
                            AccessService.createPermission(permission, function (err, perm) {
                                callbackp(err, perm)
                            });
                        }, function(err) {

                        });

                        //Remove  all permissions  asynchornously
                        async.eachLimit(removePermissions, 10, function(permission, callbackp){
                            AccessService.deletePermission(permission, function (err, perm) {
                                callbackp(err, perm)
                            });
                        }, function(err) {

                        });

                        if (profileChanges.length > 0) {
                            AuditService.create({operator: operator, revertedFromId: revertedFromId, property: prop, type: 'property_profile_updated', description: prop.name + ": " + profileChanges.length  + " update(s)", context: context, data: profileChanges})
                        }

                        if (contactChanges.length > 0) {
                            AuditService.create({operator: operator, revertedFromId : revertedFromId, property: prop, type: 'property_contact_updated', description: prop.name + ": " + contactChanges.length  + " update(s)", context: context, data: contactChanges})
                        }

                        if (feesChanges.length > 0) {
                            AuditService.create({operator: operator, revertedFromId : revertedFromId, property: prop, type: 'property_fees_updated', description: prop.name + ": " + feesChanges.length  + " update(s)", context: context, data: feesChanges})
                        }

                        if (amenitiesChanges.length > 0) {
                            AuditService.create({operator: operator, revertedFromId : revertedFromId, property: prop, type: 'property_amenities_updated', description: prop.name + ": " + (_.sum(amenitiesChanges, function(x) {return x.type == 'added' ? 1 : 0}))  + " added, " + (_.sum(amenitiesChanges, function(x) {return x.type == 'removed' ? 1 : 0})) + " removed", context: context, data: amenitiesChanges})
                        }

                        floorplansAddedChanges.forEach(function(change) {
                            AuditService.create({operator: operator, revertedFromId : revertedFromId, property: prop, type: 'property_floorplan_created', description: prop.name + ": " + change.description, context: context, data: [change]})
                        })

                        floorplansRemovedChanges.forEach(function(change) {
                            AuditService.create({operator: operator, revertedFromId : revertedFromId, property: prop, type: 'property_floorplan_removed', description: prop.name + ": " + change.description, context: context, data: [change]})
                        })

                        floorplansUpdatedChanges.forEach(function(change) {
                            AuditService.create({operator: operator, revertedFromId : revertedFromId, property: prop, type: 'property_floorplan_updated', description: prop.name + ": " + change.description, context: context, data: [change]})
                        })

                        floorplansAmenitiesUpdatedChanges.forEach(function(change) {
                            AuditService.create({operator: operator, revertedFromId : revertedFromId, property: prop, type: 'property_floorplan_amenities_updated', description: prop.name + ": " + change.description +  ": " + (_.sum(change.data, function(x) {return x.type == 'added' ? 1 : 0}))  + " added, " + (_.sum(change.data, function(x) {return x.type == 'removed' ? 1 : 0})) + " removed", context: context, data: change.data})
                        })

                        if (reLinkComps && comps.length > 0) {
                            //Unlink all comps async
                            async.eachLimit(comps, 10, function (compid, callbackp) {
                                PropertyService.unlinkComp(operator,context,null,property._id,compid,function(err, obj) {
                                    callbackp(err);
                                });
                            }, function (err) {
                                //ReLink them
                                async.eachLimit(comps, 10, function (compid, callbackp) {
                                    CompsService.linkComp(operator,context,null,true,property._id,compid,function(err, obj) {
                                        callbackp(err);
                                    });
                                }, function (err) {


                                });
                            });
                        }


                        callback(null, n);


                    });
                });
             })
        });

    },
    create: function(operator, context, property, callback) {

        var modelErrors = [];

        errorCheck(property, modelErrors);


        if (modelErrors.length > 0) {
            callback(modelErrors, null);
            return;
        }

        getHelpers(property,  function(err, all)
            {
                if (err) {
                    return callback([{msg:err}],null)
                }

                populateAmenitiesandFloorplans(property, all);

                //if org of property is provided, assign manage to all CMs for that org
                //this is our implict assignment
                var CMs = [];
                if (property.orgid) {

                    CMs = _.filter(all.roles, function(x) {return x.orgid == property.orgid.toString() && x.tags.indexOf('CM') > -1})
                }

                //and assign view opermissions to all non admins and not POs
                var viewers = _.filter(all.roles, function(x) {
                    return x.tags.indexOf('CM') > -1 || x.tags.indexOf('RM') > -1 || x.tags.indexOf('BM') > -1})


                /////////////Assign all permisions to viewers and CMS
                var permissions = [];
                viewers.forEach(function(x) {
                    permissions.push({executorid: x._id.toString(), allow: true, type: 'PropertyView'})
                })

                CMs.forEach(function(x) {
                    permissions.push({executorid: x._id.toString(), allow: true, type: 'PropertyManage'})
                })
                ////////////////

                var n = new PropertySchema();

                populateSchema(property, n, all);

                n.active = true;
                n.orgid = property.orgid;
                n.comps = [];
                n.date = Date.now();

                n.save(function (err, prop) {

                    if (err) {
                        return callback([{msg:"Unable to create property. Please contact the administrator."}], null)
                    }

                    AuditService.create({operator: operator, property: prop, type: 'property_created', description: prop.name, context: context})

                    if (permissions.length > 0 ) {
                        permissions.forEach(function(x) {
                            x.resource = prop._id.toString();
                        })
                    }

                    AccessService.createRole({name: "Property " + prop._id.toString(), tags: [prop._id.toString(), 'hidden', 'RM_GROUP']}, function(){});
                    AccessService.createRole({name: "Property " + prop._id.toString(), tags: [prop._id.toString(), 'hidden', 'BM_GROUP']}, function(){});
                    AccessService.createRole({name: "Property " + prop._id.toString(), tags: [prop._id.toString(), 'hidden', 'PO_GROUP']}, function(){});

                    async.eachLimit(permissions, 10, function(permission, callbackp){
                        AccessService.createPermission(permission, function (err, perm) {
                            callbackp(err, perm)
                        });
                    }, function(err) {
                        //link to yourself to treat yourself as a comp
                        CompsService.linkComp(null,null,null,false,prop._id, prop._id,function() {
                            if (!err) {
                                callback(null, prop);
                            } else {
                                callback([{msg: err}], prop);
                            }
                        })
                    });
                });

            }
        );

    },
}

function errorCheck(property, modelErrors) {
    property = property || {};
    property.name = property.name || '';
    property.address = property.address || '';
    property.city = property.city || '';
    property.state = property.state || '';
    property.constructionType = property.constructionType || '';
    property.owner = property.owner || '';
    property.management = property.management || '';
    property.yearBuilt = property.yearBuilt || '';
    property.floorplans = property.floorplans || [];

    if (property.website && !property.website.match(/^http/ig)) {
        property.website = "http://" + property.website;
    }

    if (property.name == '') {
        modelErrors.push({param: 'name', msg : 'Please enter the Property Name'});
    }

    if (property.address == '') {
        modelErrors.push({param: 'address', msg : 'Please enter the Property Address'});
    }

    if (property.city == '') {
        modelErrors.push({param: 'city', msg : 'Please enter the Property City'});
    }

    if (property.state == '' || property.state.length != 2) {
        modelErrors.push({param: 'state', msg : 'Please enter the Property State'});
    }

    if (property.constructionType == '') {
        modelErrors.push({param: 'constructionType', msg : 'Please enter the Construction Type'});
    }

    if (property.owner == '') {
        modelErrors.push({param: 'owner', msg : 'Please enter the Owner'});
    }

    if (property.management == '') {
        modelErrors.push({param: 'management', msg : 'Please enter the Management'});
    }

    if (property.yearBuilt == '') {
        modelErrors.push({param: 'yearBuilt', msg : 'Please enter the Year Built'});
    }

    if (isNaN(property.yearBuilt) || parseInt(property.yearBuilt) < 1900 || parseInt(property.yearBuilt) > (new Date()).getFullYear() + 5) {
        modelErrors.push({param: 'yearBuilt', msg : 'Please enter a valid Year Built'});
    }

    if (property.yearRenovated && (isNaN(property.yearRenovated) || parseInt(property.yearRenovated) < 1900 || parseInt(property.yearRenovated) > (new Date()).getFullYear() + 5)) {
        modelErrors.push({param: 'yearRenovated', msg : 'Please enter a valid Year Renovated'});
    }

    property.floorplans.forEach(function(fp) {
        if (typeof fp.bedrooms == 'undefined' || isNaN(fp.bedrooms) || parseInt(fp.bedrooms) < 0) {
            modelErrors.push({param: 'floorplan', msg : 'A floorplan has an invalid number of bedrooms'});
        }

        if (!fp.bathrooms || isNaN(fp.bathrooms) || parseFloat(fp.bathrooms) < 0) {
            modelErrors.push({param: 'floorplan', msg : 'A floorplan has an invalid number of bathrooms'});
        }

        if (!fp.units || isNaN(fp.units) || parseInt(fp.units) < 0) {
            modelErrors.push({param: 'floorplan', msg : 'A floorplan has an invalid number of units'});
        }

        if (!fp.sqft || isNaN(fp.sqft) || parseInt(fp.sqft) < 0) {
            modelErrors.push({param: 'floorplan', msg : 'A floorplan has an invalid number of square feet'});
        }
    })
}

var getHelpers = function(property, callback) {
    async.parallel({
        geo: function (callbackp) {

            GeocodeService.geocode(property.address + ' ' + property.city + ' ' + property.state + ' ' + property.zip, true, function (err, res, fromCache) {
                //console.log(res[0].latitude, res[0].longitude);
                callbackp(err, res[0])
            });
        },
        roles: function (callbackp) {
            AccessService.getRoles({tags: ['Admin', 'CM', 'RM', 'BM', 'PO'], cache:true},function(err, roles) {
                callbackp(err, roles)
            })

        },
        amenities: function (callbackp) {
            AmenityService.search({active: true},function(err, amenities) {
                callbackp(err, amenities)
            })
        },
        orgs: function (callbackp) {
            OrganizationService.read(function(err, orgs) {
                callbackp(err, orgs)
            })
        }

    },  function(err, all) {
        callback(err, all)
    })
}

var populateAmenitiesandFloorplans = function(property, all) {
    property.totalUnits = 0;

    //find all amenities by name and conver to id;
    var community_amenities = [];
    (property.community_amenities || []).forEach(function(pa) {
        var am = _.find(all.amenities, function(a) {return pa == a.name && a.type == 'Community'})
        if (am) {
            community_amenities.push(am._id);
        }
    })

    property.community_amenities = community_amenities;

    var location_amenities = [];
    (property.location_amenities || []).forEach(function(pa) {
        var am = _.find(all.amenities, function(a) { return pa == a.name && a.type == 'Location'})
        if (am) {
            location_amenities.push(am._id);
        }
    })

    property.location_amenities = location_amenities;

    //we need this so we know if we are updaing a property and adding new floorplans that need to be linked to all its subjects
    property.addedFloorplans = [];

    property.floorplans.forEach(function(fp) {
        property.totalUnits += (fp.units || 0);

        var bAdd = false;
        if (!fp.id) {
            fp.id = uuid.v1();
            bAdd = true;
        }

        if (!bAdd && fp.new) {
            bAdd = true;
        }

        if (bAdd) {
            property.addedFloorplans.push(fp.id)
        }

        if (fp.new) {
            delete fp.new;
        }


        var amenities = [];
        (fp.amenities || []).forEach(function(pa) {
            var am = _.find(all.amenities, function(a) { return pa == a.name && a.type == 'Unit'})
            if (am) {
                amenities.push(am._id);
            }
        })
        fp.amenities = amenities;

    })

}

function populateSchema(property, n, all) {
    n.loc = [all.geo.latitude, all.geo.longitude]
    n.name = property.name;
    n.address = property.address;
    n.city = property.city;
    n.state = property.state;
    n.zip = property.zip;
    n.phone = property.phone;
    n.owner = property.owner;
    n.contactEmail = property.contactEmail;
    n.website = property.website;
    n.contactName = property.contactName;
    n.management = property.management;
    n.yearBuilt = property.yearBuilt;
    n.yearRenovated = property.yearRenovated
    n.constructionType = property.constructionType;
    n.notes = property.notes;
    n.fees = property.fees;
    n.floorplans = property.floorplans;
    n.totalUnits = property.totalUnits;
    n.location_amenities = property.location_amenities;
    n.community_amenities = property.community_amenities;
}

function getProfileChanges(property, n, all) {
    var changes = [];

    checkChange(changes,property,n,"name","Name");
    checkChange(changes,property,n,"address","Address");
    checkChange(changes,property,n,"city","City");
    checkChange(changes,property,n,"state","State");
    checkChange(changes,property,n,"zip","Zip");
    checkChange(changes,property,n,"constructionType","Construction Type");
    checkChange(changes,property,n,"yearBuilt","Year Built");
    checkChange(changes,property,n,"yearRenovated","Year Renovated");
    checkChange(changes,property,n,"owner","Owner");
    checkChange(changes,property,n,"management","Management");

    return changes;
}

function getContactChanges(property, n, all) {
    var changes = [];

    checkChange(changes,property,n,"contactName","Contact Name");
    checkChange(changes,property,n,"contactEmail","Contact Email");
    checkChange(changes,property,n,"phone","Contact Phone");
    checkChange(changes,property,n,"website","Website Address");
    checkChange(changes,property,n,"notes","Notes", true);

    return changes;
}

function checkChange(changes, property, n,  field, label, useQoutes) {

    var quotes = useQoutes ? "\"" : "";

    if (n[field] != property[field]) {
        changes.push({description: label + ": " + quotes + (n[field] || '') + quotes + " => " + quotes + (property[field] || '') + quotes, field: field, old_value: n[field]  });
    }
}

function getFeesChanges(property, n, all) {
    var changes = [];
    n.fees = n.fees || {};
    property.fees = property.fees || {};

    for (var f in PropertyHelperService.fees) {
        if (n.fees[f]  != property.fees[f]) {
            var oldLabel = "";
            var newLabel = "";

            if (n.fees[f]) {
                oldLabel = n.fees[f];
            }

            if (property.fees[f]) {
                newLabel = property.fees[f];
            }

            changes.push({description: PropertyHelperService.fees[f] + ": \"" + oldLabel + "\" => \"" + newLabel + "\"", field: f, old_value: n.fees[f]  });
        }
    }

    return changes;
}

function getAmenitiesChanges(property, n, all, type, label) {
    var changes = [];

    n[type] = n[type].map(function (x) {
        return x.toString()
    })

    property[type] = property[type].map(function (x) {
        return x.toString()
    })

    var removed = _.difference(n[type], property[type]);
    var added = _.difference(property[type], n[type]);


    if (removed && removed.length > 0) {
        _.filter(all.amenities, function(x) {return removed.indexOf(x.id.toString()) > -1}).forEach(function(am) {
            changes.push({amenity_type: type, type:'removed', id: am._id.toString(), description: 'Removed > ' + label + ': ' + am.name})
        })
    }

    if (added && added.length > 0) {
        _.filter(all.amenities, function(x) {return added.indexOf(x.id.toString()) > -1}).forEach(function(am) {
            changes.push({amenity_type: type,type:'added', id: am._id.toString(), description: 'Added > ' + label + ': ' + am.name})
        })
    }

    return changes;
}

function getFloorplansAddedChanges(property, n, all) {
    var changes = [];

    property.floorplans.forEach(function(fp) {
        if (!_.find(n.floorplans, function(x) {return x.id.toString() == fp.id.toString()})) {
            changes.push({id: fp.id.toString(), description: PropertyHelperService.floorplanName(fp)})
        }
    })

    return changes;
}

function getFloorplansRemovedChanges(property, n, all) {
    var changes = [];

    n.floorplans.forEach(function(fp) {
        if (!_.find(property.floorplans, function(x) {return x.id.toString() == fp.id.toString()})) {
            changes.push({old_value: fp, description: PropertyHelperService.floorplanName(fp)})
        }
    })

    return changes;
}

function getFloorplansUpdatedChanges(property, n, all) {
    var changes = [];

    n.floorplans.forEach(function(fp) {
        var nfp = _.find(property.floorplans, function(x) {return x.id.toString() == fp.id.toString()});
        if (nfp) {

            if (fp.bedrooms != nfp.bedrooms
                || fp.bathrooms != nfp.bathrooms
                || fp.description != nfp.description
                || fp.units != nfp.units
                || fp.sqft != nfp.sqft
            ) {
                changes.push({
                    old_value: fp,
                    description: PropertyHelperService.floorplanName(fp) + " => " + PropertyHelperService.floorplanName(nfp)
                })
            }
        }
    })

    return changes;
}

function getFloorplansAmenitiesUpdatedChanges(property, n, all) {
    var changes = [];

    n.floorplans.forEach(function(fp) {
        var nfp = _.find(property.floorplans, function(x) {return x.id.toString() == fp.id.toString()});
        if (nfp) {
            fp.amenities = fp.amenities.map(function (x) {
                return x.toString()
            })

            nfp.amenities = nfp.amenities.map(function (x) {
                return x.toString()
            })

            var removed = _.difference(fp.amenities, nfp.amenities);
            var added = _.difference(nfp.amenities, fp.amenities);


            if (added.length >0 || removed.length > 0) {
                var change = {description: PropertyHelperService.floorplanName(fp), data:[]};

                if (removed && removed.length > 0) {
                    _.filter(all.amenities, function(x) {return removed.indexOf(x.id.toString()) > -1}).forEach(function(am) {
                        change.data.push({fpid: fp.id.toString() ,type:'removed', id: am._id.toString(), description: 'Removed > ' + am.name})
                    })
                }

                if (added && added.length > 0) {
                    _.filter(all.amenities, function(x) {return added.indexOf(x.id.toString()) > -1}).forEach(function(am) {
                        change.data.push({fpid: fp.id.toString() ,type:'added', id: am._id.toString(), description: 'Added > ' + am.name})
                    })
                }

                changes.push(change);
            }



        }
    })

    return changes;
}