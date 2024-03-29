angular.module('biradix.global').directive('propertyFloorplans', function () {
        return {
            restrict: 'E',
            scope: {
                comp: '=',
                orderBy: '=',
                show: '=',
                skipcookie: '=',
                appliedPerspective: '=',
                excludedPopups: '='
            },
            controller: function ($scope, $gridService, $cookies) {

                $scope.defaultSort = "sqft"

                if ($scope.show && typeof $scope.show == "string") {
                    $scope.show = JSON.parse($scope.show);
                }

                $scope.$watch("orderBy", function() {
                    if ($scope.orderBy) {
                        $scope.sort = {}
                         var x = $scope.orderBy.replace("-","");
                        $scope.sort[x] = $scope.orderBy[0] == "-";
                    }
                }, true)


                $scope.$watch("comp", function() {
                    if ($scope.comp) {
                        $scope.comp.survey.floorplans.forEach(function(fp) {
                            if (typeof fp.units === "undefined" || !$scope.comp.survey.totUnits) {
                                fp.unitPercent = null;
                                fp.units = null;
                            } else {
                                fp.unitPercent = fp.units / $scope.comp.survey.totUnits * 100;
                            }

                        })
                    }
                }, true)


                $scope.bedroomsLabel = function(i) {

                    switch (parseInt(i)) {
                        case 0:
                            return "Studios";
                        default:
                            return i + " Bedrooms";
                    }
                }

                $scope.toggleSort = function (v) {
                    $gridService.toggle($scope.sort, v, true)

                    var s = $scope.sort[v];

                    if (s == null) {
                        $scope.orderBy = $scope.defaultSort;
                    }
                    else
                    if (s == true) {
                        $scope.orderBy = "-" + v;
                    }
                    else {
                        $scope.orderBy = v;
                    }

                    if (!$scope.skipcookie) {
                        var expireDate = new Date();
                        expireDate.setDate(expireDate.getDate() + 365);
                        $cookies.put('fp.o', $scope.orderBy, {expires: expireDate})
                    }

                }
            },
            templateUrl: '/components/propertyProfile/propertyFloorplans.html?bust=' + version
        };
    })
