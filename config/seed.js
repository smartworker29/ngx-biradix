var async = require("async");
var UserSchema = require('../api/users/schemas/userSchema')
var AccessService = require('../api/access/services/accessService')
var UserService = require('../api/users/services/userService')
var OrgService = require('../api/organizations/services/organizationService')
var PropertyService = require('../api/properties/services/propertyService')

module.exports = {
    init: function () {
        UserSchema.findOne({},function(err, usr) {
            if (!usr) {
                async.waterfall([
                    function(callbackw) {
                        CompaniesCreate(function(companies) {
                            callbackw(null, companies)
                        })
                    },
                    function(companies, callbackw) {
                        RolesCreate(companies, function(roles) {
                            callbackw(null,roles, companies)
                        })
                    },
                    function(roles, companies, callbackw){
                        UsersCreate(roles, function(users) {
                            callbackw(null,users, companies, roles)
                        });
                    },
                    function(users, companies,roles, callbackw) {
                        RolesAssignPermissionsCreate(roles, function() {
                            callbackw(null,users, companies, roles)
                        })
                    },
                    function(users, companies, roles, callbackw) {
                        PropertiesCreate(companies,function(properties) {
                            callbackw(null,users, roles, properties)
                        })
                    },
                    function(users, roles, properties, callbackw) {
                        PermissionsCreate(roles, properties, function() {
                            callbackw(null,users, roles, properties)
                        })
                    }
                ], function(err) {

                });
            }
        }) ;

    }
}

var RolesAssignPermissionsCreate = function(roles, callback) {
    var permissions = [
        {executorid: roles.GreystarCM._id, resource: roles.GreystarCM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarCM._id, resource: roles.GreystarRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarCM._id, resource: roles.GreystarBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarCM._id, resource: roles.GreystarPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarRM._id, resource: roles.GreystarRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarRM._id, resource: roles.GreystarBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarRM._id, resource: roles.GreystarPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarBM._id, resource: roles.GreystarBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarBM._id, resource: roles.GreystarPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.GreystarPO._id, resource: roles.GreystarPO._id.toString(), allow: true, type: 'RoleAssign'},

        {executorid: roles.AllianceCM._id, resource: roles.AllianceCM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceCM._id, resource: roles.AllianceRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceCM._id, resource: roles.AllianceBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceCM._id, resource: roles.AlliancePO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceRM._id, resource: roles.AllianceRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceRM._id, resource: roles.AllianceBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceRM._id, resource: roles.AlliancePO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceBM._id, resource: roles.AllianceBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AllianceBM._id, resource: roles.AlliancePO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.AlliancePO._id, resource: roles.AlliancePO._id.toString(), allow: true, type: 'RoleAssign'},

        {executorid: roles.WoodCM._id, resource: roles.WoodCM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodCM._id, resource: roles.WoodRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodCM._id, resource: roles.WoodBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodCM._id, resource: roles.WoodPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodRM._id, resource: roles.WoodRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodRM._id, resource: roles.WoodBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodRM._id, resource: roles.WoodPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodBM._id, resource: roles.WoodBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodBM._id, resource: roles.WoodPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.WoodPO._id, resource: roles.WoodPO._id.toString(), allow: true, type: 'RoleAssign'},

        {executorid: roles.DemoCM._id, resource: roles.DemoCM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoCM._id, resource: roles.DemoRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoCM._id, resource: roles.DemoBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoCM._id, resource: roles.DemoPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoRM._id, resource: roles.DemoRM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoRM._id, resource: roles.DemoBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoRM._id, resource: roles.DemoPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoBM._id, resource: roles.DemoBM._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoBM._id, resource: roles.DemoPO._id.toString(), allow: true, type: 'RoleAssign'},
        {executorid: roles.DemoPO._id, resource: roles.DemoPO._id.toString(), allow: true, type: 'RoleAssign'},

    ];

    async.eachLimit(permissions, 10, function(permission, callbackp){
        AccessService.createPermission(permission, function (err, perm) {
            callbackp(err, perm)
        });
    }, function(err) {
        callback();
    });


};

