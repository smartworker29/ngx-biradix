   'use strict';
    var _ = require('lodash');
    var RoleSchema = require('../schemas/roleSchema')
   var OrgRoleSchema_read = require('../schemas/orgRoleSchema_read')
    var MemberSchema = require('../schemas/memberSchema')
    var PermissionsSchema = require('../schemas/permissionsSchema')
    var localCacheService = require('../../utilities/services/localcacheService')

    module.exports = {
        getOrgRoles: function(criteria, callback) {
            var roles;

            var modelErrors = [];
            criteria = criteria || {};
            var query = OrgRoleSchema_read.find({});

            if (criteria.tags) {
                query = query.where("tags").in(criteria.tags);
            }

            if (criteria.orgid) {
                query = query.where("orgid").in(criteria.orgid);
            }

            query.exec(function(err, obj) {
                if (err) {
                    modelErrors.push({msg: 'Unexpected Error. Unable to get roles: ' + err});
                    callback(modelErrors, null);
                    return;
                }

                callback(null, obj);
            })
        },
        getRoles: function(criteria, callback) {
            var roles;
            var key = "roles" + JSON.stringify(criteria.tags);

            if (criteria.cache) {
                roles = localCacheService.get(key);

                if (roles) {
                    return callback(null,roles);
                }

            }

            var modelErrors = [];
            criteria = criteria || {};
            var query = RoleSchema.find({});

            if (criteria.tags) {
                query = query.where("tags").in(criteria.tags);
            }

            if (criteria.orgid) {
                query = query.where("orgid").in(criteria.orgid);
            }

            if (criteria.ids) {
                query = query.where("_id").in(criteria.ids);
            }


            query.exec(function(err, obj) {
                if (err) {
                    modelErrors.push({msg: 'Unexpected Error. Unable to get roles: ' + err});
                    callback(modelErrors, null);
                    return;
                }

                if (criteria.cache) {
                    localCacheService.set(key, obj, 60)
                }
                callback(null, obj);
            })
        },
        orgUpdated: function(org, callback) {
            var query = {orgid: org._id};
            var update = {org: org};
            var options = {new: true, multi: true};
            OrgRoleSchema_read.update(query, update, options, function(err, saved) {
                callback()
            });
        }
        ,
        upsertOrgRole_read : function(role, callback) {
            OrgRoleSchema_read.remove({ _id: role._id }, function() {
                var newrole = new OrgRoleSchema_read();
                newrole.name = role.name;
                newrole._id = role._id;
                newrole.isadmin = role.isadmin;
                newrole.orgid = role.orgid;
                newrole.tags = role.tags;
                newrole.org = role.org;

                newrole.save(callback);
            })
        },
        updateRole: function(role, callback) {
            const modelErrors = [];
            role.name = role.name || "";
            role._id = role._id || "";
            if (role.name === '') {
                modelErrors.push({param: 'name', msg: 'Invalid role name.'});
            }
            if (role._id === '') {
                modelErrors.push({param: '_id', msg: 'Invalid role _id.'});
            }

            let query = {_id: role._id};
            let update = {name: role.name};
            let options = {new: true};

            RoleSchema.findOneAndUpdate(query, update, options, function(err, saved) {
                return callback(err, saved);
            });
        },
        createRole: function (role, callback) {
            var modelErrors = [];
            role.name = role.name || '';
            role.isadmin = role.isadmin || false;

            if (role.name === '') {
                modelErrors.push({param: 'name', msg: 'Invalid role name.'});
            }

            if (modelErrors.length > 0) {
                callback(modelErrors, null);
                return;
            }

            RoleSchema.findOne({_id: role.parentid}, function (err, prole) {

                var upline = [];

                if (prole && role.parentid) {
                    upline = prole.upline;
                    upline.unshift(prole._id);
                    role.isadmin = false;
                }

                var newrole = new RoleSchema();
                newrole.name = role.name;
                newrole.parentid = role.parentid;
                newrole.upline = upline;
                newrole.isadmin = role.isadmin;
                newrole.orgid = role.orgid;
                newrole.tags = role.tags;

                newrole.save(function (err, newrole2) {
                    if (err) {
                        modelErrors.push({msg: 'Unexpected Error. Unable to create role: ' + err});
                        callback(modelErrors, null);
                        return;
                    }

                    callback(null, newrole2);
                });

            })
        },

        revokeMembership: function(membership, callback) {
            var modelErrors = [];

            if (!membership.userid) {
                modelErrors.push({param: 'userid', msg: 'Missing UserId.'});
            }

            if (!membership.roleid) {
                modelErrors.push({param: 'roleid', msg: 'Missing RoleId.'});
            }

            if (modelErrors.length > 0) {
                callback(modelErrors, null);
                return;
            }

            MemberSchema.findOne({userid: membership.userid, roleid: membership.roleid}, function(err, obj) {
                    if (err) {
                        modelErrors.push({msg: 'Unexpected Error. Unable to create membership: ' + err});
                        callback(modelErrors, null);
                        return;
                    }

                    if (!obj) {
                        callback(null, true);
                        return;
                    }

                    obj.remove(function() {
                        return callback(null,true)
                    })
                }
            )
        },
        assignMembership: function(membership, callback) {
            var modelErrors = [];

            if (!membership.userid) {
                modelErrors.push({param: 'userid', msg: 'Missing UserId.'});
            }

            if (!membership.roleid) {
                modelErrors.push({param: 'roleid', msg: 'Missing RoleId.'});
            }

            if (modelErrors.length > 0) {
                callback(modelErrors, null);
                return;
            }

            MemberSchema.findOne({userid: membership.userid, roleid: membership.roleid}, function(err, obj) {

                    if (err) {
                        modelErrors.push({msg: 'Unexpected Error. Unable to create membership: ' + err});
                        callback(modelErrors, null);
                        return;
                    }

                    if (obj) {
                        callback(null, obj);
                        return;
                    }

                    var member =  new MemberSchema();
                    member.userid = membership.userid;
                    member.roleid = membership.roleid;

                    member.save(function (err, newmember) {
                        if (err) {
                            modelErrors.push({msg: 'Unexpected Error. Unable to create membership: ' + err});
                            callback(modelErrors, null);
                            return;
                        }

                        callback(null, newmember);
                    });

                }
            )
        },

        createPermission: function(permission, callback) {
            var modelErrors = [];
            permission.allow = permission.allow || true;

            if (!permission.resource) {
                modelErrors.push({param: 'resource', msg: 'Missing Resource.'});
            }

            if (!permission.executorid) {
                modelErrors.push({param: 'executorid', msg: 'Missing ExecutorId.'});
            }

            if (modelErrors.length > 0) {
                callback(modelErrors, null);
                return;
            }

            var newpermission =  new PermissionsSchema();
            newpermission.resource = permission.resource;
            newpermission.executorid = permission.executorid;
            newpermission.allow = permission.allow;
            newpermission.type = permission.type;
            newpermission.direct = permission.direct;

            // console.log(permission);

            newpermission.save(function (err, obj) {
                if (err) {
                    modelErrors.push({msg: 'Unexpected Error. Unable to create membership: ' + err});
                    callback(modelErrors, null);
                    return;
                }

                callback(null, obj);
            });
        },

        deletePermissionsByExecutorAndType: function(permission, callback) {
            var modelErrors = [];

            if (!permission.executorid) {
                modelErrors.push({param: 'resource', msg: 'Missing executorid.'});
            }

            if (!permission.type) {
                modelErrors.push({param: 'type', msg: 'Missing type.'});
            }

            if (modelErrors.length > 0) {
                callback(modelErrors, null);
                return;
            }

            var criteria = {executorid: permission.executorid, type: permission.type};


            PermissionsSchema.remove(criteria,function (err, obj) {
                if (err) {
                    modelErrors.push({msg: 'Unexpected Error. Unable to delete permission: ' + err});
                    callback(modelErrors, null);
                    return;
                }

                callback(null, obj);
            });
        },
        deletePermissionByIds: function(ids, callback) {
            var modelErrors = [];

            var criteria = {_id: {$in: ids}};

            PermissionsSchema.remove(criteria,function (err, obj) {
                if (err) {
                    modelErrors.push({msg: 'Unexpected Error. Unable to delete permission: ' + err});
                    callback(modelErrors, null);
                    return;
                }

                callback(null, obj);
            });
        },
        deletePermission: function(permission, callback) {
            var modelErrors = [];

            if (!permission.resource) {
                modelErrors.push({param: 'resource', msg: 'Missing Resource.'});
            }

            if (!permission.type) {
                modelErrors.push({param: 'type', msg: 'Missing type.'});
            }

            if (modelErrors.length > 0) {
                callback(modelErrors, null);
                return;
            }

            var criteria = {resource: permission.resource, type: permission.type};

            if (permission.direct) {
                criteria.direct = true;
            }

            if (permission.executorid) {
                criteria.executorid = permission.executorid;
            }

            PermissionsSchema.remove(criteria,function (err, obj) {
                if (err) {
                    modelErrors.push({msg: 'Unexpected Error. Unable to delete permission: ' + err});
                    callback(modelErrors, null);
                    return;
                }

                callback(null, obj);
            });
        },

        getAssignedRoles: function(userid, callback) {
            MemberSchema.find().where('userid').equals(userid).exec(function (err, roles) {
                if (roles.length > 0) {
                    roles = _.pluck(roles, 'roleid');
                }
                callback(err, roles)
            })
        },

        getAllMemberships: function(criteria, callback) {
            var query = MemberSchema.find();

            if (criteria.roleids) {
                query = query.where("roleid").in(criteria.roleids);
            }

            if (criteria.userids) {
                query = query.where("userid").in(criteria.userids);
            }

            query.exec(function(err, obj) {
                if (err) {
                    modelErrors.push({msg: 'Unexpected Error. Unable to get memberships: ' + err});
                    callback(modelErrors, null);
                    return;
                }

                callback(null, obj);
            })
        },

        getMemberships: function(userid, callback) {
            //Note: Memberships always include userid, all roles they are assigned to and all child roles
            var isadmin = false;
            //Step 1: Find all roles a user belongs too
            MemberSchema.find().where('userid').equals(userid).exec(function (err, roles) {
                //Always check user's permissions
                var arr = [userid];

               //If they are part of roles, add the role of permissions to the list
                if (roles.length > 0) {
                    arr = arr.concat(_.pluck(roles, 'roleid'));
                }
                //Step 3: Check if Admin
                RoleSchema.find({
                    '_id': {$in: arr}
                }, function (err, admincheck) {
                    var admins = _.filter(admincheck, function(x) {return x.isadmin});

                    isadmin = (admins.length > 0);

                    //Step 3: Find all downline roles
                    RoleSchema.find({
                        'upline': {$in: arr}
                    }, function (err, uplineroles) {
                        //All all roles to array
                        arr = arr.concat(_.pluck(uplineroles, '_id'));
                        callback(null,{isadmin: isadmin, memberships: arr});
                    })
                })


            })
        },

        canAccessResource: function(user, resource, type, callback) {
            if (!user.memberships) {
                callback(false);
                return;
            }

            if (user.memberships && user.memberships.isadmin === true) {
                callback(true);
                return;
            }


            if (!type.length) {
                type = [type];
            }

            if (!resource.length) {
                resource = [resource];
            }            

            PermissionsSchema.find({'executorid': {$in: user.memberships.memberships}, resource:{$in : resource}, type: {$in : type} },function(err,permissions) {
                //console.log(permissions);
                //Get a list of negated permission ids
                var neg = _.where(permissions, { 'allow': false });
                neg = _.pluck(neg,'_id');

                //Remove any negated permissions from list
                _.remove(permissions, function(x) {return neg.indexOf(x._id) > -1;})

                if(permissions.length > 0) {
                    callback(true);
                } else {
                    callback(false);
                }

            })


        },
        canAccess: function(user, resource, callback) {
            if (!user.memberships) {
                callback(false);
                return;
            }

            if (user.memberships && user.memberships.isadmin === true) {
                callback(true);
                return;
            }

            PermissionsSchema.find({'executorid': {$in: user.memberships.memberships}, resource:resource },function(err,permissions) {
                //console.log(permissions);
                //Get a list of negated permission ids
                var neg = _.where(permissions, { 'allow': false });
                neg = _.pluck(neg,'_id');

                //Remove any negated permissions from list
                _.remove(permissions, function(x) {return neg.indexOf(x._id) > -1;})

                if(permissions.length > 0) {
                    callback(true);
                } else {
                    callback(false);
                }

            })


        },

        //this function assumes you have a user operator and you are trying to get their permissions of a specific type
        getPermissions: function(user, types, callback) {
            if (!user.memberships) {
                callback([]);
                return;
            }

            var query = PermissionsSchema.find({'type': {$in: types} });

            if (user.memberships.isadmin !== true) {
                query = query.where('executorid').in(user.memberships.memberships);
            }

            query.exec(function(err,permissions) {
                //Get a list of negated permission ids
                var neg = _.where(permissions, { 'allow': false });
                neg = _.pluck(neg,'_id');

                //Remove any negated permissions from list
                _.remove(permissions, function(x) {return neg.indexOf(x._id) > -1;})

                if (user.memberships.isadmin === true) {
                    _.remove(permissions, function(x) {return x.resource.indexOf('Hide/') > -1})
                }

                permissions = _.uniq(_.pluck(permissions, 'resource'));
               callback(permissions);

            })


        },

        //this is a generic search permissions function. Should not be called through a gateway directly
        searchPermissions : function( criteria, callback) {

            criteria = criteria || {types : []};
            var query = PermissionsSchema.find({'type': {$in: criteria.types} });

            if (criteria.executorid) {
                query = query.where("executorid").equals(criteria.executorid)
            }

            if (criteria.resource) {
                query = query.where("resource").equals(criteria.resource)
            }

            if (criteria.direct) {
                query = query.where("direct").equals(criteria.direct)
            }
            query.exec(callback);

        }

    }