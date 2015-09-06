'use strict';
define([
    'app',
    '../../services/userService.js',
    '../../services/propertyService.js',
    '../../services/propertyUsersService.js',
    '../../components/filterlist/module.js',
], function (app) {
     app.controller
        ('manageUsersController', ['$scope', '$modalInstance', 'property', '$userService', 'ngProgress','$propertyService','$propertyUsersService', function ($scope, $modalInstance, property, $userService, ngProgress,$propertyService,$propertyUsersService) {

            $scope.property = property;
            $scope.users = [];
            $scope.userOptions = { hideSearch: true, dropdown: false, dropdownDirection : 'left', searchLabel: "Users" }

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $scope.loading = true;
            $scope.alerts = [];

            $propertyUsersService.getPropertyAssignedUsers(property._id).then(function (response) {

                    var users = response.data.users;

                    $userService.search({active: true, orgid: property.orgid, roleTypes:['RM','BM','PO']}).then(function (response) {
                            response.data.users.forEach(function(u) {
                                $scope.users.push({id: u._id, name: u.name, selected: users.indexOf(u._id.toString()) > -1});
                            });

                            $scope.userOptions.hideSearch =  $scope.users.length < 10;
                            $scope.loading = false;
                        },
                        function (error) {
                            $scope.loading = false;
                            $scope.alerts.push({ type: 'danger', msg: "Unable to retrieve data. Please contact the administrator." });
                        });
                },
                function (error) {
                    $scope.alerts.push({ type: 'danger', msg: "Unable to retrieve data. Please contact the administrator." });
                    $scope.loading = false;
                });


            $scope.save = function() {
                var users  = _.pluck(_.filter($scope.users, function(x) {return x.selected == true}),"id");
                $propertyUsersService.setUsersForProperty(property._id,users)
                $modalInstance.close();

            }

        }]);
});