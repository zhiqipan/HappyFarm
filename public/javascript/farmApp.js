var app = angular.module('farmApp', []);

app.controller('farmController', function ($scope, $http, $cacheFactory) {

    $scope.showWelcome = true;

    function initialize() {
        $http.get('/db/getuserinfo').then(function (res) {
            $scope.userInfo = res.data;
        });
        $http.get('/db/getsensordata').then(function (res) {
            $scope.sensorData = res.data;
        })
    }

    initialize();

    $scope.show = function () {
        $scope.showWelcome = false;
    };

    $scope.show();

});

app.directive('myngRadarChart', function ($window, $http, $cacheFactory) {
    function link(scope, element, attrs) {

        var max = {
            temperature: 25,
            humidity: 40,
            sunlight: 70,
            soilQuality: 100,
            acidity: 8
        };
        var min = {
            temperature: 13,
            humidity: 18,
            sunlight: 25,
            soilQuality: 72,
            acidity: 5
        };
        var optimal = {
            temperature: (max.temperature + min.temperature) / 2,
            humidity: (max.humidity + min.humidity) / 2,
            sunlight: (max.sunlight + min.sunlight) / 2,
            soilQuality: (max.soilQuality + min.soilQuality) / 2,
            acidity: (max.acidity + min.acidity) / 2
        };
        var minimalRequirement = {
            temperatureRatio: (max.temperature - optimal.temperature) / optimal.temperature,
            humidityRatio: (max.humidity - optimal.humidity) / optimal.humidity,
            sunlightRatio: (max.sunlight - optimal.sunlight) / optimal.sunlight,
            soilQualityRatio: (max.soilQuality - optimal.soilQuality) / optimal.soilQuality,
            acidityRatio: (max.acidity - optimal.acidity) / optimal.acidity
        };

        // get data
        var latestData = [];
        scope.$watch('data', function (newValue) {
            if (newValue !== undefined) {
                latestData = newValue[newValue.length - 1];
                makeChart(latestData, optimal, minimalRequirement);
            }
        });

        function makeChart(latestData, optimal) {
            // set up
            var cssWidth = $window.getComputedStyle(element[0].parentElement)['width'].replace('px', '');
            var margin = {top: 100, right: 100, bottom: 100, left: 100},
                width = Math.min(cssWidth, window.innerWidth - 10) - margin.left - margin.right,
                height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);
            // data
            var data = [
                [// Minimal
                    // on top of Data
                    {
                        axis: "Temperature",
                        value: 1 - (max.temperature - optimal.temperature) / optimal.temperature
                    },
                    {
                        axis: "Humidity",
                        value: 1 - (max.humidity - optimal.humidity) / optimal.humidity
                    },
                    {
                        axis: "Sunlight",
                        value: 1 - (max.sunlight - optimal.sunlight) / optimal.sunlight
                    },
                    {
                        axis: "Soil",
                        value: 1 - (max.soilQuality - optimal.soilQuality) / optimal.soilQuality
                    },
                    {
                        axis: "Acidity",
                        value: 1 - (max.acidity - optimal.acidity) / optimal.acidity
                    }
                ],
                [// Data
                    {
                        axis: "Temperature",
                        value: 1 - Math.abs(latestData.temperature - optimal.temperature) / optimal.temperature
                    },
                    {
                        axis: "Humidity",
                        value: 1 - Math.abs(latestData.humidity - optimal.humidity) / optimal.humidity
                    },
                    {
                        axis: "Sunlight",
                        value: 1 - Math.abs(latestData.sunlight - optimal.sunlight) / optimal.sunlight
                    },
                    {
                        axis: "Soil",
                        value: 1 - Math.abs(latestData.soilQuality - optimal.soilQuality) / optimal.soilQuality
                    },
                    {
                        axis: "Acidity",
                        value: 1 - Math.abs(latestData.acidity - optimal.acidity) / optimal.acidity
                    }
                ]

            ];
            // draw the chart

            var color = d3.scale.ordinal()
                .range(["#dbdbdb", "#057aff"]); // minimal, data

            var radarChartOptions = {
                w: width,
                h: height,
                margin: margin,
                maxValue: 1,
                levels: 3,
                roundStrokes: false,
                color: color
            };
            //Call function to draw the Radar chart
            RadarChart("#radarChart", data, radarChartOptions, showDetailedChart);

            function showDetailedChart(index) {
                scope.$root.$broadcast('chartChange', index);
            }
        }
    }

    return {
        restrict: 'E',
        scope: {
            'data': '='
        },
        link: link
    }
});

