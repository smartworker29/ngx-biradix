angular.module('biradix.global').factory('$userService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};

        fac.updateUsersForSettingsApply = function(criteria) {
            return $http.post(gAPI + '/api/1.0/users/updateUsersForSettingsApply'+ '?bust=' + (new Date()).getTime(), criteria, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.getUsersForSettingsApply = function(criteria) {
            return $http.post(gAPI + '/api/1.0/users/getUsersForSettingsApply'+ '?bust=' + (new Date()).getTime(), criteria, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.getRolesToAssign = function () {
            return $http.get(gAPI + '/api/1.0/access/roles'+ '?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.search = function (criteria) {
            return $http.post(gAPI + '/api/1.0/users'+ '?bust=' + (new Date()).getTime(), criteria, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

    fac.setCustomPropertiesLimit = function (userId,customPropertiesLimit) {
        return $http.put(gAPI + '/api/1.0/users/' + userId + '/customPropertiesLimit'+ '?bust=' + (new Date()).getTime(), { customPropertiesLimit: customPropertiesLimit}, {
            headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
            return response;
        }).error(function (response) {
            return response;
        });
    }

        fac.setActive = function (active, userId) {
            return $http.put(gAPI + '/api/1.0/users/' + userId + '/active'+ '?bust=' + (new Date()).getTime(), { active: active}, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.create = function (user) {
            return $http.post(gAPI + '/api/1.0/users/create'+ '?bust=' + (new Date()).getTime(), user, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.createGuest = function (user) {
            return $http.post(gAPI + '/api/1.0/users/createGuest'+ '?bust=' + (new Date()).getTime(), user, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.update = function (user) {
            return $http.put(gAPI + '/api/1.0/users/' + user._id+ '?bust=' + (new Date()).getTime(), user, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.updatePassword = function (passwords) {
            return $http.post(gAPI + '/api/1.0/users/updatePassword'+ '?bust=' + (new Date()).getTime(), passwords, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.updateSSO = function (users) {
            return $http.put(gAPI + '/api/1.0/users/sso'+ '?bust=' + (new Date()).getTime(), users, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        return fac;
    }]);
