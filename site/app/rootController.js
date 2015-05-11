'use strict';
define([
    'app',
    '../services/authService'
], function (app) {

    app.controller('rootController', ['$scope','$location','$rootScope','$cookies','$authService', '$window', '$modal', function ($scope, $location, $rootScope, $cookies, $authService, $window, $modal) {

            if ($cookies.get('token')) {
                $rootScope.loggedIn = true;
            }
            else {
                $rootScope.loggedIn = false;
            }

            $rootScope.getMe = function(callback) {
                $authService.me($cookies.get('token'), function(usr, status) {
                    if (usr) {
                        $rootScope.me = usr;

                        if (callback) {
                            callback();
                        }
                    }
                    else if (status == 401) {
                        $scope.logoff()
                    }
                })

                $window.setTimeout($rootScope.getMe,60 * 1000 * 5); // check token every 5 mins just in case

            }

            $rootScope.swaptoLoggedIn = function() {

                $rootScope.getMe(function() {
                    $('.loading').hide();
                    $('.loggedout').hide();
                    $('.loggedin').show();

                    $('body').css("background-color","#FFF")
                    $('body').css("padding-top","0px")

                    $('.logoBig').each(function(l) {
                        this.src = "/images/organizations/" + $rootScope.me.org.logoBig
                    })

                    $('.logoSmall').each(function(l) {
                        this.src = "/images/organizations/" + $rootScope.me.org.logoSmall
                    })
                })


            }

            $rootScope.swaptoLoggedOut = function() {
                require([
                    'css!/app/login/loggedout'
                ], function () {
                    $('.loading').hide();
                    $('.loggedout').show();
                    $('.loggedin').hide();
                    $('body').css("background-color","#F2F2F2")
                    $('body').css("padding-top","10px")
                })
            }

            if (!$rootScope.loggedIn) {
                $rootScope.swaptoLoggedOut();
            }
            else {
                $rootScope.swaptoLoggedIn();
            }


            $scope.logoff = function() {
                $rootScope.loggedIn = false;
                $cookies.remove('token');
                $rootScope.swaptoLoggedOut();
                $location.path("/login")
            }

            $scope.updateProfile = function() {
                require([
                    '/app/updateprofile/updateProfileController.js'
                ], function () {
                    var modalInstance = $modal.open({
                        templateUrl: '/app/updateprofile/updateProfile.html',
                        controller: 'updateProfileController',
                        size: "sm",
                        keyboard: false,
                        backdrop: 'static',
                        resolve: {
                            me: function () {
                                return $rootScope.me;
                            }
                        }
                    });

                    modalInstance.result.then(function () {
                        //Save successfully
                    }, function () {
                        //Cancel
                    });
                });
            }

        }]);
});