var PropertiesCreate = function(companies,callback) {
    var Aurelian = { name: 'Aurelian Apartments', address: '1418 N. Scottsdale Rd.', city: 'Scottsdale', state: 'AZ', zip: '85257', phone: '(180) 632-2596', owner: 'Rome', management: 'Rome', yearBuilt: 2007, orgid: companies.Demo._id, constructionType: 'Garden', notes: 'LRO', fees: {
        application_fee : '$45',
        lease_terms: '6-12 months',
        short_term_premium: '$200',
        refundable_security_deposit: '$500',
        administrative_fee: '$150',
        non_refundable_pet_deposit: '$150',
        pet_deposit: '$150',
        pet_rent: '$25'
    }}
    var Augustus = { name: 'Augustus Apartments', address: '7700 E. Roosevelt Rd.', city: 'Scottsdale', state: 'AZ', zip: '85257', phone: '(180) 821-6060', owner: 'Octavian Empire', management: 'Octavian Empire', yearBuilt: 2006, orgid: companies.Demo._id, constructionType: 'Garden', notes: 'Concessions: Complimentary Carpet Cleaning for renewals.\r\n\r\n Notes: Complimentary Carpet Cleaning for renewals', fees: {
        application_fee : '$49',
        lease_terms: '6-13 months',
        short_term_premium: '$200',
        refundable_security_deposit: '$500',
        administrative_fee: '$150',
        non_refundable_pet_deposit: '$150',
        pet_deposit: '$175',
        pet_rent: '$25'
    }}
    var Nero = { name: 'Nero Palace', address: '2500 N. Hayden Rd.', city: 'Scottsdale', state: 'AZ', zip: '85257', phone: '(180) 782-6699', owner: 'Nero Residential Capital', management: 'Nero Residential', yearBuilt: 2006, constructionType: 'Garden', notes: 'Concessions: Complimentary Carpet Cleaning for renewals.\r\n\r\n Notes: Deposit $500 or $87.50, Application $50, Admin $150', fees: {
        application_fee : '50',
        lease_terms: '6-13 months',
        short_term_premium: '$200',
        refundable_security_deposit: '$500',
        administrative_fee: '$150',
        non_refundable_pet_deposit: '$150',
        pet_deposit: '$175',
        pet_rent: '$25'
    }}
    var Marcus = { name: 'Marcus Aurelius Place', address: '7800 E. McDowell Rd.', city: 'Scottsdale', state: 'AZ', zip: '85257', phone: '(180) 786-3323', owner: 'Roman Residential Services', management: 'Roman Residential Services', yearBuilt: 2006, orgid: companies.Greystar._id, constructionType: 'Garden', notes: 'Owners Of Community Refuse to provied Occupancy and Traffic Information', fees: {
        application_fee : '$40',
        lease_terms: '6-14 months',
        short_term_premium: 'no short term leases, but have 20 corp suites',
        refundable_security_deposit: '$99',
        administrative_fee: '$75',
        non_refundable_pet_deposit: '$200',
        pet_deposit: '$200',
        pet_rent: '$15'
    }}
    var Geta = { name: 'Geta Residential', address: '3500 N. Scottsdale Rd.', city: 'Scottsdale', state: 'AZ', zip: '85251', phone: '(180) 840-6655', owner: 'Colosseum Capital', management: 'Colosseum Properties', yearBuilt: 2006, orgid: companies.Greystar._id, constructionType: 'Garden', notes:'Concessions: $500 Off Move-In on a 12 month lease. Comments: Deposit wavied OAC', fees: {
        application_fee : '$50',
            lease_terms: '6-14 months',
            short_term_premium: '$300',
            refundable_security_deposit: '$150-$250',
            administrative_fee: '$150',
            non_refundable_pet_deposit: '$152',
            pet_deposit: '$300',
            pet_rent: '$25'
    }}
    var Titus = { name: 'Titus Place', address: '7700 E. Osborn St.', city: 'Scottsdale', state: 'AZ', zip: '85251', phone: '(180) 276-4310', owner: 'Titus Investments', management: 'Titus Investments', yearBuilt: 2007, constructionType: 'Garden', notes: 'LRO', fees: {
        application_fee : '$50',
        lease_terms: '6-12 months',
        short_term_premium: 'no short terms',
        refundable_security_deposit: '$500',
        administrative_fee: '$150',
        non_refundable_pet_deposit: '$175',
        pet_deposit: '$175',
        pet_rent: '$25'
    }}
    var Probus = { name: 'Probus Properties', address: '7800 E. Camelback Rd.', city: 'Scottsdale', state: 'AZ', zip: '85251', phone: '(180) 457-8787', owner: 'Rome', management: 'Rome', yearBuilt: 2007, constructionType: 'Garden', notes: 'Comments: Deposit: $95 non-refundable fee OR $135 non-refundable fee plus $200 refundable.', fees: {
        application_fee : '$45',
        lease_terms: '2-12 months',
        short_term_premium: '$200',
        refundable_security_deposit: '$500',
        administrative_fee: '$150',
        non_refundable_pet_deposit: '$150',
        pet_deposit: '$150',
        pet_rent: '$25'
    }}

    async.parallel({
            Aurelian: function (callbackp) {
                PropertyService.create(Aurelian, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            },
            Augustus: function (callbackp) {
                PropertyService.create(Augustus, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            },
            Nero: function (callbackp) {
                PropertyService.create(Nero, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            },
            Marcus: function (callbackp) {
                PropertyService.create(Marcus, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            },
            Geta: function (callbackp) {
                PropertyService.create(Geta, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            },
            Titus: function (callbackp) {
                PropertyService.create(Titus, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            },
            Probus: function (callbackp) {
                PropertyService.create(Probus, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            }
        },function(err, props) {
            callback(props)
        }
    );


}
var UsersCreate = function(roles, callback) {

    var System = {email : "admin@biradix.com", password: "$%%##FSDFSD", first : "System", last : "User", isSystem : true, roleid: roles.BiradixAdmin._id};
    var Eugene = {email : "eugene@biradix.com", password: "BIradix11!!", first : "Eugene", last : "K", roleid: roles.BiradixAdmin._id};
    var Blerim = {email : "blerim@biradix.com", password: "BIradix11!!", first : "Blerim", last : "Z", roleid: roles.BiradixAdmin._id};
    var Alex = {email : "alex@biradix.com", password: "BIradix11!!", first : "Alex", last : "V", roleid: roles.BiradixAdmin._id};
    var Michelle = {email : "mbetchner@greystar.com", password: "Betchner321", first : "Michelle", last : "Betchner", roleid: roles.GreystarCM._id};


    async.parallel({
            System: function(callbackp) {
                UserService.insert(System, function(usr) {
                        callbackp(null, usr)
                    },
                    function(errors) {
                        throw("Unable to seed: "+ errors[0].msg);
                    }
                );
            },
            Alex: function(callbackp) {
                UserService.insert(Alex, function(usr) {
                        callbackp(null, usr)
                    },
                    function(errors) {
                        throw("Unable to seed: "+ errors[0].msg);
                    }
                );
            },
            Eugene: function(callbackp) {
                UserService.insert(Eugene, function(usr) {
                        callbackp(null, usr)
                    },
                    function(errors) {
                        throw("Unable to seed: "+ errors[0].msg);
                    }
                );
            },
            Blerim: function(callbackp) {
                UserService.insert(Blerim, function(usr) {
                        callbackp(null, usr)
                    },
                    function(errors) {
                        throw("Unable to seed: "+ errors[0].msg);
                    }
                );
            },
            Michelle: function(callbackp) {
                UserService.insert(Michelle, function(usr) {
                        callbackp(null, usr)
                    },
                    function(errors) {
                        throw("Unable to seed: "+ errors[0].msg);
                    }
                );
            }
        },function(err, users) {
            callback(users)
        }
    );


}

var RolesCreate = function(Orgs, callback) {
    var BiradixAdmin = {name: "Site Admin", isadmin: true, tags: ['Admin'], orgid : Orgs.Biradix._id}
    var AllianceCM = {name: "Corporate Manager", tags: ['CM'], orgid : Orgs.Alliance._id}
    var AllianceRM = {name: "Regional Manager", tags: ['RM'], orgid : Orgs.Alliance._id}
    var AllianceBM = {name: "Business Manager", tags: ['BM'], orgid : Orgs.Alliance._id}
    var AlliancePO = {name: "Property Owner", tags: ['PO'], orgid : Orgs.Alliance._id}
    var DemoCM = {name: "Corporate Manager", tags: ['CM'], orgid : Orgs.Demo._id}
    var DemoRM = {name: "Regional Manager", tags: ['RM'], orgid : Orgs.Demo._id}
    var DemoBM = {name: "Business Manager", tags: ['BM'], orgid : Orgs.Demo._id}
    var DemoPO = {name: "Property Owner", tags: ['PO'], orgid : Orgs.Demo._id}
    var WoodCM = {name: "Corporate Manager", tags: ['CM'], orgid : Orgs.Wood._id}
    var WoodRM = {name: "Regional Manager", tags: ['RM'], orgid : Orgs.Wood._id}
    var WoodBM = {name: "Business Manager", tags: ['BM'], orgid : Orgs.Wood._id}
    var WoodPO = {name: "Property Owner", tags: ['PO'], orgid : Orgs.Wood._id}
    var GreystarCM = {name: "Corporate Manager", tags: ['CM'], orgid : Orgs.Greystar._id}
    var GreystarRM = {name: "Regional Manager", tags: ['RM'], orgid : Orgs.Greystar._id}
    var GreystarBM = {name: "Business Manager", tags: ['BM'], orgid : Orgs.Greystar._id}
    var GreystarPO = {name: "Property Owner", tags: ['PO'], orgid : Orgs.Greystar._id}

    async.parallel({
        BiradixAdmin: function(callbackp) {
            AccessService.createRole(BiradixAdmin, function(err, role){
                callbackp(null, role)
            });
        },
        AllianceCM: function(callbackp) {
            AccessService.createRole(AllianceCM, function(err, role){
                callbackp(null, role)
            });
        },
        AllianceRM: function(callbackp) {
            AccessService.createRole(AllianceRM, function(err, role){
                callbackp(null, role)
            });
        },
        AllianceBM: function(callbackp) {
            AccessService.createRole(AllianceBM, function(err, role){
                callbackp(null, role)
            });
        },
        AlliancePO: function(callbackp) {
            AccessService.createRole(AlliancePO, function(err, role){
                callbackp(null, role)
            });
        },
        DemoCM: function(callbackp) {
            AccessService.createRole(DemoCM, function(err, role){
                callbackp(null, role)
            });
        },
        DemoRM: function(callbackp) {
            AccessService.createRole(DemoRM, function(err, role){
                callbackp(null, role)
            });
        },
        DemoBM: function(callbackp) {
            AccessService.createRole(DemoBM, function(err, role){
                callbackp(null, role)
            });
        },
        DemoPO: function(callbackp) {
            AccessService.createRole(DemoPO, function(err, role){
                callbackp(null, role)
            });
        },
        WoodCM: function(callbackp) {
            AccessService.createRole(WoodCM, function(err, role){
                callbackp(null, role)
            });
        },
        WoodRM: function(callbackp) {
            AccessService.createRole(WoodRM, function(err, role){
                callbackp(null, role)
            });
        },
        WoodBM: function(callbackp) {
            AccessService.createRole(WoodBM, function(err, role){
                callbackp(null, role)
            });
        },
        WoodPO: function(callbackp) {
            AccessService.createRole(WoodPO, function(err, role){
                callbackp(null, role)
            });
        },
        GreystarCM: function(callbackp) {
            AccessService.createRole(GreystarCM, function(err, role){
                callbackp(null, role)
            });
        },
        GreystarRM: function(callbackp) {
            AccessService.createRole(GreystarRM, function(err, role){
                callbackp(null, role)
            });
        },
        GreystarBM: function(callbackp) {
            AccessService.createRole(GreystarBM, function(err, role){
                callbackp(null, role)
            });
        },
        GreystarPO: function(callbackp) {
            AccessService.createRole(GreystarPO, function(err, role){
                callbackp(null, role)
            });
        }
},function(err, roles) {callback(roles)})


}

var CompaniesCreate = function(callback) {
    var Biradix = {name: "BI:Radix", subdomain: 'platform', logoBig: 'biradix.png', logoSmall: 'biradix-small.png', isDefault : true}
    var Demo = {name: "Demo Residential", subdomain: 'demo', logoBig: 'demo.png', logoSmall: 'demo-small.png'}
    var Greystar = {name: "Greystar", subdomain: 'greystar', logoBig: 'greystar.jpg', logoSmall: 'greystar-small.png'}
    var Wood = {name: "Wood Residential", subdomain: 'wood', logoBig: 'wood.png', logoSmall: 'wood-small.png'}
    var Alliance = {name: "Alliance Residential", subdomain: 'alliance', logoBig: 'alliance.png', logoSmall: 'alliance-small.png'}


    async.parallel({
        Biradix: function(callbackp)
    {
        OrgService.create(Biradix, function (err, org) {
            callbackp(err, org)
        });
    }
    ,
        Alliance: function (callbackp) {
        OrgService.create(Alliance, function (err, org) {
            callbackp(err, org)
        });
    }

    ,
        Demo: function (callbackp) {
        OrgService.create(Demo, function (err, org) {
            callbackp(err, org)
        });
    }

    ,
        Wood: function (callbackp) {
        OrgService.create(Wood, function (err, org) {
            callbackp(err, org)
        });
    }

    ,
        Greystar: function (callbackp) {
        OrgService.create(Greystar, function (err, org) {
            callbackp(err, org)
        });
    }


},function(err, orgs) {
        if (err) {
            throw Error(err);

        }
        callback(orgs)
    })


}

var PermissionsCreate = function(roles, properties, callback) {

    var permissions = [
        {executorid: roles.BiradixAdmin._id, resource: "Users/LogInAs", allow: true, type: 'Execute'},
        {executorid: roles.BiradixAdmin._id, resource: "Properties/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.BiradixAdmin._id, resource: "Properties/Create", allow: true, type: 'Execute'},
        {executorid: roles.BiradixAdmin._id, resource: "Org/Assign", allow: true, type: 'Execute'},

        {executorid: roles.GreystarCM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.GreystarRM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.GreystarBM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.GreystarCM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.GreystarRM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.GreystarBM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.GreystarCM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.GreystarRM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.GreystarBM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.GreystarCM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.GreystarRM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.GreystarCM._id, resource: "Settings/Default", allow: true, type: 'Execute'},
        {executorid: roles.GreystarCM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.GreystarRM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.GreystarBM._id, resource: "Properties", allow: true, type: 'Execute'},

        {executorid: roles.AllianceCM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.AllianceRM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.AllianceBM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.AllianceCM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.AllianceRM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.AllianceBM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.AllianceCM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.AllianceRM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.AllianceBM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.AllianceCM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.AllianceRM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.AllianceCM._id, resource: "Settings/Default", allow: true, type: 'Execute'},
        {executorid: roles.AllianceCM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.AllianceRM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.AllianceBM._id, resource: "Properties", allow: true, type: 'Execute'},

        {executorid: roles.WoodCM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.WoodRM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.WoodBM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.WoodCM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.WoodRM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.WoodBM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.WoodCM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.WoodRM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.WoodBM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.WoodCM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.WoodRM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.WoodCM._id, resource: "Settings/Default", allow: true, type: 'Execute'},
        {executorid: roles.WoodCM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.WoodRM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.WoodBM._id, resource: "Properties", allow: true, type: 'Execute'},

        {executorid: roles.DemoCM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.DemoRM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.DemoBM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.DemoCM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.DemoRM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.DemoBM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.DemoCM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.DemoRM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.DemoBM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.DemoCM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.DemoRM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.DemoCM._id, resource: "Settings/Default", allow: true, type: 'Execute'},
        {executorid: roles.DemoCM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.DemoRM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.DemoBM._id, resource: "Properties", allow: true, type: 'Execute'},
    ];

    async.eachLimit(permissions, 10, function(permission, callbackp){
        AccessService.createPermission(permission, function (err, perm) {
            callbackp(err, perm)
        });
    }, function(err) {
        callback();
    });




}

