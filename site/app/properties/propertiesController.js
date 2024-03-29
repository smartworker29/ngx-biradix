"use strict";
define([
    "app",
    "../../filters/skip/filter",
], function (app) {
    var pageViewType = 'InitialPageView';

    app.controller("propertiesController", ["$scope","$rootScope","$location","$propertyService","ngProgress","$uibModal","$authService","$dialog","toastr","$gridService", function ($scope,$rootScope,$location,$propertyService,ngProgress,$uibModal,$authService,$dialog,toastr,$gridService) {
        if (performance && performance.now) {
            var timeStart = performance.now();
        }

        window.setTimeout(function() {window.document.title = "Manage Properties | Radix";},1500);

        $rootScope.nav = "";

        $rootScope.sideMenu = true;
        $rootScope.sideNav = "Properties";

        // Grid Options
        $scope.data = [];
        $scope.limits = [10, 50, 100, 500];
        $scope.limit = 50;
        $scope.sort = {name_lower: false};
        $scope.orderBy = "name_lower";
        $scope.defaultSort = "name_lower";

        $scope.search = {}
        $scope.searchable = ["name", "address", "city", "state", "zip", "company", "company_owner"];
        $scope.search["active"] = true;

        $scope.options = {
            showInactive: false,
            showActive: true,
            showCustom: true,
            showShared: true,
            columnsChanged: false,
        };

        $scope.adjustToSize = function(size) {
            var isTiny = size < 967;
            var isMedium = size < 1167;
            $scope.show = {
                rownumber: false,
                date: false,
                name: true,
                address: !isTiny,
                city: !isMedium,
                state: !isMedium,
                zip: !isMedium,
                active: $scope.options.showInactive,
                totalUnits: true,
                occupancy: false,
                ner: false,
                company: siteAdmin,
                company_owner: siteAdmin,
                tools: true,
                owner: false,
                lastUpdated: false,
                _id: false,
                pms: false,
            };
        }

        $scope.$on('size', function(e,size) {
            if (!$scope.options.columnsChanged) {
                $scope.adjustToSize(size);
            }
        });

        $scope.calcActive = function() {
            if ($scope.options.showActive === $scope.options.showInactive) {
                delete $scope.search.active;
            }
            else
            {
                $scope.search.active = $scope.options.showActive;
            }

            $scope.resetPager();

            $scope.show.active = $scope.options.showInactive;
        }

        $scope.calcCustom = function() {
            if ($scope.options.showCustom === $scope.options.showShared) {
                delete $scope.search.isCustom;
            }
            else
            {
                $scope.search.isCustom = $scope.options.showCustom;
            }

            $scope.resetPager();
        }

        $scope.toggleOpen = function(row) {
            row.open = !(row.open || false);

            if (row.open) {
                row.fullcomps = [];

                row.compsLoaded = false;

                var compids = _.remove(_.pluck(row.comps, "id"), function(p) { return p.toString() != row._id.toString()});

                $propertyService.search({
                    limit: 10000, permission: 'PropertyView', select:"_id name address city state zip active date totalUnits survey.occupancy survey.ner survey.date orgid orgid_owner needsSurvey survey.dateByOwner custom pms.importProvider pms.importId", ids: compids
                    , skipAmenities: true
                }).then(function (response) {
                    $propertyService.search({
                        limit: 10000,
                        permission: 'PropertyManage',
                        select: "_id orgid orgid_owner",
                        ids: compids
                        , skipAmenities: true
                    }).then(function (responseOwned) {

                        var ownedProps = responseOwned.data.properties;
                        row.fullcomps = response.data.properties;

                        var comp;
                        row.fullcomps.forEach(function (p) {

                            p.isCustom = false;
                            if (p.custom && p.custom.owner && p.custom.owner.name) {
                                p.isCustom = true;
                            }

                            //For propert sorting
                            p.occupancy = -1;
                            p.ner = -1;
                            p.lastUpdated = new Date("1/1/1980");
                            if (p.survey) {
                                if (p.survey.occupancy != null && typeof p.occupancy !== "undefined") {
                                    p.occupancy = p.survey.occupancy;
                                }
                                if (p.survey.ner != null && typeof p.ner !== "undefined") {
                                    p.ner = p.survey.ner;
                                }
                                if (p.survey.date != null && typeof p.date !== "undefined") {
                                    p.lastUpdated = p.survey.date;
                                }
                            }

                            p.canEdit = true;

                            if (p.orgid && !_.find(ownedProps, function(x) {return x._id.toString() == p._id.toString()})) {
                                p.canEdit = false;
                            }

                            if (!p.survey || !p.survey.dateByOwner || (Date.now() - new Date(p.survey.dateByOwner).getTime()) / 1000 / 60 / 60 / 24 >= 15) {
                                p.canEdit = true;
                            }

                            comp = _.find(row.comps, function(x) {return x.id.toString() == p._id.toString()});
                            p.orderNumber = 999;

                            if (comp && typeof comp.orderNumber != 'undefined') {
                                p.orderNumber = comp.orderNumber;
                            }
                        })

                        row.compsLoaded = true;
                    });
                })

            }

        };

        $scope.reload = function(callback, fireGa) {
            $scope.localLoading = false;
            $propertyService.search({
                limit: 10000,
                permission: "PropertyManage",
                select: "_id name address city state zip active date totalUnits survey.occupancy survey.ner survey.date orgid orgid_owner comps.id comps.excluded comps.orderNumber needsSurvey custom pms.importProvider pms.importId",
                skipAmenities: true,
                hideCustomComps: true,
            }).then(function(response) {
                $scope.data = response.data.properties;

                $scope.customCount = 0;
                $scope.data.forEach(function(p) {
                    p.compsExist = false;
                    if(p.comps.length > 1) {
                        p.compsExist = true;
                    }
                    p.name_lower = p.name.toLowerCase();
                    p.isCustom = false;
                    if (p.custom && p.custom.owner && p.custom.owner.name) {
                        p.isCustom = true;
                        p.owner = p.custom.owner.name;

                        // Only count subjects
                        if (p.active && p.orgid && p.custom.owner.id.toString() == $rootScope.me._id.toString()) {
                            $scope.customCount++;
                        }
                    }
                    p.occupancy = -1;
                    p.ner = -1;
                    p.lastUpdated = new Date("1/1/1980");
                    if (p.survey) {
                        if (p.survey.occupancy != null && typeof p.occupancy !== "undefined") {
                            p.occupancy = p.survey.occupancy;
                        }
                        if (p.survey.ner != null && typeof p.ner !== "undefined") {
                            p.ner = p.survey.ner;
                        }
                        if (p.survey.date != null && typeof p.date !== "undefined") {
                            p.lastUpdated = p.survey.date;
                        }
                    }

                    if ($scope.data.length < 6 && p.compsExist) {
                        $scope.toggleOpen(p);
                    }
                })

                if ($scope.customCount >= $rootScope.me.customPropertiesLimit) {
                    $scope.customLimitReached = true;
                } else {
                    $scope.customLimitReached = false;
                }

                $scope.localLoading = true;

                if (fireGa && ga && pageViewType && timeStart && performance && performance.now) {
                    var pageTime = performance.now() - timeStart;

                    var metrics = pageViewType === 'InitialPageView' && {
                        'metric1': 1,
                        'metric2': pageTime,
                    } || {
                        'metric3': 1,
                        'metric4': pageTime,
                    }
            
                    ga('send', 'event', pageViewType, 'Properties', metrics);
            
                    pageViewType = 'PageView';
                }

                if (callback) {
                    callback();
                }
            }, function(error) {
                if (error.status == 401) {
                    $rootScope.logoff();
                    return;
                }
                $scope.apiError = true;
                $scope.localLoading = true;
            })
        }

        var siteAdmin;

        var me = $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {
                siteAdmin = $rootScope.me.roles.indexOf('Site Admin') > -1;

                $scope.adjustToSize($(window).width());
                $scope.reload(null, true);
                me();
            }
        })



        $scope.$on('properties.excluded', function(event, id, compid, excluded) {
            var prop = _.find($scope.data, function(p) {return p._id == id.toString()});
            var comp = _.find(prop.comps, function(c) {return c.id.toString() == compid.toString()})
            comp.excluded = excluded;
        });

        $scope.resetPager = function () {
            $scope.currentPage = 1;
        }

        $scope.escapeRegExp = function(str) {
            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        }

        $scope.searchFilter = function (obj) {
            if (!$scope.searchText) return true;
            var re = new RegExp($scope.escapeRegExp($scope.searchText), 'i');

            var ret = false;
            $scope.searchable.forEach(function (x) {
                if (re.test((obj[x] || '').toString())) {
                    ret = true;
                }
            })
            return ret;
        };


        $scope.toggleSort = function (v) {
            $scope.resetPager();
            $gridService.toggle($scope.sort, v, true)

            var s = $scope.sort[v];

            if (s == null) {
                $scope.orderBy = $scope.defaultSort;
                return;
            }

            if (s == true) {
                $scope.orderBy = "-" + v;
            }
            else {
                $scope.orderBy = v;
            }

        }

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


        $scope.download = function () {
            var content = [];
            var header = [];
            if ($scope.show.date) {
                header.push('Date')
            }
            if ($scope.show.name) {
                header.push('Name')
            }
            if ($scope.show.address) {
                header.push('Address')
            }
            if ($scope.show.city) {
                header.push('City')
            }
            if ($scope.show.state) {
                header.push('State')
            }
            if ($scope.show.zip) {
                header.push('Zip')
            }
            if ($scope.show.totalUnits) {
                header.push('Units')
            }
            if ($scope.show.occupancy) {
                header.push('Occupancy')
            }
            if ($scope.show.ner) {
                header.push('Net Effective Rent')
            }
            if ($scope.show.active) {
                header.push('Active')
            }
            if ($scope.show.company) {
                header.push('Manage Org.');
            }
            if ($scope.show.company_owner) {
                header.push('Owner Org.')
            }
            if ($scope.show.owner) {
                header.push('Custom Owner')
            }
            if ($scope.show._id) {
                header.push("PropertyID");
            }
            if ($scope.show.pms) {
                header.push("PMS Integration");
            }
            content.push(header);
            $scope.filtered.forEach(function (r) {
                var row = [];
                if ($scope.show.date) {
                    row.push(r['date'])
                }
                if ($scope.show.name) {
                    row.push(r['name'])
                }
                if ($scope.show.address) {
                    row.push(r['address'])
                }
                if ($scope.show.city) {
                    row.push(r['city'])
                }
                if ($scope.show.state) {
                    row.push(r['state'])
                }
                if ($scope.show.zip) {
                    row.push(r['zip'])
                }
                if ($scope.show.totalUnits) {
                    row.push(r['totalUnits'] || '')
                }
                if ($scope.show.occupancy) {
                    row.push(r['occupancy'] == -1 ?  '' : r['occupancy'])
                }
                if ($scope.show.ner) {
                    row.push(r['ner'] == -1 ?  '' : r['ner'])
                }
                if ($scope.show.active) {
                    row.push(r['active'] ? 'Yes' : 'No')
                }
                if ($scope.show.company) {
                    row.push(r['company'] || '')
                }
                if ($scope.show.company_owner) {
                    row.push(r['company_owner'] || '');
                }
                if ($scope.show.owner) {
                    row.push(r['owner'] || '')
                }
                if ($scope.show._id) {
                    row.push(r["_id"] || "");
                }
                if ($scope.show.pms) {
                    row.push(r['pms'] ? r['pms'].importProvider : '');
                }

                content.push(row);
            });

            $gridService.streamCsv('properties.csv', content);

        }

        $scope.toggleActive = function (property) {

            $dialog.confirm('Are you sure you want to set "' + property.name + '" as ' + (!property.active ? "active" : "inactive") + '?', function() {
                ngProgress.start();

                $propertyService.setActive(!property.active, property._id).then(function (response) {

                        if (response.data.errors) {
                            toastr.error(_.pluck(response.data.errors,'msg').join("<br>"));
                        }
                        else {
                            property.active = !property.active;

                            if (property.active) {
                                toastr.success(property.name + " has been activated.");
                            } else {
                                toastr.warning(property.name + " has been de-activated. ");
                            }
                        }

                        ngProgress.reset();
                    },
                    function (error) {
                        rg4js('send', new Error("User saw API unavailable error alert/message/page"));
                        toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
                        ngProgress.reset();
                    });

            }, function() {})
        }

        $scope.toggleDelete = function (property) {

            $dialog.confirm('Are you sure you want to ' + (!property.active ? "un-delete" : "delete") + ' "' + property.name + '"?', function() {
                ngProgress.start();

                $propertyService.setActive(!property.active, property._id).then(function (response) {

                        if (response.data.errors) {
                            toastr.error(_.pluck(response.data.errors,'msg').join("<br>"));
                        }
                        else {
                            property.active = !property.active;

                            if (property.active) {
                                toastr.success(property.name + " has been un-deleted.");
                            } else {
                                toastr.warning(property.name + " has been deleted. ");
                            }
                            $scope.reload();
                        }

                        ngProgress.reset();
                    },
                    function (error) {
                        rg4js('send', new Error("User saw API unavailable error alert/message/page"));
                        toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
                        ngProgress.reset();
                    });

            }, function() {})
        }
        $scope.editLink = function (subject, comp) {
            require([
                '/app/floorplanLinks/floorplanLinksController.js'
            ], function () {
                var modalInstance = $uibModal.open({
                    templateUrl: '/app/floorplanLinks/floorplanLinks.html?bust=' + version,
                    controller: 'floorplanLinksController',
                    size: "md",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        id: function () {
                            return subject._id;
                        },
                        compid: function() {
                            return comp._id;
                        }
                    }
                });

                modalInstance.result.then(function () {
                    //Send successfully
                }, function () {
                    //Cancel
                });
            });
        }

        $scope.edit = function(id, isComp, subject, isCustom) {
            var subjectid = subject ? subject._id : null;

            require([
                "/app/propertyWizard/propertyWizardController.js",
            ], function() {
                var modalInstance = $uibModal.open({
                    templateUrl: "/app/propertyWizard/propertyWizard.html?bust="+version,
                    controller: "propertyWizardController",
                    size: "md",
                    keyboard: false,
                    backdrop: "static",
                    resolve: {
                        id: function() {
                            return id;
                        },
                        isComp: function() {
                            return isComp;
                        },
                        subjectid: function() {
                            return subjectid;
                        },
                        isCustom: function() {
                            return isCustom;
                        },
                    },
                });

                modalInstance.result.then(function(comp) {
                    // Send successfully
                    $scope.reload(function() {
                        // after we reload, we need to update the reference to our subject since it got new data from ajax

                        subject = _.find($scope.data, function(x) {
                            return x._id.toString() == subjectid;
                        });

                        // if we successfully added a comp for a subject, toggle open the comps in the ui for the subject
                        if (isComp) {
                            if (subject.open) {
                                $scope.toggleOpen(subject);
                            }
                            $scope.toggleOpen(subject);
                        }
                    });
                }, function() {
                    // Cancel
                });
            });
        }

        $scope.dashboard = function(id) {
            $rootScope.me.settings.defaultPropertyId = id;
            $authService.updateSettings($rootScope.me.settings).then(function() {
                $rootScope.refreshToken(true, function() {});
            });
            $location.path('/dashboard');
        };

        $scope.cloneCustom = function() {
            require([
                "/app/cloneProperty/clonePropertyController.js"
            ], function() {
                var modalInstance = $uibModal.open({
                    templateUrl: "/app/cloneProperty/cloneProperty.html?bust=" + version,
                    controller: "clonePropertyController",
                    size: "md",
                    keyboard: false,
                    backdrop: "static",
                });

                modalInstance.result.then(function(result) {
                    if (typeof result === "string" && result === "create") {
                        $scope.edit(null, false, null, true);
                        return;
                    }

                    $scope.reload(function() {
                        toastr.success("Custom property copied successfully");
                    });
                }, function() {

                });
            });
        };

        $scope.addComp = function(subject) {
            if (!subject.open && subject.compsExist) {
                $scope.toggleOpen(subject);
            }

            require([
                '/app/manageComps/manageCompsController.js'
            ], function () {
                var modalInstance = $uibModal.open({
                    templateUrl: '/app/manageComps/manageComps.html?bust=' + version,
                    controller: 'manageCompsController',
                    size: "md",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        id: function () {
                            return subject._id;
                        }
                    }
                });

                modalInstance.result.then(function () {
                    //Send successfully
                    $scope.reload(function() {
                        //after we reload, we need to update the reference to our subject since it got new data from ajax

                        subject = _.find($scope.data, function(x) {
                            return x._id.toString() == subject._id.toString();
                        });

                        if (subject.open) {
                            $scope.toggleOpen(subject);
                        }
                        $scope.toggleOpen(subject);

                    });
                    toastr.success("Comps have been updated for <b>" + subject.name + "</b>.");
                }, function () {

                });
            });

        }

        $scope.surveySwap = function(property) {

            require([
                '/app/properties/surveySwapController.js'
            ], function () {
                var modalInstance = $uibModal.open({
                    templateUrl: '/app/properties/surveySwap.html?bust=' + version,
                    controller: 'surveySwapController',
                    size: "md",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        property: function () {
                            return property;
                        }
                    }
                });

                modalInstance.result.then(function () {
                    toastr.success("Users updated successfully");
                }, function (from) {
                    //Cancel
                });
            });
        }

        $scope.PMSintegration = function(property) {
            require([
                '/app/properties/pmsIntegrationController.js'
            ], function () {
                var modalInstance = $uibModal.open({
                    templateUrl: '/app/properties/pmsIntegration.html?bust=' + version,
                    controller: 'pmsIntegrationController',
                    size: "md",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        property: function () {
                            return property;
                        }
                    }
                });

                modalInstance.result.then(function () {
                    toastr.success("Users updated successfully");
                }, function (from) {
                    //Cancel
                });
            });
        }

        $scope.manageUsers = function(property) {

            require([
                '/app/properties/managePropertyUsersController.js'
            ], function () {
                var modalInstance = $uibModal.open({
                    templateUrl: '/app/properties/manageUsers.html?bust=' + version,
                    controller: 'managePropertyUsersController',
                    size: "md",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        property: function () {
                            return property;
                        }
                    }
                });

                modalInstance.result.then(function () {
                    toastr.success("Users updated successfully");
                }, function (from) {
                    //Cancel
                });
            });
        };

        $scope.clone = function(property) {
            require([
                '/app/properties/cloneController.js'
            ], function () {
                var modalInstance = $uibModal.open({
                    templateUrl: '/app/properties/clone.html?bust=' + version,
                    controller: 'cloneController',
                    size: "md",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        property: function () {
                            return property;
                        }
                    }
                });

                modalInstance.result.then(function () {
                    toastr.success("Custom property copied successfully");
                    $scope.reload();
                }, function (from) {
                    //Cancel
                });
            });
        };

        $scope.propertiesDD = {};
        $scope.gotPropertiesDD = {};
        $scope.getPropertyDD = function(id) {
            if ($scope.propertiesDD[id]) {
                return $scope.propertiesDD[id];
            }

            if (!$scope.gotPropertiesDD[id]) {
                $propertyService.getSubjects(id).then(function(response) {
                    if (response.data && response.data.subjects && response.data.subjects.length > 1) {
                        $scope.propertiesDD[id] = "Used As Comp by:";
                        response.data.subjects = _.sortBy(response.data.subjects, "name");
                        response.data.subjects.forEach(function(s) {
                            if (s._id.toString() !== id.toString()) {
                                $scope.propertiesDD[id] += "<li>" + s.name + "</li>";
                            }
                        });
                    } else {
                        $scope.propertiesDD[id] = "<B>N/A</B>";
                    }
                });

                $scope.gotPropertiesDD[id] = true;
            }

            return "<center><img src='/images/squares.gif' class='squares'></center>";
        };

        $scope.pmsSetup = function(property) {
            require([
                "/app/properties/pmsSetupController.js"
            ], function() {
                var modalInstance = $uibModal.open({
                    templateUrl: "/app/properties/pmsSetup.html?bust=" + version,
                    controller: "pmsSetupController",
                    size: "md",
                    keyboard: false,
                    backdrop: "static",
                    resolve: {
                        property: function() {
                            return property;
                        }
                    }
                });

                modalInstance.result.then(function() {
                    toastr.success("Property updated successfully");
                }, function(from) {
                    // Cancel
                });
            });
        };
    }]);
});
