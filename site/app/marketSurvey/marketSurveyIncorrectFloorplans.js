"use strict";
define([
    "app",
], function(app) {
    app.controller("marketSurveyIncorrectFloorplans", ["$scope", "$uibModal", "$rootScope", "$uibModalInstance", "$propertyService", "$dialog", "toastr", function ($scope, $uibModal, $rootScope, $uibModalInstance, $propertyService, $dialog, toastr) {
        ga("set", "title", "/IncorrectFloorplans");
        ga("set", "page", "/IncorrectFloorplans");
        ga("send", "pageview");

        $scope.incorrectFpArray = {
            submitted: false
        };

        $scope.cancel = function() {
            if (false) {
                $dialog.confirm("You have uploaded floor plans that have not been saved. Are you sure you want to close without saving?", function () {
                    $uibModalInstance.dismiss("cancel");
                }, function() {
                });
            } else {
                $uibModalInstance.dismiss("cancel");
            }
        };

        $propertyService.search({
            limit: 20,
            permission: 'PropertyManage',
            active: true,
            select: "name",
            skipAmenities: true
        }).then(function (response) {
            $scope.myProperties = response.data.properties;
            var id = $rootScope.me.settings.defaultPropertyId;

            if (!$scope.myProperties || $scope.myProperties.length == 0) {
                id = null;
            }
            else if (!id) {
                $scope.selectedProperty = $scope.myProperties[0];
            } else {
                $scope.selectedProperty = _.find($scope.myProperties, function (x) {
                    return x._id.toString() == id;
                })
            }

        }, function(error) {
            if (error.status == 401) {
                $rootScope.logoff();
                return;
            }

            rg4js('send', new Error("User saw API unavailable error alert/message/page"));
            $scope.apiError = true;
        });

        $scope.done = function() {
            $scope.incorrectFpArray = {
                submitted: true
            }
        };

        $scope.incorrectFloorplansTable = function () {
            require([
                '/app/marketSurvey/marketSurveyIncorrectFloorplansTable.js'
            ], function () {
                $uibModal.open({
                    templateUrl: '/app/marketSurvey/incorrectFloorplansTable.html?bust=' + version,
                    controller: 'marketSurveyIncorrectFloorplansTable',
                    size: "md",
                    keyboard: false,
                    backdrop: 'static'
                });
            });
        }

    }]);
});