app.directive('myngLineChart', function ($cacheFactory) {
    function link(scope, element, attrs) {
        var data;
        var chartData;
        scope.$watch('data', function (newValue) {
                if (newValue !== undefined) {
                    console.log('CHANGED');
                    data = newValue;
                    chartData = data.map(function (a) {
                        return {
                            name: 'Temperature',
                            x: a.time,
                            y: a.temperature // default
                            // TODO: should add unit
                        }
                    });
                    makeChart(chartData);
                }
            }
        );

        scope.$on('chartChange', function (event, msg) {
            console.log('Change to chart #' + msg);
            d3.selectAll("#lineChart > *").remove(); // remove the current chart
            console.log(parseInt(msg) == 0);
            switch (parseInt(msg)) {
                case 0:
                    chartData = data.map(function (a) {
                        return {
                            name: 'Temperature',
                            x: a.time,
                            y: a.temperature
                        }
                    });
                    break;
                case 1:
                    chartData = data.map(function (a) {
                        return {
                            name: 'Humidity',
                            x: a.time,
                            y: a.humidity
                        }
                    });
                    break;
                case 2:
                    chartData = data.map(function (a) {
                        return {
                            name: 'Sunlight',
                            x: a.time,
                            y: a.sunlight
                        }
                    });
                    break;
                case 3:
                    chartData = data.map(function (a) {
                        return {
                            name: 'Soil',
                            x: a.time,
                            y: a.soilQuality
                        }
                    });
                    break;
                case 4:
                    chartData = data.map(function (a) {
                        return {
                            name: 'Acidity',
                            x: a.time,
                            y: a.acidity
                        }
                    });
                    break;
            }
            makeChart(chartData);
        });

        function makeChart(data) {
            // Wrapping in nv.addGraph allows for '0 timeout render', stores rendered charts in nv.graphs, and may do more in the future... it's NOT required
            var chart;
            nv.addGraph(function () {
                chart = nv.models.lineChart()
                    .options({
                        duration: 300,
                        useInteractiveGuideline: true
                    });
                // chart sub-models (ie. xAxis, yAxis, etc) when accessed directly, return themselves, not the parent chart, so need to chain separately
                chart.xAxis
                    .axisLabel("Time (s)")
                    .tickFormat(d3.format(',.1f'))
                    .staggerLabels(true);
                chart.yAxis
                    .axisLabel('Voltage (v)')
                    .tickFormat(function (d) {
                        if (d == null) {
                            return 'N/A';
                        }
                        return d3.format(',.2f')(d);
                    });
                data = normalizeData(data);
                d3.select('#lineChart').append('svg')
                    .datum(data)
                    .call(chart);
                nv.utils.windowResize(chart.update);
                return chart;
            });

            function normalizeData(data) {
                var history = [],
                    max = [],
                    min = [];
                data.map(function (a) {
                    history.push({x: a.x, y: a.y});
                });

                return [
                    {
                        area: true,
                        values: history,
                        key: "Sine Wave",
                        color: "#ff7f0e",
                        strokeWidth: 4,
                        classed: 'dashed',
                        fillOpacity: .1
                    }
                ];
            }
        }
    }

    return {
        restrict: 'E',
        scope: {
            'data': '=',
            'index': '='
        },
        link: link
    }
});