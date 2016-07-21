'use strict';
define([
    'app',
    '../../services/amenityService',
    '../../services/propertyService',
    '../../services/gridService',
    '../../filters/skip/filter',
    '../../components/dialog/module'
], function (app) {

    app.controller('amenitiesController', ['$scope','$rootScope','$location','$amenityService','$authService','ngProgress','$dialog','$uibModal','$gridService','toastr','$propertyService', function ($scope,$rootScope,$location,$amenityService,$authService,ngProgress,$dialog,$uibModal,$gridService,toastr,$propertyService) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }

        window.setTimeout(function() {window.document.title = "Amenities | BI:Radix";},1500);

        $rootScope.nav = "";

        $rootScope.sideMenu = true;
        $rootScope.sideNav = "Amenities";


        //Grid Options
        $scope.data = [];
        $scope.limits = [10,50,100,500]
        $scope.limit = 50;
        $scope.search = {}
        $scope.searchable = ['name','type'];

        $scope.showInactive = true;
        $scope.showActive = false;


        // /////////////////////////////
        $scope.reload = function () {
            $scope.localLoading = false;
            $amenityService.search({getCounts: true, active: true}).then(function (response) {
                $scope.data = response.data.amenities;
                $scope.data.forEach(function(a) {
                    a.old_name = a.name;
                })

                $propertyService.getAmenityCounts().then(function (response) {
                    console.log(response.data);

                        $scope.data.forEach(function(a) {
                            a.properties = response.data.counts[a._id] || 0;
                        })

                    $scope.localLoading = true;
                },
                function (error) {
                    if (error.status == 401) {
                        $rootScope.logoff();
                        return;
                    }
                    $scope.localLoading = true;
                });


            },
            function (error) {
                if (error.status == 401) {
                    $rootScope.logoff();
                    return;
                }
                $scope.localLoading = true;
            });
        }




        $scope.resetPager = function () {
            $scope.currentPage = 1;
        }

        $scope.calcActive = function() {
            if ($scope.showActive === $scope.showInactive) {
                delete $scope.search.approved;
            }
            else
            {
                $scope.search.approved = $scope.showActive;
            }

            $scope.resetPager();
        }


        $scope.calcActive();
        $scope.reload();


        $scope.searchFilter = function (obj) {
            if (!$scope.searchText) return true;
            var re = new RegExp($scope.searchText, 'i');

            var ret = false;
            $scope.searchable.forEach(function (x) {
                if (re.test(obj[x].toString())) {
                    ret = true;
                }
            })
            return ret;
        };


        $scope.pageStart = function () {
            if ($scope.filtered.length == 0) return 0;
            return (($scope.currentPage || 1) - 1) * parseInt($scope.limit) + 1;
        }

        $scope.pageEnd = function () {
            if ($scope.filtered.length == 0) return 0;
            var x = $scope.pageStart() - 1 + parseInt($scope.limit);

            if (x > $scope.filtered.length) {
                x = $scope.filtered.length;
            }

            return parseInt(x);
        }

        // $scope.toggleActive = function (user) {
        //     $dialog.confirm('Are you sure you want to set "' + user.name + '" as ' + (!user.active ? "active" : "inactive") + '?', function() {
        //
        //     ngProgress.start();
        //
        //     $userService.setActive(!user.active, user._id).then(function (response) {
        //
        //             if (response.data.errors) {
        //                 toastr.error( _.pluck(response.data.errors,'msg').join("<br>"));
        //             }
        //             else {
        //                 user.active = !user.active;
        //
        //                 if (user.active) {
        //                     toastr.success(user.name + " has been activated.");
        //                 } else {
        //                     toastr.warning(user.name + " has been de-activated. ");
        //                 }
        //             }
        //
        //             ngProgress.reset();
        //         },
        //         function (error) {
        //             toastr.error("Unable to update your account. Please contact the administrator.");
        //             ngProgress.reset();
        //         });
        //     }, function() {})
        // }
        //
        //

        $scope.pressed = function(row,event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                $scope.update(row);
            }
        }

        $scope.update = function(row) {
            $amenityService.update(row).then(function(response) {

                if (response.data.errors) {
                    toastr.error(_.pluck(response.data.errors,'msg').join("<br>"));
                }
                else {
                    toastr.success(row.name + ' updated successfully');
                    row.edit = false;
                    row.old_name = row.name;
                    row.approved = true;
                }

            }, function(response) {
                toastr.error('Unable to update amenity. Please contact an administrator');

            })
        }
    }]);
});