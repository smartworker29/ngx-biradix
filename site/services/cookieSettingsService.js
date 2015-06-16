'use strict';
define(['app'], function (app) {
    app.factory('$cookieSettingsService', ['$cookies', function ($cookies) {
        var fac = {};

        fac.getSummary = function () {
            return JSON.parse($cookies.get('Summary') || "false")
        }

        fac.saveSummary = function(summary) {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('Summary', summary, {expires : expireDate})
        }

        fac.getDaterange = function () {
            return {
                Ranges : {
                    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                    'Last 90 Days': [moment().subtract(89, 'days'), moment()],
                    'Last Year': [moment().subtract(1, 'year'), moment()],
                    'Lifetime': [moment().subtract(30, 'year'), moment()],
                },
                selectedRange : $cookies.get('selectedRange') || "Last 90 Days",
                selectedStartDate : moment($cookies.get('selectedStartDate')),
                selectedEndDate : moment($cookies.get('selectedEndDate'))
            }
        }

        fac.saveDaterange = function (daterange) {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('selectedStartDate', daterange.selectedStartDate.format(), {expires : expireDate})
            $cookies.put('selectedEndDate', daterange.selectedEndDate.format(), {expires : expireDate})
            $cookies.put('selectedRange', daterange.selectedRange, {expires : expireDate})
        }

        return fac;
    }]);
});