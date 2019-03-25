"use strict";
define([
    "app"
], function(app) {
    app.controller("pmsSetupController", ["$scope", "$uibModalInstance", "property", "ngProgress", "$propertyService", "$importService", "$importIntegrationService", "toastr", "$dialog", "$rootScope",
        function($scope, $uibModalInstance, property, ngProgress, $propertyService, $importService, $importIntegrationService, toastr, $dialog, $rootScope) {
            ga("set", "title", "/pmsSetup");
            ga("set", "page", "/pmsSetup");
            ga("send", "pageview");

            $scope.pms = {
                selectedProperty: null,
                config: null,
                floorplans: [],
                unmappedFloorplans: [],
            };
            $scope.cancel = function() {
                $uibModalInstance.dismiss("cancel");
            };

            $scope.reload = function() {
                $scope.loaded = false;
                $propertyService.search({
                    limit: 1,
                    permission: ["PropertyManage"],
                    ids: [property._id],
                    select: "_id floorplans orgid pms name",
                }).then(function(response) {
                    $scope.property = response.data.properties[0]
                    $scope.pms.config = $scope.property.pms;

                    // TODO: When this becomes client facing, we cannot return all integration client side
                    $importService.read().then(function(response) {
                        $scope.imports = _.filter(response.data, function(i) {
                            return i.orgid.toString() === $scope.property.orgid.toString();
                        });

                        if ($scope.imports.length === 1) {
                            $importIntegrationService.getLatestProperties($scope.imports[0].id).then(function(response) {
                                $scope.properties = response.data;

                                if (!$scope.pms.config) {
                                    $scope.pms.selectedProperty = _.find($scope.properties, function(p) {
                                       return p.name === $scope.property.name;
                                    });
                                } else {
                                    // TODO: Need to make this extensible for multiple PMSes
                                    $scope.pms.selectedProperty = _.find($scope.properties, function(p) {
                                        return p.id === $scope.pms.config.yardi.propertyId;
                                    });
                                }

                                $scope.property.floorplans.forEach(function(fp) {
                                    $scope.pms.floorplans.push({
                                        id: fp.id,
                                        name: "BI:Radix: " + fp.bedrooms + "x" + fp.bathrooms + " " + fp.description + ", Sqft: " + fp.sqft + ", Units: "+ fp.units,
                                        bedrooms: fp.bedrooms,
                                        bathrooms: fp.bathrooms,
                                        description: fp.description,
                                        sqft: fp.sqft,
                                        units: fp.units
                                    });
                                });

                                if ($scope.pms.selectedProperty) {
                                    $importIntegrationService.getLatestFloorplans($scope.imports[0].id, $scope.pms.selectedProperty.id).then(function(response) {
                                        response.data.forEach(function(fp) {
                                            $scope.pms.unmappedFloorplans.push({
                                                id: fp.id,
                                                name: "Yardi: " + fp.bedrooms + "x" + fp.bathrooms + " " + fp.description + ", Sqft: " + fp.sqft + ", Units: "+ fp.units,
                                                mappedId: null,
                                                bedrooms: fp.bedrooms,
                                                bathrooms: fp.bathrooms,
                                                description: fp.description,
                                                sqft: fp.sqft,
                                                units: fp.units
                                            });
                                        });
                                        $scope.loaded = true;
                                    });
                                } else {
                                    $scope.loaded = true;
                                }
                            });
                        }
                    });
                });
            };

            $scope.disconnect = function() {
                $scope.loaded = false;
                $propertyService.updatePms($scope.property._id, undefined).then(function(response) {
                    toastr.warning($scope.property.name + " has been disconnected from the PMS");
                    $scope.loaded = true;
                    $scope.reload();
                });
            };

            $scope.connect = function() {
                var pms = {
                    importId: $scope.imports[0].id,
                    importProvider: $scope.imports[0].provider,
                    yardi: {
                        propertyId: $scope.pms.selectedProperty.id,
                        floorplans: []
                    }
                };
                $scope.loaded = false;
                $propertyService.updatePms($scope.property._id, pms).then(function(response) {
                    toastr.success($scope.property.name + " has been connected to the PMS");
                    $scope.loaded = true;
                    $scope.reload();
                });
            };

            $scope.bestmatch = function() {
                var current;
                $scope.pms.unmappedFloorplans.forEach(function(fp) {
                    current = _.filter( $scope.pms.floorplans, function(c) {
                         return c.bedrooms.toString() === fp.bedrooms.toString() && c.bathrooms.toString() === fp.bathrooms.toString();
                    });
                    if (current.length === 1) {
                        fp.mappedId = current[0].id;
                    } else {
                        current = _.filter(current, function(c) {
                            return c.description.toString() === fp.description.toString();
                        });
                        if (current.length === 1) {
                            fp.mappedId = current[0].id;
                        } else {
                            current = _.filter(current, function(c) {
                                return c.sqft.toString() === fp.sqft.toString();
                            });
                            if (current.length === 1) {
                                fp.mappedId = current[0].id;
                            } else {
                                current = _.filter(current, function(c) {
                                    return c.units.toString() === fp.units.toString();
                                });
                                if (current.length === 1) {
                                    fp.mappedId = current[0].id;
                                }
                            }
                        }
                    }
                });
            };

            $scope.reload();
        }]);
});
