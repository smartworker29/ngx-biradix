'use strict';

function resolve($q, ctrl) {
    var deferred = $q.defer();
    require([
        ctrl
    ], function () {
        deferred.resolve();
    });
    return deferred.promise;
}

define([
    '../components/ngProgress/module'
], function () {
    var app = angular.module('Team', [
        , 'ui.router'
        , 'ui.bootstrap'
        , 'toastr'
        , 'ngCookies'
        , 'ngProgress'
    ]);

    app.config(function ($controllerProvider, $provide, $compileProvider, $filterProvider, $stateProvider, $urlRouterProvider, toastrConfig) {
        app.controller = $controllerProvider.register;
        app.factory = $provide.factory;
        app.directive = $compileProvider.directive;
        app.filter = $filterProvider.register;

        angular.extend(toastrConfig, {
            timeOut: 5000,
            closeButton: true,
            positionClass: 'toast-top-full-width'
        });

        $urlRouterProvider.otherwise("/dashboard");

        $stateProvider
            .state('login', {
                url: "/login",
                views: {
                    "loggedOutView": {
                        templateUrl: "app/login/login.html",
                        controller : "loginController"
                    }
                },
                resolve: {get : function($q) {return resolve($q, 'login/loginController')}}
            })
            .state('dashboard', {
                url: "/dashboard",
                views: {
                    "loggedInView": {
                        templateUrl: "app/dashboard/dashboard.html" ,
                        controller : "dashboardController"
                    }

                },
                resolve: {get : function($q) {return resolve($q, 'dashboard/dashboardController')}}
            })
    });

    return app;
});