'use strict';
define([
    'app',
    '../../components/dialog/module.js',
], function (app) {
     app.controller
        ('manageCompsController', ['$scope', '$uibModalInstance', 'id', 'ngProgress', '$rootScope','toastr', '$location', '$propertyService', '$uibModal','$dialog', function ($scope, $uibModalInstance, id, ngProgress, $rootScope, toastr, $location, $propertyService,$uibModal,$dialog) {

            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            $scope.cancel = function () {

                if ($scope.changed) {
                    $dialog.confirm('You have made changes that have not been saved. Are you sure you want to close without saving?', function () {
                        $uibModalInstance.dismiss('cancel');
                    }, function () {
                    });
                }
                else {
                    $uibModalInstance.dismiss('cancel');
                }

            };

            $scope.changed = false;


            $scope.save = function() {

                var compids = _.map($scope.comps,function(x) {return x._id.toString()});

                ngProgress.start();
                $('.btn').prop("disabled",true);


                $propertyService.saveCompOrder(id,compids).then(function (response) {

                    ngProgress.complete();
                    $('.btn').prop("disabled",false);

                    $uibModalInstance.close();
                }, function(response) {
                    toastr.error('Unable to save Comps. Please contact an administrator');
                    ngProgress.complete();
                    $('.btn').prop("disabled",false);

                });
            }

            $propertyService.search({
                limit: 20,
                permission: 'PropertyManage',
                ids: [id],
                select: "_id name comps.id comps.orderNumber"
            }).then(function (response) {
                $scope.subject = response.data.properties[0]

                var compids = _.map($scope.subject.comps,function(x) {return x.id.toString()});

                $propertyService.search({limit: 10000, permission: 'PropertyView', ids: compids, exclude: [id], select:"name address city state"}).then(function (response) {
                    $scope.localLoading = true;
                    $scope.comps = response.data.properties;
                    $scope.comps.forEach(function(c) {
                        c.summary = c.name + "<br><i>" + c.address + ", " + c.city + ", " + c.state + "</i>";

                        var comp = _.find($scope.subject.comps, function(x) {return x.id.toString() == c._id.toString()});

                        c.orderNumber = 999;

                        if (comp && typeof comp.orderNumber != 'undefined') {
                            c.orderNumber = comp.orderNumber;
                        }

                    })

                    $scope.comps = _.sortByAll($scope.comps, ['orderNumber','name']);
                });

            });

            $scope.remove = function(comp) {
                $scope.changed = true;
                _.remove($scope.comps, function(x) {return x._id == comp._id.toString()});
                $scope.search1 = "";

            }

            $scope.getLocation = function (val) {
                var compids = _.map($scope.comps,function(x) {return x._id.toString()});
                return $propertyService.search({search: val, active: true, exclude: compids}).then(function (response) {
                    return response.data.properties
                });
            };

            $scope.searchSelected = function (item, model, label) {
                $scope.changed = true;
                $scope.comps.push(item);
                $scope.search1 = "";
            }

            $scope.moveUp = function(index) {
                if (1 == $scope.comps.length) return;

                if (index == 0) {
                    $scope.move($scope.comps,index, $scope.comps.length);
                }
                else {
                    $scope.move($scope.comps,index, index - 1);
                }
                $scope.changed = true;
            }

            $scope.moveDown = function(index) {
                if (1 == $scope.comps.length) return;

                if (index == $scope.comps.length - 1) {
                    $scope.move($scope.comps,index,0);
                }
                else {
                    $scope.move($scope.comps,index, index + 1);
                }
                $scope.changed = true;
            }

            $scope.move = function(ar, from, to) {
                ar.splice(to, 0, ar.splice(from, 1)[0]);
                var div = $("#tr-animate-" + from);
                div.addClass("animate-repeat");
                window.setTimeout(function() {
                    div.removeClass("animate-repeat");
                }, 1000);


            };

            $scope.create = function () {
                require([
                    '/app/propertyWizard/propertyWizardController.js'
                ], function () {
                    var modalInstance = $uibModal.open({
                        templateUrl: '/app/propertyWizard/propertyWizard.html?bust='+version,
                        controller: 'propertyWizardController',
                        size: "md",
                        keyboard: false,
                        backdrop: 'static',
                        resolve: {
                            id: function () {
                                return null;
                            },
                            isComp: function() {
                                return true;
                            },
                            subjectid: function() {
                                return $scope.subject._id;
                            }
                        }
                    });

                    modalInstance.result.then(function (comp) {
                        //Send successfully
                        console.log(comp);
                        comp.summary = comp.name + "<br><i>" + comp.address + ", " + comp.city + ", " + comp.state + "</i>";
                        $scope.comps.push(comp);
                        $scope.search1 = "";
                        $scope.changed = true;

                    }, function () {
                        //Cancel
                    });
                });
            }

        }]);

});