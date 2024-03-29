angular.module("biradix.global").factory('$incorrectFpService', ['$http', "$rootScope", "$httpHelperService", function ($http, $rootScope, $httpHelperService, $cookies) {
    var fac = {};

    fac.send = function (propertyId, incorrectFp) {
        return $http.post(gAPI + '/api/1.0/properties/' + propertyId + '/incorrectFloorplans?bust=' + (new Date()).getTime(), incorrectFp, {
            headers: $httpHelperService.authHeader()})
            .success(function(response) {
                return response;
            })
            .error(function(response) {
                return response;
        });
    }

    return fac;
}]);