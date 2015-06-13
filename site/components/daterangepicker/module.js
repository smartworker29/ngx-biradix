'use strict';
define([
    'app',
    'css!/components/daterangepicker/daterangepicker-bs3',
    '/components/daterangepicker/daterangepicker.js',
], function (app) {
    app.directive('daterangePicker', function () {
        return {
            restrict: 'E',
            scope: {
                daterange: '=',
            },
            controller: function ($scope, $element) {

                $scope.populate = function() {
                    if ($scope.daterange.selectedRange == "Custom Range") {
                        $scope.value = $scope.daterange.selectedStartDate.format('MM/DD/YYYY') + ' - ' + $scope.daterange.selectedEndDate.format('MM/DD/YYYY')
                    }
                    else {
                        if (!$scope.daterange.Ranges[$scope.daterange.selectedRange]) {
                            $scope.daterange.selectedRange = "Last 90 Days"
                        }
                        $scope.daterange.selectedStartDate = $scope.daterange.Ranges[$scope.daterange.selectedRange][0];
                        $scope.daterange.selectedEndDate = $scope.daterange.Ranges[$scope.daterange.selectedRange][1];
                        $scope.value = $scope.daterange.selectedRange;
                    }
                }

                //$scope.$watch('daterange', function() {
                //
                //    if ($scope.daterange) {
                        $scope.populate();
                //    }
                //});

                $($element.find('span')).daterangepicker({
                    format: 'MM/DD/YYYY',
                    startDate: $scope.daterange.selectedStartDate,
                    endDate: $scope.daterange.selectedEndDate,
                    showDropdowns: true,
                    showWeekNumbers: true,
                    timePicker: false,
                    timePickerIncrement: 1,
                    timePicker12Hour: true,
                    ranges: $scope.daterange.Ranges,

                    opens: 'left',
                    drops: 'down',
                    buttonClasses: ['btn', 'btn-sm'],
                    applyClass: 'btn-primary',
                    cancelClass: 'btn-default',
                }, function (start, end, label) {
                    $scope.daterange.selectedStartDate = start;
                    $scope.daterange.selectedEndDate = end;
                    $scope.daterange.selectedRange = label;
                    $scope.populate()

                });
            },
            templateUrl: '/components/daterangepicker/daterangepicker.html'
        };
    })
})