'use strict';
define([
    'app'
], function (app) {
    var pageViewType = 'InitialPageView';

     app.controller('dashboardController', ['$scope','$rootScope','$location','$propertyService', '$authService', '$cookieSettingsService','$cookies','$progressService','ngProgress','$auditService','toastr','$stateParams','$reportingService','$urlService', "$exportService", "$http", "$identityProviderService",
       function ($scope,$rootScope,$location,$propertyService,$authService,$cookieSettingsService,$cookies,$progressService,ngProgress,$auditService,toastr,$stateParams,$reportingService,$urlService,$exportService,$http,$identityProviderService) {
        if (performance && performance.now) {
            var timeStart = performance.now();
        }

        $rootScope.nav = 'Dashboard'
        $rootScope.sideMenu = false;
        $rootScope.sideNav = "Dashboard";
        $scope.filters = {searchDashboard : ""};

        $scope.localLoading = false;
        $scope.excludedPopups = {};

        $scope.defaultShow = function() {
            $scope.settings.show = $reportingService.getDefaultDashboardCompColumns($rootScope.me,$(window).width());
        }

        $scope.reset = function() {
            $scope.defaultShow();
            $cookies.put('cmp.s');
            $scope.settings.orderByComp = "number";
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('cmp.o', $scope.settings.orderByComp, {expires : expireDate})
        }

        $scope.saveShow = function() {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('cmp.s', JSON.stringify($scope.settings.show), {expires : expireDate})
        }
        /**********************************************/
        $scope.defaultShowProfile = function() {
            $scope.showProfile = $reportingService.getDefaultInfoRows($rootScope.me);
        }

        $scope.resetProfile = function() {
            $scope.defaultShowProfile();
            $cookies.put('pr.s');
        }

        $scope.saveShowProfile = function() {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('pr.s', JSON.stringify($scope.showProfile), {expires : expireDate})
        }
        /***************************/

        $scope.$watch('settings.nerScale', function(d) {
            if (!$scope.localLoading) return;
            $cookieSettingsService.saveNerScale($scope.settings.nerScale)
            $scope.refreshTableView();
        }, true);

        $scope.$watch('settings.daterange', function(d,old) {
            if (!$scope.localLoading) return;
            var oldHash = old.selectedStartDate.format("MMDDYYYY") + old.selectedEndDate.format("MMDDYYYY")
            var newHash = d.selectedStartDate.format("MMDDYYYY") + d.selectedEndDate.format("MMDDYYYY")
            if(oldHash == newHash) return;

            $cookieSettingsService.saveDaterange($scope.settings.daterange);
            $scope.loadProperty($scope.selectedProperty._id);
        }, true);

        $scope.$watch('settings.summary', function() {
            if (!$scope.localLoading) return;
            $cookieSettingsService.saveSummary($scope.settings.summary)
            $scope.refreshTableView();
        }, true);

        $scope.$watch('settings.totals', function() {
            if (!$scope.localLoading) return;
            $cookieSettingsService.saveTotals($scope.settings.totals)
        }, true);

         $scope.$watch('settings.perspective', function(newP, oldP) {
             if (!$scope.localLoading || !oldP) return;
             if ($scope.settings.perspective && $scope.settings.perspective.value === "-1") {
                 $location.path("/perspectives");
                 return;
             }

             if ($scope.settings.perspective) {
                 $scope.settings.selectedPerspective = $scope.settings.perspective.value;
             } else {
                 $scope.settings.selectedPerspective = "";
             }

             $cookieSettingsService.savePerspective($scope.settings.selectedPerspective);

             $scope.loadProperty($scope.selectedProperty ? $scope.selectedProperty._id : null, false);
             }, true);


         $scope.refreshTableView = function() {
            if (!$scope.localLoading) return;

            if ($scope.bedroom) {
                $scope.settings.selectedBedroom = $scope.bedroom.value;
            } else {
                $scope.settings.selectedBedroom = -1;
            }

            $cookieSettingsService.saveBedrooms($scope.settings.selectedBedroom);

            $scope.loadProperty($scope.selectedProperty ? $scope.selectedProperty._id : null, true);
        }

        $scope.first = true;
        $scope.showSearch = false;
        $scope.showInList = 100;
        $scope.initialLength = 0;

        $scope.autocomplete = function(search) {
            $propertyService.search({
                limit: $scope.showInList,
                permission: 'PropertyManage',
                active: true,
                search:search
                , skipAmenities: true
                ,hideCustomComps:true
            }).then(function (response) {
                $scope.myProperties = response.data.properties;
                $scope.splitProperties();
            }, function (error) {

            })

        }

        $scope.splitProperties = function() {
            $scope.sharedMyProperties = _.filter($scope.myProperties, function(x) {return !(x.custom && x.custom.owner)})
            $scope.cutomMyProperties = _.filter($scope.myProperties, function(x) {return (x.custom && x.custom.owner)})
        }

        // make sure me is loaded befor you search initially
        var me = $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {
                me();

                if ($stateParams.o) {
                  $identityProviderService.getCallbackUrl($stateParams.o).then(function(response) {
                    location.href = response.data.uri;
                  }, function(err) {
                    toastr.error("Unable to login into your application: " + err.data);
                  });
                  return;
                }

                $scope.settings = $reportingService.getDashboardSettings($rootScope.me, $(window).width());
                $scope.showProfile = $reportingService.getInfoRows($rootScope.me);

                if (!$rootScope.me.settings.tz) {
                    $rootScope.me.settings.tz = jstz.determine().name();
                    $authService.updateSettings($rootScope.me.settings);
                }

                if ($rootScope.me.roles[0] == "Guest") {
                    $location.path("/dashboard2");
                    return;
                }

                $propertyService.search({
                    limit: $scope.showInList + 1,
                    permission: "PropertyManage",
                    active: true,
                    skipAmenities: true,
                    select: "name custom",
                    hideCustomComps: true,
                }).then(function(response) {
                    $scope.myProperties = response.data.properties;
                    $scope.splitProperties();

                    if ($scope.first) {
                        $scope.initialLength = $scope.myProperties.length;

                        if ($scope.myProperties.length > 7) {
                            $scope.showSearch = true;
                        }
                    }

                    var id = $rootScope.me.settings.defaultPropertyId;

                    if ($stateParams.id) {
                        id = $stateParams.id;
                    }

                    if (!$scope.myProperties || $scope.myProperties.length == 0) {
                        id = null;
                    } else if (!id) {
                        $scope.selectedProperty = $scope.myProperties[0];
                    } else {
                        $scope.selectedProperty = {_id: id};

                        // if you lost access to your saved property, update your settings
                        if (!$scope.selectedProperty ) {
                            $scope.selectedProperty = $scope.myProperties[0];
                            $scope.changeProperty();
                            return;
                        }
                    }

                    if ($scope.selectedProperty) {
                        if ($stateParams.id) {
                            $scope.changeProperty();
                        } else {
                            $scope.loadProperty($scope.selectedProperty._id, null, true);
                        }
                    } else {
                        $scope.localLoading = true;
                    }
                }, function(error) {
                    if (error.status == 401) {
                        $rootScope.logoff();
                        return;
                    }

                    rg4js('send', new Error("User saw API unavailable error alert/message/page"));
                    $scope.localLoading = true;
                    $scope.apiError = true;
                });
            }
        });

        $scope.viewProfile = function() {
            $location.path("/profile/" + $scope.property._id);
        }

        $scope.changeProperty = function() {
            $scope.selectedBedroom = -1;
            $scope.loadProperty($scope.selectedProperty ? $scope.selectedProperty._id : null);
            $rootScope.me.settings.defaultPropertyId = $scope.selectedProperty ? $scope.selectedProperty._id : null;
            $authService.updateSettings($rootScope.me.settings).then(function() {
                $rootScope.refreshToken(true, function() {});
            });

        }

        $scope.toggleDropdown = {};

        $scope.setProperty = function(property) {
            $scope.selectedProperty = property;
            $scope.toggleDropdown.isOpen = false;
            $scope.changeProperty();
        }

        $scope.$on('data.reload', function(event, args) {
            $scope.changeProperty();
        });

        $scope.loadProperty = function(defaultPropertyId, trendsOnly, fireGa) {
            if (defaultPropertyId) {
                if (!trendsOnly) {
                    $scope.localLoading = false;
                } else {
                    $scope.trendsLoading = false;
                }

                $propertyService.dashboard(
                    defaultPropertyId
                    , $scope.settings.summary
                    , $scope.settings.selectedBedroom
                    , {
                        daterange: $scope.settings.daterange.selectedRange,
                        start: $scope.settings.daterange.selectedStartDate,
                        end: $scope.settings.daterange.selectedEndDate
                        }
                    ,{ner: true, occupancy: true, leased: true, tableView: false, scale: $scope.settings.nerScale}
                    , $scope.settings.selectedPerspective
                ).then(function(response) {
                    var resp = $propertyService.parseDashboard(response.data, $scope.settings.summary, $rootScope.me.settings.showLeases, $scope.settings.nerScale, $scope.settings.selectedBedroom, $scope.settings.selectedPerspective);

                    if (!trendsOnly) {
                        $scope.property = resp.property;
                        $scope.comps = resp.comps;
                        $scope.roles = $rootScope.me.roles;
                        $scope.comp = resp.comps[0];


                        $scope.mapOptions = resp.mapOptions;
                        $scope.bedrooms = resp.bedrooms;
                        $scope.bedroom = resp.bedroom;

                        $scope.settings.perspectives = resp.perspectives;
                        $scope.settings.perspective = resp.perspective;

                        window.document.title = resp.property.name + " - Dashboard | Radix";
                    }

                    $scope.points = resp.points;
                    $scope.nerData = resp.nerData;
                    $scope.occData = resp.occData;
                    $scope.leasedData = resp.leasedData;

                    $scope.localLoading = true;
                    $scope.trendsLoading = true;

                    if (fireGa && ga && pageViewType && timeStart && performance && performance.now) {
                        var dateRange = $scope.settings && $scope.settings.daterange && $scope.settings.daterange.selectedRange || null;
                        var pageTime = performance.now() - timeStart;

                        var metrics = pageViewType === 'InitialPageView' && {
                            'dimension5': dateRange,
                            'metric1': 1,
                            'metric2': pageTime,
                        } || {
                            'dimension5': dateRange,
                            'metric3': 1,
                            'metric4': pageTime,
                        }

                        ga('send', 'event', pageViewType, 'Dashboard', metrics);

                        pageViewType = 'PageView';
                    }

                    if ($stateParams.s == "1" && !$scope.surveyPopped) {
                        $rootScope.marketSurvey(defaultPropertyId, null, {trackReminders: true});
                        $scope.surveyPopped = true;
                        if ($scope.property) {
                            $auditService.create({type: "tracking_reminder_clicked",
                                property: {
                                    id: $scope.property._id,
                                    name: $scope.property.name,
                                    orgid: $scope.property.orgid
                                },
                                description: $scope.property.name
                            });
                        }
                    }
                }, function(error) {
                    if (error.status == 401) {
                        $rootScope.logoff();
                        return;
                    } else if (error.status == 400) {
                        if (!$scope.myProperties || $scope.myProperties.length == 0) {
                            $scope.setProperty(null);
                        } else {
                            $scope.setProperty($scope.myProperties[0]);
                        }

                    }

                    rg4js('send', new Error("User saw API unavailable error alert/message/page"));
                    $scope.apiError = true;
                    $scope.localLoading = true;
                });
            }
        };

        $scope.checkProgress = function() {
            $progressService.isComplete($scope.progressId, function(isComplete) {

                if (isComplete) {
                    ngProgress.complete();
                    $('#export').prop('disabled', false);
                }
                else {
                    window.setTimeout($scope.checkProgress, 500);
                }
            })
        }

        $scope.pdf = function(showFile) {

            var c = 0;
            for (var x in $scope.settings.show) {
                if ($scope.settings.show[x] === true) {
                    c++;
                }
            }

            if (c > 13) {
                toastr.error("<B>Unable to Print/Export Report!</B><Br><Br>You have selected <b>" + c + "</b> columns for your competitor report. Having over <u>13</u> columns will not fit in Print/Export.")
                return;
            }

            $scope.profileSettings = $reportingService.getProfileSettings($(window).width());

            $scope.progressId = _.random(1000000, 9999999);

            var data = {
                compIds :  encodeURIComponent(_.map($scope.comps, function(x) {return x._id})),
                reportIds:  encodeURIComponent(['property_report']),
                progressId: $scope.progressId,
                timezone: moment().utcOffset(),
                type: 'single',
                propertyIds: encodeURIComponent([$scope.selectedProperty._id]),
                showFile: showFile,

                settings: {
                    profileSettings: $scope.profileSettings,
                    dashboardSettings: $scope.settings,
                    showProfile: $scope.showProfile,
                },
                referer: location.href
            };

            var key = $urlService.shorten(JSON.stringify(data));

            var url = gAPI + "/api/1.0/properties/reportsPdf?";
            url += "key=" + key;

            $reportingService.initiateReportingPdf(url).then(function() {
              window.setTimeout(
                function() {
                  $scope.checkProgressNew(showFile);
                }, 500
              );
            });

            var auditType = "report_print";

            if (showFile) {
                auditType = "report_pdf";
            }

            $auditService.create({type: auditType, property: $scope.property, description: $scope.property.name + ": Dashboard"});

            ngProgress.start();

            $("#export").prop("disabled", true);
        };

         $scope.checkProgressNew = function(showFile) {
             $progressService.isComplete($scope.progressId, function(isComplete) {
                 if (isComplete) {
                     ngProgress.complete();
                     $("#export").prop("disabled", false);

                     var url = gAPI + "/api/1.0/properties/downloadPdf?";
                     url += "id=" + $scope.progressId;

                    $exportService.streamFile(url);
                 } else {
                     window.setTimeout(
                         function() {
                             $scope.checkProgressNew(showFile);
                         }, 500
                     );
                 }
             });
         };

        $scope.excel = function() {
            ngProgress.start();

            $('#export').prop('disabled', true);

            $scope.progressId = _.random(1000000, 9999999);

            var data = {
                timezone: moment().utcOffset(),
                selectedStartDate: $scope.settings.daterange.selectedStartDate.format(),
                selectedEndDate: $scope.settings.daterange.selectedEndDate.format(),
                selectedRange: $scope.settings.daterange.selectedRange,
                progressId: $scope.progressId,
                compids: null,
                perspective: $scope.settings.selectedPerspective
            };

            var key = $urlService.shorten(JSON.stringify(data));

            var url = gAPI + '/api/1.0/properties/' + $scope.property._id + '/excel?'
            url += "key=" + key;

            window.setTimeout($scope.checkProgress, 500);

            $exportService.streamFile(url);

            $auditService.create({type: 'excel_profile', property: {id: $scope.property._id, name: $scope.property.name, orgid: $scope.property.orgid}, description: $scope.property.name + ' - ' + $scope.settings.daterange.selectedRange});

        }

        $scope.cbLegendClicked = function(legend) {
            $scope.legendUpdated = legend;
        };

        $scope.dropdownToggled = function(open) {
            if(open) {
                $scope.filters = {searchDashboard : ""};
                $scope.autocomplete($scope.filters.searchDashboard);
            }
        };

         $scope.sortPerspective = function( perspective ) {
             return perspective.text.toLowerCase();
         };
    }]);
});
