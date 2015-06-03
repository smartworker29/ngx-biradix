'use strict';
define([
    'app',
], function (app) {
    app.directive('propertyProfile', function () {
        return {
            restrict: 'E',
            scope: {
                property: '=',
            },
            controller: function ($scope) {
            },
            templateUrl: '/components/propertyProfile/propertyProfile.html'
        };
    })

})