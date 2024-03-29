"use strict";
define([
    "app"
], function(app) {
    app.controller("pmsSetupController", ["$scope", "$uibModalInstance", "property", "ngProgress", "$propertyService", "$importService", "$importIntegrationService", "toastr", "$dialog", "$rootScope", "$q",
        function($scope, $uibModalInstance, property, ngProgress, $propertyService, $importService, $importIntegrationService, toastr, $dialog, $rootScope, $q) {
            ga("set", "title", "/pmsSetup");
            ga("set", "page", "/pmsSetup");
            ga("send", "pageview");

            $scope.pricingStrategies = [
                {value: 1, description: "(Rev Mgmt Rent) + (Rev Mgmt Amenities) - (Rev Mgmt Concessions/12)"},
                {value: 2, description: "(Rev Mgmt Rent) + (Unit Amenities - excluding \"Rent\" Amenity)"},
                {value: 3, description: "Unit Rent"},
                {value: 4, description: "Total Unit Amenities"},
                {value: 5, description: "(UnitType Rent) +  (Unit Amenities - excluding \"Rent\" Amenity)"},

            ]
            $scope.pms = {
                selectedPricing: null,
                selectedProperty: null,
                config: null,
                floorplans: [],
                unmappedFloorplans: [],
                excludedFloorplans: [],
                importYardiUrl: ""
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
                    $scope.pms.floorplans = [];
                    $scope.pms.unmappedFloorplans = [];
                    $scope.pms.excludedFloorplans = [];

                    if ($scope.pms.config && $scope.pms.config.yardi) {
                        $scope.pms.config.yardi.pricingStrategy = $scope.pms.config.yardi.pricingStrategy || 1;
                        $scope.pms.selectedPricing = _.find($scope.pricingStrategies, function (x) {
                            return x.value.toString() === $scope.pms.config.yardi.pricingStrategy.toString();
                        });
                    }

                    $importService.read($scope.property.orgid.toString(), true).then(function(response) {
                        $scope.imports = response.data;

                        if ($scope.imports.length > 0) {

                            if ($scope.property.pms && $scope.property.pms.importId) {
                                $scope.imports = _.filter($scope.imports, function(i) {
                                    return (i.id === $scope.property.pms.importId);
                                });
                            }

                            var promises = _.map($scope.imports, function (obj) {
                                return $importIntegrationService.getLatestProperties(obj.id);
                            });

                            $q.all(promises).then(function (response) {

                                var props = [];
                                for(var i = 0; i < response.length; i++) {
                                    props = props.concat(_.map(response[i].data.properties, function(x) {
                                        return {
                                            id: x.id,
                                            name: x.name,
                                            revManagement: x.revManagement,
                                            state:x.state,
                                            city: x.city,
                                            code: x.code,
                                            address:x.address,
                                            zip: x.zip,
                                            importId: response[i].data.importId
                                        }
                                    }));
                                }

                                $scope.properties = props;
                                
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

                                if ($scope.pms.config && $scope.pms.config.importId && $scope.pms.selectedProperty) { 
                                    $scope.pms.importYardiUrl ="https://biradix-integrations-yardi.herokuapp.com/yardi/ui/latestImport/"+
                                    + $scope.property.pms.yardi.propertyId +"?key=" + $scope.pms.selectedProperty.importId;
                                }

                                $scope.property.floorplans.forEach(function(fp) {
                                    $scope.pms.floorplans.push({
                                        id: fp.id,
                                        name: fp.bedrooms + "x" + fp.bathrooms + " " + fp.description + ", Sqft: " + fp.sqft + ", Units: "+ fp.units,
                                        bedrooms: fp.bedrooms,
                                        bathrooms: fp.bathrooms,
                                        description: fp.description,
                                        sqft: fp.sqft,
                                        units: fp.units,
                                        yardi: []
                                    });
                                });

                                if ($scope.pms.selectedProperty && $scope.pms.config && $scope.pms.config.yardi) {
                                    $importIntegrationService.getLatestFloorplans($scope.pms.selectedProperty.importId, $scope.pms.selectedProperty.id).then(function(response) {
                                        response.data.forEach(function(fp) {
                                            $scope.pms.unmappedFloorplans.push({
                                                id: fp.id,
                                                name: fp.bedrooms + "x" + fp.bathrooms + " " + fp.description + ", Sqft: " + fp.sqft + ", Units: "+ fp.units,
                                                mappedId: null,
                                                bedrooms: fp.bedrooms,
                                                bathrooms: fp.bathrooms,
                                                description: fp.description,
                                                sqft: fp.sqft,
                                                units: fp.units
                                            });
                                        });

                                        var yardi;
                                        var biradix;
                                        $scope.pms.config.yardi.floorplans.forEach(function(fp) {
                                            yardi = _.find($scope.pms.unmappedFloorplans, function(ufp) {
                                               return ufp.id.toString() === fp.yardiFloorplanId.toString();
                                            });

                                            biradix = _.find($scope.pms.floorplans, function(ufp) {
                                                return ufp.id.toString() === fp.floorplanId.toString();
                                            });

                                            if (yardi) {
                                                if (fp.floorplanId === "EXCLUDE") {
                                                    $scope.pms.excludedFloorplans.push(yardi);
                                                    yardi.deleted = true;
                                                } else if (biradix) {
                                                    yardi.deleted = true;
                                                    biradix.yardi.push(yardi);
                                                }
                                            }
                                        });

                                        _.remove($scope.pms.unmappedFloorplans, function(x) {
                                            return x.deleted;
                                        });

                                        $scope.loaded = true;
                                    });
                                } else {
                                    $scope.loaded = true;
                                }
                            }, function (error) {
                                console.log(error);
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

            $scope.connect = function(isNew) {
                var selectedImport = _.filter($scope.imports, function(i) {
                    return (i.id === $scope.pms.selectedProperty.importId);
                });

                var pms = {
                    importId: selectedImport[0].id,
                    importProvider: selectedImport[0].provider,
                    yardi: {
                        propertyId: $scope.pms.selectedProperty.id,
                        floorplans: [],
                        pricingStrategy: 1
                    },

                };
                if (!isNew) {
                    pms.yardi.pricingStrategy = $scope.pms.selectedPricing.value;
                    $scope.pms.floorplans.forEach(function(fp) {
                        fp.yardi.forEach(function(y) {
                            pms.yardi.floorplans.push({
                                floorplanId: fp.id.toString(),
                                yardiFloorplanId: y.id.toString(),
                            });
                        });
                    });

                    $scope.pms.excludedFloorplans.forEach(function(fp) {
                        pms.yardi.floorplans.push({
                            floorplanId: "EXCLUDE",
                            yardiFloorplanId: fp.id.toString(),
                        });
                    });
                }
                $scope.loaded = false;
                $propertyService.updatePms($scope.property._id, pms).then(function(response) {
                    if (isNew) {
                        toastr.success($scope.property.name + " has been connected to the PMS");
                    } else {
                        toastr.success($scope.property.name + " mapped floor plans have been updated");
                    }
                    $scope.loaded = true;
                    $scope.reload();
                });
            };

            $scope.bestmatch = function() {
                var current;
                $scope.pms.unmappedFloorplans.forEach(function(fp) {
                    if ((fp.bedrooms.toString() === "0" && fp.bathrooms.toString() === "0") || fp.units.toString() === "0") {
                        $scope.pms.excludedFloorplans.push(fp);
                        fp.deleted = true;
                    } else {
                        current = _.filter($scope.pms.floorplans, function (c) {
                            return c.bedrooms.toString() === fp.bedrooms.toString() && c.bathrooms.toString() === fp.bathrooms.toString();
                        });
                        if (current.length === 1) {
                            current[0].yardi.push(fp);
                            fp.deleted = true;
                        } else {
                            current = _.filter(current, function (c) {
                                return c.sqft.toString() === fp.sqft.toString();
                            });
                            if (current.length === 1) {
                                current[0].yardi.push(fp);
                                fp.deleted = true;
                            } else {
                                current = _.filter(current, function (c) {
                                    return c.units.toString() === fp.units.toString();
                                });
                                if (current.length === 1) {
                                    current[0].yardi.push(fp);
                                    fp.deleted = true;
                                }
                            }
                        }
                    }
                });

                _.remove($scope.pms.unmappedFloorplans, function(x) {
                    return x.deleted;
                });
            };

            $scope.unitsMatch = function(floorplan) {
                return floorplan.units === _.sum(floorplan.yardi, function(x) {
                    return x.units;
                });
            };
    
            $scope.$watch('pms.floorplans', function (newValue) {
                newValue.forEach(function(y){
                    y.yardi = _.sortByAll(y.yardi, ['bedrooms', 'bathrooms', 'sqft', 'description', 'units']);
                });
            }, true);
    
            $scope.$watch('pms.unmappedFloorplans', function (newValue) {
                $scope.pms.unmappedFloorplans = _.sortByAll(newValue, ['bedrooms', 'bathrooms', 'sqft', 'description', 'units']);
            }, true);
    
            $scope.$watch('pms.excludedFloorplans', function (newValue) {
                $scope.pms.excludedFloorplans = _.sortByAll(newValue, ['bedrooms', 'bathrooms', 'sqft', 'description', 'units']);
            }, true);

            $scope.sortableOptions = {
              connectWith: '.list'
            };

            $scope.reload();
        }]);
});
