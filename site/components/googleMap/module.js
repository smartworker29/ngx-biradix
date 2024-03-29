angular.module("biradix.global").directive("googleMap", function () {
        return {
            restrict: "E",
            scope: {
                options: "="
            },
            controller: function ($scope, $element, $rootScope) {

                $scope.phantom = phantom;
                $scope.$watch("options", function() {
                    if ($scope.options) {
                        $scope.options.points = $scope.options.points || [];
                        delete $scope.error;

                        if (!phantom) {
                            $scope.error = typeof google === "undefined";
                            if ($scope.error) {
                                global_error({stack: "Google maps not available, showing static map"}, {location: location.href});
                            }
                        }

                        if (!$scope.error && !phantom) {
                            if ($scope.aMarkers) {
                                for (var i = 0; i < $scope.aMarkers.length; i++) {
                                    google.maps.event.removeListener($scope.aMarkers[i].handle);
                                }
                            }
                            $scope.aMarkers = [];

                            var mapOptions = {
                                zoom: 14,
                                center: new google.maps.LatLng($scope.options.loc[0], $scope.options.loc[1]),
                                mapTypeId: google.maps.MapTypeId.ROADMAP,
                                disableDefaultUI: true,
                                fullscreenControl: !phantom
                            };

                            var elMap = $($element).find("div")[0];
                            $scope.oMap = new google.maps.Map(elMap, mapOptions);

                            $scope.loadMarkers();

                            $(elMap).width($scope.options.width);
                            $(elMap).height($scope.options.height + "px");
                        }

                        $scope.staticUrl = "/i"
                            + "?size=" + $scope.options.printWidth + "x" + $scope.options.height
                            + "&key=AIzaSyDmWIi-fgJL9nzi9S2oX42grQxqzfLvaeU"

                        $scope.options.points.forEach(function(p, i) {
                            if (i === 0) {
                                $scope.staticUrl += "&markers=icon:https://qa.biradix.com/components/googleMap/markers/" + p.marker + ".png%7C" + p.loc[0] + "," + p.loc[1];
                            } else {
                                $scope.staticUrl += "&markers=color:0x1E90FF%7Clabel:" + i + "%7C" + p.loc[0] + "," + p.loc[1];
                            }
                        })

                        if (phantom) {
                            $rootScope.$broadcast("timeseriesLoaded");
                        }
                    }
                });

                $scope.closeAllInfoBoxes = function() {
                    for (var i = 0; i < $scope.aMarkers.length; i++) {
                        if ($scope.aMarkers[i] != null) {
                            $scope.aMarkers[i].info.close();
                        }
                    }
                }

                $scope.loadMarkers = function() {
                    var bounds = new google.maps.LatLngBounds();
                    for (var i = 0; i < $scope.options.points.length; i++) {
                        var oPoint = $scope.options.points[i];
                        $scope.aMarkers[i] = new google.maps.Marker({
                            map: $scope.oMap,
                            position: new google.maps.LatLng(oPoint.loc[0], oPoint.loc[1]),
                            icon: "/components/googleMap/markers/" + oPoint.marker + ".png",
                            clickable: true,
                            title: oPoint.Name,
                            info: new google.maps.InfoWindow({
                                content: oPoint.content,
                            }),
                            zIndex: 100 - i,
                        });

                        $scope.aMarkers[i].handle = google.maps.event.addListener($scope.aMarkers[i], "click", function () {
                            $scope.closeAllInfoBoxes();
                            this.info.open($scope.oMap, this);
                        });

                        bounds.extend($scope.aMarkers[i].position);
                    }

                    if ($scope.aMarkers.length > 1) {
                        $scope.oMap.fitBounds(bounds);
                    }
                };
            },
            template: phantom ? "<img ng-src='{{staticUrl}}'>" : "<div></div>"
        };
    })
