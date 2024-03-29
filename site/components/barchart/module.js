angular.module("biradix.global").directive("barChart", function() {
    return {
        restrict: "E",
        scope: {
            options: "=",
        },
        controller: function($scope, $element) {
            Highcharts.setOptions({
                global: {
                    useUTC: false,
                },
            });

            $scope.$watch("options", function() {
                if ($scope.options) {
                    window.setTimeout(function() {
                        var el = $($element).find("div");

                        var data = {
                            chart: {
                                type: $scope.options.type || "column",
                            },
                            title: {
                                text: "",
                            },
                            xAxis: {
                                type: "category",
                                labels: {
                                    rotation: -45,
                                    style: {
                                        fontSize: "13px",
                                        fontFamily: "Verdana, sans-serif",
                                    },
                                },
                            },
                            yAxis: {
                                min: 0,
                                allowDecimals: false,
                                title: {
                                    text: $scope.options.yLabel,
                                },
                            },
                            tooltip: {
                                enabled: false,
                            },
                            credits: {
                                enabled: false,
                            },
                            legend: {
                                enabled: false,
                            },
                            series: $scope.options.data,
                        };

                        data.series[0].dataLabels = {
                            enabled: true,
                            color: "#000000",
                            align: "center",
                            verticalAlign: "bottom",
                            format: "{point.y:.0f}", // one decimal
                        };

                        el.highcharts(data);

                        Highcharts.charts.forEach(function(chart) {
                            if (chart && Object.keys(chart).length > 0 && !$("#" + chart.container.id).length) {
                                chart.destroy();
                            }
                        });
                    }, 200);
                }
            });
        },
        templateUrl: "/components/barchart/barchart.html?bust=" + version,
    };
});
