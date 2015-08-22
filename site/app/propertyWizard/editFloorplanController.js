'use strict';
define([
    'app',
], function (app) {
     app.controller
        ('editFloorplanController', ['$scope', '$modalInstance', 'fp','toastr','unitItems','unitAmenityOptions','values','addAmenityGlobal', function ($scope, $modalInstance, fp, toastr,unitItems,unitAmenityOptions,values,addAmenityGlobal) {

            $scope.edit = false;

            $scope.values = values;

            $scope.unitAmenityOptions = unitAmenityOptions;
            //reset the "Add new Unit Amenity" box, since its global and reused between different floorplans
            $scope.values.newUnitAmenity = '';

            //Clone amenities so we dont change master
            $scope.unitItemsCopy = _.cloneDeep(unitItems);

            if (fp) {
                $scope.edit = true;

                //This causes angular to crash when binding to a numeric field
                fp.bathrooms = parseFloat(fp.bathrooms);

                //select all seleced amenities in the copy of our unit amenities
                fp.amenities.forEach(function(pa) {
                    var am = _.find($scope.unitItemsCopy, function(a) {
                        return a.id.toString() == pa.toString()});
                    if (am) {
                        am.selected = true;
                    }
                })
            }


            //Clone the entire floor plan so we dont two way bind in case we need to cancel
            $scope.fpCopy = _.cloneDeep(fp);

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $scope.getTitle = function() {
                var title = "";

                return fp ? "Edit Floor Plan" : "Add Floor Plan";
            };

            $scope.saveFloorplan = function() {
                if ($scope.edit) {
                    fp.bedrooms = $scope.fpCopy.bedrooms;
                    fp.bathrooms = $scope.fpCopy.bathrooms;

                    fp.description = $scope.fpCopy.description;
                    fp.sqft = $scope.fpCopy.sqft;
                    fp.units = $scope.fpCopy.units;
                    fp.amenities = $scope.populateAmenities();
                    $modalInstance.close();
                }else {
                    $scope.fpCopy.amenities = $scope.populateAmenities();
                    $modalInstance.close($scope.fpCopy);
                }
            }

            $scope.populateAmenities = function() {
                var response = [];
                $scope.unitItemsCopy.forEach(function(a) {
                    if (a.selected) {
                        response.push(a.id.toString())
                    }
                })

                return response;
            }

            //Calls global function to update copy of unit amenities for this floorplan
            $scope.addAmenity = function() {
                addAmenityGlobal("Unit", $scope.unitItemsCopy)
            }

            //add a watch to update global total unit amenities list in case we add new items here
            $scope.$watch("unitItemsCopy", function() {
                $scope.unitItemsCopy.forEach(function(a) {
                    var exists = _.find(unitItems, function(x) {return x.name == a.name && x.group == a.group});

                    if (!exists) {
                        var newItem = _.cloneDeep(a);
                        newItem.selected = false;
                        unitItems.push(newItem);
                    }
                })
            }, true)
        }]);

});