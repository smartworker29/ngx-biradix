"use strict";
define([
  "app",
  "../../services/authService"
], function (app) {

  app.controller("ssoController", ["$scope","$rootScope", "$location","toastr", "$authService","$window","$stateParams", "$cookies",
    function ($scope,$rootScope,$location,toastr, $authService,$window,$stateParams, $cookies) {

      if (maintenance === true && $location.path().indexOf("maintenance") === -1) {
        return $location.path("/maintenance");
      }

      if (gHasSessionStorage && $stateParams.r) {
        $window.sessionStorage.redirect = $stateParams.r;
      }

      if ($rootScope.loggedIn) {
        $rootScope.swaptoLoggedIn();
        return;
      }

      window.setTimeout(function() {
        window.document.title = "Log In | Radix";
      }, 1500);

      $scope.email = $cookies.get("email");
      $scope.o = $stateParams.o;

      if($stateParams.err) {
        toastr.error($stateParams.err);
        $location.search("err", null);
      }

      $scope.noSubDomains = function() {
        return location.hostname.toLowerCase().indexOf("localhost") > -1
          || location.hostname.toLowerCase().indexOf("qa.biradix") > -1
          || location.hostname.toLowerCase().indexOf("testingthis.biradix") > -1
          || location.hostname.toLowerCase().indexOf("demo.biradix") > -1
          || location.hostname.toLowerCase().indexOf(".herokuapp") > -1;
      };

      $scope.redirect = function(host) {
        var domain = "https://" + host;

        if (host === location.hostname || $scope.noSubDomains()) {
          $location.path("/login")
            .search("e", $scope.email || "")
            .search("r", $stateParams.r)
            .search("o", $stateParams.o);
        } else {
          location.href = domain + "/#login?e="
            + encodeURIComponent($scope.email || "")
            + "&r=" + encodeURIComponent($stateParams.r)
            + "&o=" + encodeURIComponent($stateParams.o)
          ;
        }
      };

      if ($stateParams.n && $stateParams.n === "1") {
        $cookies.remove("host");
      }

      if ($cookies.get("email") && $cookies.get("host")) {
        return $scope.redirect($cookies.get("host"));
      }

      if ($rootScope.loggedIn) {
        $rootScope.$watch("me", function(x) {
          if ($rootScope.me) {
            $scope.redirect($rootScope.me.orgs[0].subdomain + ".biradix.com");
          }
        }, true);
      }

      $scope.submit = function() {
        $scope.localLoading = true;

        $authService.getDomain($scope.email).then(function (domainInfo) {
            if (domainInfo && domainInfo.data && domainInfo.data.domain) {
              var expireDate = new Date();
              expireDate.setDate(expireDate.getDate() + 365);
              $cookies.put('email', $scope.email, {expires : expireDate});
              if (domainInfo.data.allowSSO) {
                var ui_domain = "https://" + domainInfo.data.domain;

                if ($scope.noSubDomains()) {
                  ui_domain = location.origin;
                }

                switch (domainInfo.data.provider) {
                  case 'Azure':
                    var redirect_uri = gAPI + '/api/1.0/users/sso/azure';

                    var url = 'https://login.microsoftonline.com/common/oauth2/authorize?' +
                      'client_id=' +  domainInfo.data.clientId +
                      '&response_type=code' +
                      '&redirect_uri=' + encodeURIComponent(redirect_uri) +
                      '&response_mode=form_post' +
                      '&state=' + JSON.stringify(
                        {
                          email: $scope.email,
                          redirect_uri: redirect_uri,
                          ui_domain: ui_domain,
                          r: $stateParams.r,
                          o: $stateParams.o,
                        }
                      ) +
                      '&login_hint=' + $scope.email;

                    location.href = url;
                  break;
                  case 'Okta':
                    var redirect_uri = gAPI + '/api/1.0/users/sso/okta';

                    var url = domainInfo.data.clientUrl + '/oauth2/default/v1/authorize' +
                    '?client_id=' +  domainInfo.data.clientId +
                    '&login_hint=' + encodeURIComponent($scope.email) +
                    '&redirect_uri=' + encodeURIComponent(redirect_uri) +
                    '&response_mode=form_post' +
                    '&response_type=code' +
                    '&scope=openid' +
                    '&state=' + encodeURIComponent($scope.email + '|' + redirect_uri + '|' + ui_domain + '|' + $stateParams.r + '|' + $stateParams.o);

                    location.href = url;
                  break;
                }
              } else {
                  $cookies.put('host', domainInfo.data.domain, {expires : expireDate});
                  $scope.redirect(domainInfo.data.domain);
              }
            } else {
              toastr.error("Unable to locate your email address.");
              $scope.localLoading = false;
            }
          },
          function(errors) {
            toastr.error('Unable to access the system as this time. Please contact an administrator.');
            $scope.localLoading = false;
          });
      }
    }]);
});
