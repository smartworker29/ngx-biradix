'use strict';
define([
    'app'
], function (app) {

    app.directive('trendsTimeSeries', function () {
        return {
            restrict: 'E',
            scope: {
                options: '=',
                settings: '=',
                report: '=',
                cbLegendClicked: '&',
                legendUpdated: '='
            },
            controller: function ($scope, $element) {


                $scope.$watch('legendUpdated', function (a, b) {

                    if ($scope.legendUpdated) {
                        var el2 = $($element).find('.hidden-print-block')

                        var chart = el2.highcharts();
                        chart.series.forEach(function (s) {

                            if (s.name == $scope.legendUpdated.name && s.visible != $scope.legendUpdated.visible) {

                                $scope.calcExtremes(chart, s.name);

                                if (s.visible) {
                                    s.hide();
                                }
                                else {
                                    s.show();
                                }
                            }
                        })

                    }
                }, true);

                $scope.calcExtremes = function(chart, name) {
                    var min = 0;
                    var max = 0;
                    var temp;
                    var foundmin = false;
                    var foundmax = false;
                    chart.series.forEach(function(s) {
                        if (s.visible && name != s.name || !s.visible && name == s.name) {
                            temp = _.min(_.filter(s.processedYData, function(x) {return x != null}));
                            if (temp < min || !foundmin) {
                                min = temp;
                                foundmin = true;
                            }

                            temp = _.max(s.processedYData);
                            if (temp > max || !foundmax) {
                                max = temp;
                                foundmax = true;
                            }
                        }
                    })

                    chart.yAxis[0].setExtremes(min, max);
                }
                $scope.$watch('report', function(a,b){
                    if ($scope.report) {
                        window.setTimeout(function() {

                            var d1 = $scope.settings.daterange1.selectedRange;
                            var d2 = $scope.settings.daterange2.selectedRange;

                            if (d1 == "Custom Range") {
                                var d1s, d1e;
                                if ($scope.settings.daterange1.selectedStartDate._isUTC) {
                                    d1s = moment($scope.settings.daterange1.selectedStartDate._d).subtract($scope.settings.daterange1.selectedStartDate._offset, 'minute').format("MM/DD/YY");
                                } else {
                                    d1s = moment($scope.settings.daterange1.selectedStartDate._d).format("MM/DD/YY");
                                }

                                if ($scope.settings.daterange1.selectedEndDate._isUTC) {
                                    d1e = moment($scope.settings.daterange1.selectedEndDate._d).subtract($scope.settings.daterange1.selectedEndDate._offset, 'minute').endOf("day").format("MM/DD/YY");
                                } else {
                                    d1e = moment($scope.settings.daterange1.selectedEndDate._d).endOf("day").format("MM/DD/YY");
                                }

                                d1 = d1s + "-" + d1e;
                            }

                            if (d2 == "Custom Range") {
                                var d2s, d2e;
                                if ($scope.settings.daterange2.selectedStartDate._isUTC) {
                                    d2s = moment($scope.settings.daterange2.selectedStartDate._d).subtract($scope.settings.daterange2.selectedStartDate._offset, 'minute').format("MM/DD/YY");
                                } else {
                                    d2s = moment($scope.settings.daterange2.selectedStartDate._d).format("MM/DD/YY");
                                }

                                if ($scope.settings.daterange2.selectedEndDate._isUTC) {
                                    d2e = moment($scope.settings.daterange2.selectedEndDate._d).subtract($scope.settings.daterange2.selectedEndDate._offset, 'minute').endOf("day").format("MM/DD/YY");
                                } else {
                                    d2e = moment($scope.settings.daterange2.selectedEndDate._d).endOf("day").format("MM/DD/YY");
                                }

                                d2 = d2s + "-" + d2e;
                            }


                            var d1subject = {name: "(" + d1 + ") " + $scope.report.date1.dashboard.property.name, data:[], color: '#7CB5EC'};
                            var d1scomps = {name: "(" + d1 + ") " + 'Comps', data:[], color: "#434348"};

                            var d2subject = {name: "(" + d2 + ") " + $scope.report.date1.dashboard.property.name, data:[],dashStyle: 'shortdash', color: '#7CB5EC'};
                            var d2scomps = {name: "(" + d2 + ") " + 'Comps', data:[],dashStyle: 'shortdash', color: "#434348"};


                            $scope.report.dates.forEach(function(d,i) {
                                if (d.points[$scope.options.metric].day1subject)
                                d1subject.data.push(d.points[$scope.options.metric].day1subject ? {x:i,y: Math.round(d.points[$scope.options.metric].day1subject * 100) / 100, custom: d.day1date} : null)

                                if (d.points[$scope.options.metric].day1averages)
                                d1scomps.data.push(d.points[$scope.options.metric].day1averages ? {x:i,y: Math.round(d.points[$scope.options.metric].day1averages * 100) / 100, custom: d.day1date} : null)

                                if (d.points[$scope.options.metric].day2subject)
                                d2subject.data.push(d.points[$scope.options.metric].day2subject ? {x:i,y: Math.round(d.points[$scope.options.metric].day2subject * 100) / 100, custom: d.day2date} : null)

                                if (d.points[$scope.options.metric].day2averages)
                                d2scomps.data.push(d.points[$scope.options.metric].day2averages ? {x:i,y: Math.round(d.points[$scope.options.metric].day2averages * 100) / 100, custom: d.day2date} : null)

                                if (typeof d.points[$scope.options.metric].day1subject != 'undefined' && (typeof $scope.options.min == 'undefined' || d.points[$scope.options.metric].day1subject <  $scope.options.min)) {
                                    $scope.options.min = d.points[$scope.options.metric].day1subject;
                                }
                                if (typeof d.points[$scope.options.metric].day1averages != 'undefined' && (typeof $scope.options.min == 'undefined' || d.points[$scope.options.metric].day1averages <  $scope.options.min)) {
                                    $scope.options.min = d.points[$scope.options.metric].day1averages;
                                }
                                if (typeof d.points[$scope.options.metric].day2subject != 'undefined' && (typeof $scope.options.min == 'undefined' || d.points[$scope.options.metric].day1subject <  $scope.options.min)) {
                                    $scope.options.min = d.points[$scope.options.metric].day2subject;
                                }
                                if (typeof d.points[$scope.options.metric].day2averages != 'undefined' && (typeof $scope.options.min == 'undefined' || d.points[$scope.options.metric].day1subject <  $scope.options.min)) {
                                    $scope.options.min = d.points[$scope.options.metric].day2averages;
                                }

                                if (typeof d.points[$scope.options.metric].day1subject != 'undefined' && (typeof $scope.options.max == 'undefined' || d.points[$scope.options.metric].day1subject >  $scope.options.max)) {
                                    $scope.options.max = d.points[$scope.options.metric].day1subject;
                                }
                                if (typeof d.points[$scope.options.metric].day1averages != 'undefined' && (typeof $scope.options.max == 'undefined' || d.points[$scope.options.metric].day1averages >  $scope.options.max)) {
                                    $scope.options.max = d.points[$scope.options.metric].day1averages;
                                }
                                if (typeof d.points[$scope.options.metric].day2subject != 'undefined' && (typeof $scope.options.max == 'undefined' || d.points[$scope.options.metric].day1subject >  $scope.options.max)) {
                                    $scope.options.max = d.points[$scope.options.metric].day2subject;
                                }
                                if (typeof d.points[$scope.options.metric].day2averages != 'undefined' && (typeof $scope.options.max == 'undefined' || d.points[$scope.options.metric].day1subject >  $scope.options.max)) {
                                    $scope.options.max = d.points[$scope.options.metric].day2averages;
                                }

                            })

                            var data = [d1subject,d1scomps];

                            if ($scope.report.date2) {
                                data.push(d2subject);
                                data.push(d2scomps);
                            }

                            var el = $($element).find('.visible-print-block')
                            var el2 = $($element).find('.hidden-print-block')
                            var container = $("#timeseries-container")

                            var isMobile = $(window).width() < 600;

                            var data = {
                                chart: {
                                    type: 'spline',
                                    ignoreHiddenSeries : true,
                                    marginLeft: 50, // Keep all charts left aligned
                                    spacingTop: 20,
                                    spacingBottom: 20
                                },
                                plotOptions: {
                                    series: {
                                        animation: !phantom,
                                        events: {
                                            legendItemClick: function () {

                                                var name = this.name;
                                                if ($scope.cbLegendClicked) {

                                                    var visible =  !this.visible;
                                                    $scope.cbLegendClicked({legend : {name: name, visible: visible}});

                                                }

                                                $scope.calcExtremes(this.chart, name);


                                            }
                                        }
                                    },
                                    spline: {
                                        marker: {
                                            enabled: false
                                        }
                                    }
                                },
                                title: {
                                    text: $scope.options.title,
                                    align: 'left',
                                    margin: 0,
                                    x: 40
                                },
                                xAxis: {
                                    crosshair: false,
                                    allowDecimals: false,
                                    categries: [0, 1,2, 3, 4, 5, 6, 7, 8, 9 , 10],
                                    labels: {
                                        formatter: function () {
                                            return 'Week: ' + (this.value + 1);
                                        }
                                    }
                                },
                                yAxis: {
                                    title: {
                                        text: ""
                                    }
                                },
                                tooltip: {
                                    shared: true,
                                    formatter: function() {
                                        var s = "<span>Week "+(this.x + 1)+"</span><br/>";

                                        var series = this.points[0].series.chart.series;

                                        var x = this.x;

                                        var y;
                                        var d;
                                        series.forEach(function(p) {
                                            if (p.visible) {
                                                y = _.find(p.data, function (z) {
                                                    return z.x == x
                                                });

                                                if (y) {
                                                    d = moment(y.custom).format("MMM DD, YYYY")
                                                    y = y.y;

                                                    if (y) {
                                                        s += '<span style="color:' + p.color + ';">\u25CF</span> ' + p.name + ' - <i>' + d + '</i>: <b>' + $scope.options.prefix + y.toFixed($scope.options.decimalPlaces).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + $scope.options.suffix + '</b><br/>';
                                                    }
                                                }
                                            }

                                        })

                                        return s;

                                    },
                                },
                                credits: {
                                    enabled: false
                                },
                                legend: {
                                    layout: isMobile ? 'horizontal' :  'vertical',
                                    align: isMobile ? 'left' :'right',
                                    verticalAlign: isMobile ? 'bottom' : 'top',
                                    borderWidth: 0,
                                },
                                series: data
                            };

                            var chart;
                            if (phantom) {
                                chart = el.highcharts(data);
                            }
                            else {
                                chart = el2.highcharts(data);
                                container.bind('mouseout', function (e) {

                                    var chart,
                                        point,
                                        i,
                                        j
                                        ;

                                    for (i = 0; i < Highcharts.charts.length; i = i + 1) {
                                        chart = Highcharts.charts[i];


                                        if (chart && chart.pointer) {

                                            for(j =0;j<=3;j++) {
                                                if (chart.series.length > j) {
                                                    chart.series[j].points.forEach(function(point) {
                                                        if (point.state == 'hover') {
                                                            point.series.chart.tooltip.hide();
                                                            point.onMouseOut();

                                                        }
                                                    });

                                                }
                                            }
                                        }
                                    }
                                });
                                container.bind('mousemove touchmove touchstart', function (e) {
                                    var chart,
                                        point,
                                        i,
                                        j,
                                        event;

                                    var points = [];


                                    var clientX = 0;

                                    for (i = 0; i < Highcharts.charts.length; i = i + 1) {
                                        chart = Highcharts.charts[i];

                                        // if (chart) {
                                        //     chart.xAxis[0].update({
                                        //         crosshair: true
                                        //     });
                                        // }

                                        if (chart && chart.pointer) {
                                            event = chart.pointer.normalize(e.originalEvent); // Find coordinates within the chart

                                            // console.log(event);
                                            clientX = event.clientX;
                                            point = null;
                                            for(j =0;j<=3;j++) {
                                                if (chart.series.length > j) {
                                                    point = chart.series[j].searchPoint(event, true); // Get the hovered point
                                                    if (point) {
                                                        points.push({i: i, x: point.x, point: point})
                                                    }

                                                }
                                            }
                                        }
                                    }

                                    var min = 999
                                    var mindist = 99999;

                                    points.forEach(function(p) {
                                        // console.log(p.point.clientX - clientX);
                                        if (Math.abs(p.point.clientX - clientX) < mindist) {
                                            mindist = Math.abs(p.point.clientX - clientX);
                                            min = p.x;
                                        }
                                    })

                                    //console.log(min);
                                    //console.log(points);

                                    if (min < 999) {
                                        var found = {};
                                        points.forEach(function(p) {
                                            if (p.x == min && !found[p.i]) {
                                                //console.log(p);
                                                p.point.onMouseOver();
                                                found[p.i] = true;
                                            }
                                        })
                                    }

                                });
                            }

                            Highcharts.charts.forEach(function(chart) {
                                if (chart && !$("#" + chart.container.id).length) {
                                    chart.destroy();
                                }

                                if (chart && chart.pointer) {
                                    chart.pointer.reset = function () {
                                        return undefined
                                    };
                                }

                            })

                            $scope.calcExtremes(chart.highcharts());

                        }, 0);

                    }

                });


            },
            template:
                // "<h4>{{options.title}}</h4>"+
                "<div ng-style=\"{'height': options.height + 'px', 'width': '85%'}\" class=\"visible-print-block\"></div>"+
                "<div ng-style=\"{'height': options.height + 'px'}\" class=\"hidden-print-block\"></div>"
        };
    })
})
