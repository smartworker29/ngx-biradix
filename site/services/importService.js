angular.module("biradix.global").factory("$importService", ["$http", "$cookies", function($http, $cookies) {
    var fac = {};

    fac.read = function(organizationId, isActive) {
        let path = gAPI + "/api/1.0/import"+ "?bust=" + (new Date()).getTime();
        if(organizationId) {
            path += "&organizationId=" + organizationId;
        }
        if(isActive) {
            path += "&isActive=" + isActive;
        }
        return $http.get(path, {
            headers: {"Authorization": "Bearer " + $cookies.get("token")}}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    };

    fac.setActive = function(isActive, id) {
        return $http.put(gAPI + "/api/1.0/import/" + id + "/isactive"+ "?bust=" + (new Date()).getTime(), {isActive: isActive}, {
            headers: {"Authorization": "Bearer " + $cookies.get("token")}}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    };

    fac.create = function(config) {
        return $http.put(gAPI + "/api/1.0/import"+ "?bust=" + (new Date()).getTime(), config, {
            headers: {"Authorization": "Bearer " + $cookies.get("token")}}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    };

    fac.update = function(config) {
        return $http.put(gAPI + "/api/1.0/import/" + config.id + "?bust=" + (new Date()).getTime(), config, {
            headers: {"Authorization": "Bearer " + $cookies.get("token")}}).success(function(response) {
            return response;
        }).error(function(response) {
            return response;
        });
    };

    return fac;
}]);
