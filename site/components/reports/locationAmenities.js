'use strict';
define([
    'app',
], function (app) {
    app.directive('locationamenitiesReport', function () {
        return {
            restrict: 'E',
            scope: {
                subject: '=',
                comps: '=',
                report: '=',
            },
            controller: function ($scope) {
                $scope.uniqueAmenities = [];
                $scope.hash = {};
                $scope.report.forEach(function(x) {
                    if ($scope.uniqueAmenities.indexOf(x[1]) == -1) {
                        $scope.uniqueAmenities.push(x[1])
                    }
                    $scope.hash[x[0] + x[1]] = true;
                    $scope.hash[x[0] + 'summary'] = ($scope.hash[x[0] + 'summary'] || 0) + 1;
                })

            },
            templateUrl: '/components/reports/locationAmenities.html'
        };
    })

})