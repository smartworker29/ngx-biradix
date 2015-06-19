'use strict';
define([
    'app',
    '../../components/propertyProfile/about',
    '../../components/propertyProfile/profile',
    '../../components/propertyProfile/fees',
    '../../components/propertyProfile/amenities',
    '../../components/propertyProfile/floorplans',
    '../../services/progressService',
    '../../components/toggle/module',
    '../../components/daterangepicker/module',
    '../../components/timeseries/module',
    '../../services/cookieSettingsService'
], function (app) {

    app.controller('profileController', ['$scope','$rootScope','$location','$propertyService', '$authService', '$stateParams', '$window','$cookies', 'ngProgress', '$progressService', '$cookieSettingsService', function ($scope,$rootScope,$location,$propertyService,$authService, $stateParams, $window, $cookies, ngProgress, $progressService, $cookieSettingsService) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }
        $rootScope.nav = ''
        $rootScope.sideMenu = [];

        $scope.setRenderable = function() {
            window.setTimeout(function() {
                window.renderable = true;
            },100)
        }

        $scope.daterange=$cookieSettingsService.getDaterange();

        $scope.$watch('daterange', function(d) {
            if (!$scope.localLoading) return;
            $cookieSettingsService.saveDaterange($scope.daterange)
            $scope.refreshGraphs();
        }, true);

        $scope.propertyId = $stateParams.id;

        $scope.refreshGraphs = function() {
            $scope.loadProperty($scope.propertyId, true);
        }


        $scope.loadProperty = function(defaultPropertyId, trendsOnly) {

            if (defaultPropertyId) {

                if (!trendsOnly) {
                    $scope.localLoading = false;
                } else {
                    $scope.trendsLoading = false;
                }

                $propertyService.profile(defaultPropertyId
                    , {
                        daterange: $scope.daterange.selectedRange,
                        start: $scope.daterange.selectedStartDate,
                        end: $scope.daterange.selectedEndDate
                    }
                    ,{occupancy: true, ner: true}
                ).then(function (response) {
                        if (!trendsOnly) {
                            $scope.lookups = response.data.lookups;


                            if (!response.data.properties) {
                                $location.path('/dashboard')
                                return;
                            } else {
                                $scope.property = response.data.properties[0];
                                $scope.canManage = response.data.canManage;
                                $scope.comp = response.data.comps[0];
                            }
                            $scope.localLoading = true;
                            $window.document.title = $scope.property.name;
                            $scope.setRenderable();

                            $scope.property.hasName = $scope.property.contactName && $scope.property.contactName.length > 0;
                            $scope.property.hasEmail = $scope.property.contactEmail && $scope.property.contactEmail.length > 0;
                            $scope.property.hasNotes = $scope.property.notes && $scope.property.notes.length > 0;
                            $scope.property.hasContact = $scope.property.hasName || $scope.property.hasEmail;
                            $scope.property.notes = $scope.property.notes.replace(/(?:\r\n|\r|\n)/g, '<br />');

                            $scope.property.hasFees = false;
                            if ($scope.property.fees) {
                                for (var fee in $scope.property.fees) {
                                    if ($scope.property.fees[fee].length > 0) {
                                        $scope.property.hasFees = true;
                                    }
                                }
                            }

                            $scope.property.location_am = [];
                            $scope.property.location_amenities.forEach(function (la) {
                                var am = _.find($scope.lookups.amenities, function (a) {
                                    return a._id.toString() == la.toString()
                                })
                                if (am) {
                                    $scope.property.location_am.push(am.name)
                                }
                            })

                            $scope.property.community_am = [];
                            $scope.property.community_amenities.forEach(function (la) {
                                var am = _.find($scope.lookups.amenities, function (a) {
                                    return a._id.toString() == la.toString()
                                })
                                if (am) {
                                    $scope.property.community_am.push(am.name)
                                }
                            })

                            $scope.property.floorplan_am = [];
                            $scope.property.floorplans.forEach(function (fp) {
                                fp.amenities.forEach(function (la) {
                                    var am = _.find($scope.lookups.amenities, function (a) {
                                        return a._id.toString() == la.toString()
                                    })
                                    if (am) {
                                        if ($scope.property.floorplan_am.indexOf(am.name) == -1)
                                            $scope.property.floorplan_am.push(am.name)
                                    }
                                })
                            })
                        }

                        $scope.points = {excluded: response.data.points.excluded};
                        var ner = $propertyService.extractSeries(response.data.points, 'ner',0,1000,0, [$scope.property], false);
                        var occ = $propertyService.extractSeries(response.data.points, 'occupancy',80,100,1, [$scope.property], $scope.summary);

                        $scope.nerData = {height:300, printWidth:820, prefix:'$',suffix:'', title: 'Net Eff. Rent $', marker: true, data: ner.data, min: ner.min, max: ner.max};
                        $scope.occData = {height:300, printWidth:820, prefix:'',suffix:'%',title: 'Occupancy %', marker: false, data: occ.data, min: ($scope.summary ? occ.min : 80), max: ($scope.summary ? occ.max : 100)};


                        $scope.localLoading = true;
                        $scope.trendsLoading = true;


                });
            }
        };

        $scope.loadProperty($scope.propertyId)

        $scope.$on('data.reload', function(event, args) {
            $scope.loadProperty($scope.propertyId)
        });

        $scope.print = function() {
            $window.print();
        }

        $scope.checkProgress = function() {

            $progressService.isComplete($scope.progressId, function(isComplete) {

                if (isComplete) {
                    ngProgress.complete();
                    $('#export').prop('disabled', false);
                }
                else {
                    $window.setTimeout($scope.checkProgress, 500);
                }
            })

        }

        $scope.excel = function() {

            ngProgress.start();

            $('#export').prop('disabled', true);

            $scope.progressId = _.random(1000000, 9999999);

            var url = '/api/1.0/properties/' + $scope.property._id + '/excel?'
            url += "token=" + $cookies.get('token')
            url += "&timezone=" + moment().utcOffset()
            url += "&progressId=" + $scope.progressId

            $window.setTimeout($scope.checkProgress, 500);

            location.href = url;

        }

        $scope.pdf = function() {

            ngProgress.start();

            $('#export').prop('disabled', true);

            $scope.progressId = _.random(1000000, 9999999);

            var url = '/api/1.0/properties/' + $scope.property._id + '/pdf?'
            url += "token=" + $cookies.get('token')
            url += "&timezone=" + moment().utcOffset()
            url += "&progressId=" + $scope.progressId

            $window.setTimeout($scope.checkProgress, 500);

            location.href = url;

        }

    }]);
});