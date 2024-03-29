angular.module("biradix.global").controller("rootController",
  ["$scope", "$location", "$rootScope", "$cookies", "$authService", "$propertyService", "$window", "$uibModal", "toastr", "ngProgress", "$timeout", "$sce", "$amenityService","$auditService","$organizationsService",
    function($scope, $location, $rootScope, $cookies, $authService, $propertyService, $window, $uibModal, toastr, ngProgress, $timeout, $sce, $amenityService,$auditService,$organizationsService) {
      $rootScope.v2Base = gV2;
      $scope.env = "";
      var loc = gAPI.toLowerCase();

      if (loc.indexOf('//localhost') > -1) {
        $scope.env = "This is API-LOCAL";
      }
      else
      if (loc.indexOf('//api-qa.biradix.com') > -1) {
        $scope.env = "This is API-QA";
      }
      else
      if (loc.indexOf('//biradixapi-qa-pr-') > -1) {
        $scope.env = "This is API-PR-" + loc.match("pr-([0-9]+).")[1];
      }
      else
      if (loc.indexOf('//biradixapi-integration') > -1) {
        $scope.env = "This is API-INT";
      }

      $rootScope.apiVersion = null;
      $rootScope.version = version;

      $scope.loadOrg = function() {
        $scope.apiError = "";
        $organizationsService.public(window.location.hostname.split(".")[0]).then(function (response) {
          $scope.updateLogos(response.data);
          $(".apiError").hide();
          $scope.ready();
        }, function(error) {
          rg4js('send', new Error("User saw API unavailable error alert/message/page"));
          $scope.apiError = "Pretend you didn't see this! Something went wrong and we can only show you this message.<br/> Sorry for the trouble. Please try <a href='javascript:location.reload();'>refreshing</a> the page";
          $(".apiError").show();
        });
      };

      $scope.loadOrg();

      if ($cookies.get('token')) {
        $rootScope.loggedIn = true;
      }
      else {
        $rootScope.loggedIn = false;
      }


      $rootScope.timeout = 0;

      // Global functions
      $rootScope.resetTimeout = function() {
        $rootScope.timeout = 0;
      }

      $scope.updateLogos = function(org) {
        if (org) {
          $rootScope.logoBig = "/images/organizations/" + org.logoBig;
          $rootScope.logoSmall = "/images/organizations/" + org.logoSmall;
          $("#favicon").attr("href", "/images/organizations/" + org.logoSmall);
        }

        window.setTimeout(function() {
          $(".loading").hide();
          if ($rootScope.loggedIn) {
            $(".loggedin").show();
            $(".loggedout").hide();
          }
          else {
            $(".loggedin").hide();
            $(".loggedout").show();
          }
        }, 10);
      };

      $rootScope.incrementTimeout = function() {
        if ($scope.$$childHead == null || !$rootScope.loggedIn) {
          return;
        }
        $rootScope.timeout++;

        // log off after 60 minutes of inactivity
        if ($rootScope.timeout > (60 * 60)) {
          if ($rootScope.loggedIn && gHasSessionStorage) {
            $window.sessionStorage.redirect = $location.path();
          }
          console.log("Log Out Due to timeout");
          return $rootScope.logoff();
        }

        $timeout($rootScope.incrementTimeout, 1000);
      }

      var refreshFactor = 1;
      $rootScope.refreshToken = function(force, callback) {
        if (!$rootScope.loggedIn) {
          return;
        }

        if (!$rootScope.validateTokens()) {
          return;
        }
        var refresh = !!force;

        if (!refresh) {
          var date = $cookies.get('tokenDate');

          if (!date) {
            date = new Date();
          } else {
            date = new Date(date);
          }

          var tokenAgeInMinutes = (new Date().getTime() - date.getTime()) / 1000 / 60 / refreshFactor;

          if (tokenAgeInMinutes > 30) {
            refresh = true;
          }
        }

        if (refresh) {
          $authService.refreshToken($cookies.get('token'), function (usr, status) {
            if (usr) {
              if (usr.maintenance === true) {
                console.log("Log Out Due to maintenance");
                $rootScope.logoff();
                return;
              }

              $rootScope.me = usr;
              $rootScope.reload = false;

              if (!$rootScope.apiVersion) {
                $rootScope.apiVersion = $rootScope.me.version.toString();
              }

              if ($rootScope.me.version.toString() !== $rootScope.apiVersion.toString()) {
                $rootScope.reload = true;
              }

              $rootScope.apiVersion = $rootScope.me.version.toString();

              $window.setTimeout($rootScope.refreshToken, 60/refreshFactor * 1000); // start token refresh in 1 min

              if (callback) {
                callback();
              }
            } else if (status == 401 ) {
              if ($rootScope.loggedIn && gHasSessionStorage) {
                $window.sessionStorage.redirect = $location.path();
              }
              console.log("Log Out Due to refresh token 401");
              $rootScope.logoff();
            }
            else if (status == 0 ) {
              $window.setTimeout($rootScope.refreshToken, 60/refreshFactor * 1000); // start token refresh in 1 min
            }
          });
        } else {
          $rootScope.getMe(function() {
            $rootScope.reload = false;

            if (!$rootScope.apiVersion) {
              $rootScope.apiVersion = $rootScope.me.version.toString();
            }

            if ($rootScope.me.version.toString() !== $rootScope.apiVersion.toString()) {
              $rootScope.reload = true;
            }

            $rootScope.apiVersion = $rootScope.me.version.toString();

            $window.setTimeout($rootScope.refreshToken, 60/refreshFactor * 1000); // start token refresh in 1 min
            if (callback) {
              callback();
            }
          });
        }
      }

      $scope.searches = {
        search1: "",
        search2: "",
      }

      $rootScope.notifications = [];

      $rootScope.validateTokens = function() {
        if (!$cookies.get("token")) {
          if (gHasSessionStorage) {
            $window.sessionStorage.redirect = $location.path();
          }
          console.log("Log Out Due to invalid token");
          $rootScope.logoff();
          return false;
        }

        var date = $cookies.get('tokenDate');

        if (!date) {
          date = new Date();
        } else {
          date = new Date(date);
        }

        var tokenAgeInMinutes = (new Date().getTime() - date.getTime()) / 1000 / 60;

        if (tokenAgeInMinutes > 65) {
          if (gHasSessionStorage) {
            $window.sessionStorage.redirect = $location.path();
          }
          console.log("Log Out Due to token date > 65 minutes");
          $rootScope.logoff();
          return false;
        }

        return true;
      }
      $rootScope.getMe = function(callback) {
        if (!$scope.first && !$rootScope.loggedIn) {
          return;
        }

        if (!$rootScope.validateTokens()) {
          return;
        }

        $authService.me($cookies.get('token'), function (usr, status) {
          if (usr) {

            if (usr.maintenance === true) {
              console.log("Log Out Due to maintenance");
              $rootScope.logoff();
              return;
            }

            $rootScope.me = usr;
            if ($scope.first) {
              window.setTimeout($scope.alerts, 200);
            }

            if ($scope.first && !$rootScope.me.passwordUpdated && !$rootScope.me.allowSSO) {

              if (!phantom) {
                $timeout(function () {
                  $location.path("/updateProfile").search('password', '1');
                }, 2000)

              }
            }
            else if ($scope.first && $rootScope.me.bounceReason) {

              if (!phantom) {
                $timeout(function () {
                  $location.path("/updateProfile");
                }, 2000)
              }
            }

            $scope.first = false;

            if (callback) {
              callback();
            }
          }
          else if (status == 401) {
            if ($rootScope.loggedIn && gHasSessionStorage) {
              $window.sessionStorage.redirect = $location.path();
            }
            console.log("Log Out Due to me 401");
            $rootScope.logoff()
          }
          else if (status == 0) {
            if (callback) {
              callback();
            }
          }
        })
      }

      $rootScope.updateLogos = function() {
        var org;

        if ($rootScope.me) {
          if ($rootScope.me.orgs.length == 1) {
            org = $rootScope.me.orgs[0];
          } else {
            $rootScope.me.orgs.forEach(function (x) {
              if (x.subdomain.toLowerCase() == window.location.hostname.toLowerCase()) {
                org = x;
              }
            })

            if (!org) {
              org = $rootScope.me.orgs[0];
            }
          }
        }

        $scope.updateLogos(org);
      }

      $rootScope.swaptoLoggedIn = function(redirect) {
        $scope.first = true;
        $rootScope.getMe(function() {
          var expireDate = new Date();
          expireDate.setDate(expireDate.getDate() + 365);
          $cookies.put('email', $rootScope.me.email, {expires : expireDate});

          if ($rootScope.me.allowSSO) {
            $cookies.remove("host");
          } else {
            $cookies.put('host', location.hostname, {expires : expireDate});
          }

          if ($rootScope.me.roles[0] === 'Guest') {
            $cookies.remove("host");
            $cookies.remove("email");
          }

          rg4js('setUser', {
            identifier: $rootScope.me.email,
            isAnonymous: false,
            email: $rootScope.me.email,
            firstName: $rootScope.me.first + " - org: " + $rootScope.me.orgs[0].name,
            fullName: $rootScope.me.first + " " + $rootScope.me.last
          });

          FS.identify($rootScope.me._id, {
            displayName: $rootScope.me.first + " " + $rootScope.me.last,
            email: $rootScope.me.email,
            org_str: $rootScope.me.orgs[0].name
          });

          // Pass custom dimension data to GA
          var organization = $rootScope.me.orgs[0] && $rootScope.me.orgs[0].name || '';
          var role = $rootScope.me.roles && $rootScope.me.roles[0] || '';
          var userId = $rootScope.me._id || '';
          var userName = ($rootScope.me.first || '') + ' ' + ($rootScope.me.last || '');

          ga('set', {
            'dimension1': organization,
            'dimension2': role,
            'dimension3': userId,
            'dimension4': userName,
          });

          $rootScope.loggedIn = true;

          $('body').css("padding-top","0px")

          $rootScope.updateLogos();

          $window.setTimeout($rootScope.refreshToken,60/refreshFactor * 1000); // start token refresh in 1 min
          $timeout($rootScope.incrementTimeout, 1000);

          var ar = location.hash.split("login?r=");
          if (ar.length === 2 && gHasSessionStorage) {
            $window.sessionStorage.redirect = decodeURIComponent(ar[1]);
          }

          if (gHasSessionStorage && $window.sessionStorage.redirect) {
            var x = $window.sessionStorage.redirect;
            $window.sessionStorage.removeItem('redirect');

            if (x.indexOf('http') === 0) {
              x = x.replace("%d%", location.hostname);
              return location.href = x;
            }

            //Make sure we dont redirect to /login
            if (x.indexOf('/login') === -1) {
              if (x.indexOf("?") === -1) {
                $location.path(x).search("r", null);
              } else {
                var a = x.split('?');
                $location.path(a[0]).search(a[1]);
                $location.search("e", null);
              }
            } else {
              $location.search("e", null);
              $location.path("/dashboard");
            }

          } else {
            if (redirect !== false) {
              $location.search("e", null);
              $location.path("/dashboard");
            }
          }
        });

      }

      $rootScope.swaptoLoggedOut = function() {
        $('body').css("padding-top","10px")
        $rootScope.loggedIn = false;
        $scope.first = false;
      }

      //Local functions
      $rootScope.logoff = function() {
        $rootScope.loggedIn = false;
        $cookies.remove('token');
        $location.path("/sso");
        $rootScope.updateLogos();
      }

      $rootScope.toggleUnlniked = function() {
        //$rootScope.me.settings.hideUnlinked = !$rootScope.me.settings.hideUnlinked;
        ngProgress.start();
        $authService.updateSettings($rootScope.me.settings).then(function (resp) {
          ngProgress.complete();
          if (resp.data.errors && resp.data.errors.length > 0) {
            var errors = _.pluck(resp.data.errors,"msg").join("<br>")
            toastr.error(errors);
            $rootScope.me.settings.hideUnlinked = !$rootScope.me.settings.hideUnlinked;
          }
          else {
            if ($rootScope.me.settings.hideUnlinked) {
              toastr.warning('Excluded comped floor plans will now be hidden in all your data results.')
            } else {
              toastr.success('Excluded comped floor plans will now be shown in all your data results.')
            }


            $rootScope.refreshToken(true, function() {
              $rootScope.$broadcast('data.reload');
            });
          }


        }, function (err) {
          $rootScope.me.settings.hideUnlinked = !$rootScope.me.settings.hideUnlinked;
          rg4js('send', new Error("User saw API unavailable error alert/message/page"));
          toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
          ngProgress.complete();
        });




      }

      $scope.sanitize = function(s) {
        return $sce.trustAsHtml(s);
      }
      $scope.getLocation = function (val,hideCustomComps,hideCustom) {
        return $propertyService.search({search: val, active: true, skipAmenities: true, limit: 10, hideCustomComps: hideCustomComps, hideCustom: hideCustom }).then(function (response) {
          return response.data.properties
        });
      };

      $scope.disableSearchKeys = function(event) {
        switch(event.keyCode) {
          case 191: // "/"
          case 220: // "\"
            event.preventDefault();
        }
      }

      $rootScope.shouldSelect = function($event) {
        if ($event.keyCode === 13) {
          return true;
        }
      }

      $scope.searchSelected = function (item, model, label) {
        $scope.searches.search1 = "";
        $scope.searches.search2 = "";
        $rootScope.turnOffSearch();
        $location.path("/profile/" + item._id);
      }

      $scope.ready = function() {
        // Decide if logged in or not.
        if (!$rootScope.loggedIn) {
          $rootScope.swaptoLoggedOut();
        } else {
          $rootScope.swaptoLoggedIn(false);
        }

        // make sure in full screen right nav is always shown
        var w = angular.element($window);
        $('#mobile-nav').css("width", w.width() + "px")

        w.bind('resize', function () {
          if (w.width() > 767) {
            $('#wrapper').removeClass('toggled');
            $('#searchBar').hide();
            $rootScope.$broadcast('size', w.width());
          } else {
            $rootScope.$broadcast('size', w.width());
          }

          $('#mobile-nav').css("width",w.width() + "px")
        });
      }

      $rootScope.toggle = function() {
        $('#wrapper').toggleClass('toggled');
        $rootScope.turnOffSearch();
      }

      $rootScope.toggleSearch = function() {
        $('#searchBar').slideToggle( "slow");
        $('#wrapper').removeClass('toggled');
      }

      $rootScope.toggleAlerts = function() {
        $('#alertsBar').slideToggle( "slow");
        $('#wrapper').removeClass('toggled');
      }

      $rootScope.turnOffSearch = function() {
        $('#searchBar').hide();
      }

      $rootScope.turnOffIfMobile = function() {
        if ($( window ).width() <= 767)
        {
          $('#wrapper').removeClass('toggled');
          $rootScope.turnOffSearch();
        }
      }

      $rootScope.test_error = function() {
        a = b;
      }

      $rootScope.csv_report = function(org, isGrouped, showDateRange, timezone) {
        var url = gAPI + '/api/1.0/properties/csvreport/'+org+'?'
        url += "token=" + $cookies.get('token');
        url += "&group=" + (!!isGrouped);
        url += "&showDateRange=" + (!!showDateRange);
        url += "&timezone=" + timezone;
        location.href = url;
      }

      $rootScope.marketSurvey = function (id, surveyid,options) {
        require([
          '/app/marketSurvey/marketSurveyController.js'
        ], function () {
          var modalInstance = $uibModal.open({
            templateUrl: '/app/marketSurvey/marketSurvey.html?bust='+version,
            controller: 'marketSurveyController',
            size: "md",
            keyboard: false,
            backdrop: 'static',
            resolve: {
              id: function () {
                return id;
              },
              surveyid: function () {
                return surveyid;
              },
              options: function () {
                return options;
              },
            }
          });

          modalInstance.result.then(function () {
            //Send successfully
          }, function () {
            //Cancel
          });
        });
      }

      $scope.alerts = function() {
        if ($rootScope.me.permissions.indexOf("Admin") > -1) {
          $scope.alertsAmenities();
          $scope.alertsAudits();
          $scope.alertsApprovedLists("OWNER", "owner", "Property:Owners");
          $scope.alertsApprovedLists("MANAGER", "management", "Property:Management");
          $scope.alertsApprovedLists("FEES", "fees", "Custom Fees & Deposits");
        }
      };

      $scope.alertsApprovedLists = function(type, key, label) {
        if (!$rootScope.loggedIn) {
          return
        }
        $propertyService.getUnapproved(type, "frequency {value}").then(function (response) {
            var a = _.find($rootScope.notifications, function(x) {return x.key === key});
            var total = response.data.data.UnapprovedList.frequency.length;
            if (a) {
              a.count = total;

              if (a.count === 0) {
                _.remove($rootScope.notifications, function(x) {return x.key === key});
              }
            } else {
              if (total) {
                $rootScope.notifications.push({
                  key: key,
                  count: total,
                  label: label + ": ",
                  url: $scope.v2Base + "secure/unapproved-lists?type=" + type,
                });
              }
            }
          },
          function (error) {
            toastr.error(error.data.errors[0].message);
          });
      };

      $scope.alertsAmenities = function() {
        if (!$rootScope.loggedIn) {
          return
        }
        $amenityService.search({active: true, unapproved: true}).then(function (response) {
            var a = _.find($rootScope.notifications, function(x) {return x.key == "amenities"});

            if (a) {
              a.count = response.data.amenities.length;

              if (a.count == 0) {
                _.remove($rootScope.notifications, function(x) {return x.key == "amenities"});
              }
            } else {
              if (response.data.amenities.length) {
                $rootScope.notifications.push({
                  key: "amenities",
                  count: response.data.amenities.length,
                  label: "Amenities: ",
                  url: "#/amenities",
                });
              }
            }
          },
          function(error) {
            if (error.status == 401) {
              console.log("Log Out Due to Amenities 401");
              $rootScope.logoff();
              return;
            }
          });

        window.setTimeout(function() {
          $scope.alertsAmenities();
        }, 120000);
      };

      $scope.alertsAudits = function() {
        if (!$rootScope.loggedIn) {
          return
        }
        $auditService.search({
          limit: 1,
          approved: false,
          daterange: {
            daterange: "Last 30 Days",
          },
          offset: moment().utcOffset(),
        }).then(function(response) {
            var a = _.find($rootScope.notifications, function(x) {
              return x.key == "audits";
            });

            if (a) {
              a.count = response.data.pager.count;

              if (a.count == 0) {
                _.remove($rootScope.notifications, function(x) {
                  return x.key == "audits";
                });
              }
            } else {
              if (response.data.pager.count) {
                $rootScope.notifications.push({
                  key: "audits",
                  count: response.data.pager.count,
                  label: "Data Integrity: ",
                  url: "#/history?active=1",
                });
              }
            }

          },
          function(error) {
            if (error.status == 401) {
              console.log("Log Out Due to data integrity 401");
              $rootScope.logoff();
              return;
            }
          });

        window.setTimeout(function() {
          $scope.alertsAudits();
        }, 120000);
      };

      $rootScope.isModalOpen = function(el) {
        return($(el).hasClass("open"));
      };

      $rootScope.bouncePopup = function(user) {
        var str  = '<b>Status:</b> Undeliverable<br>';

        str += '<B>Email:</B> ' + user.email + '<br>'

        str += '<B>Error:</B> ' + user.bounceReason + '<br>'

        if (user.bounceDate) {
          str += '<B>Last Attempt:</B> ' + moment(new Date(user.bounceDate)).format("MM/DD/YYYY HH:MM") + '<br>'
        }

        return str;
      };

      $rootScope.tooltips = {
        "address": "<b>Address</b> - <i>Property address</i>",
        "walkscore": "<b>Walk Score® - Walk Score</b> - <i>Walk Score measures the walk-ability of any address</i>",
        "transitscore": "<b>Walk Score® - Transit Score</b> - <i>Transit Score measures access to public transit</i>",
        "bikescore": "<b>Walk Score® - Bike Score</b> - <i>Bike Score measures whether a location is good for biking</i>",
        "phone": "<b>Phone</b> - <i>Property phone</i>",
        "constructionType": "<b>Construction</b> - <i>Type of construction</i>",
        "owner": "<b>Owner</b> - <i>Ownership group</i>",
        "management": "<b>Management</b> - <i>Management company</i>",
        "yearBuilt": "<b>Year Built</b> - <i>Year property was constructed (YOC)</i>",
        "weeklytraffic": "<b>Traffic Week</b> - <i>Number of tours/shows given to prospective tenants in last 7 days (week)",
        "weeklyleases": "<b>Leases / Week</b> - <i>Number of approved leases in the last 7 days (week), after cancellations and denials</i>",
        "units": "<b>Units</b> - <i>Total units</i>",
        "unitPercent": "<b>Units %</b> - <i>Number of Units / Total units * 100</i>",
        "sqft": "<b>Square Feet</b> - <i>The weighted average square footage. Example - if there were 25 units with 500 square feet, and 75 units with 1000, the weighted average sq ft value would be (25 x 500 + 75 x 1000) / 100 units = 875 sq ft</i>",
        "occupancy": "<b>Occupancy %</b> - <i>Percentage of property which is occupied</i>",
        "leased": "<b>Leased %</b> - <i>Percentage of property which is leased</i>",
        "atr": "<b>Apartments To Rent %</b> - <i>Apartments To Rent (Exposure) is calculated by adding vacant available units (units not leased) plus units on notice and dividing by total units of the property</i>",
        "renewal": "<b>Renewal %</b> - <i>Percentage of leases that have renewed (typically used by student housing)</i>",
        "rent": "<b>Rent</b> - <i>The weighted average monthly market rent. This is made up of base (minimum) floor plan market rents for a 12 month lease, before any concessions or discounts</i>",
        "rentsqft": "<b>Rent/Sqft</b> - <i>This is Rent divided by Sqft</i>",
        "rent0": "<b>Rent by # Bedrooms</b> - <i>This is Rent grouped by number of bedrooms</i>",
        "concessionsOneTime": "<b>One-Time Concessions</b> - <i>The one-time (upfront) concessions. Example - if there is a $500 look-and-lease discount for signing a 12 month lease</i>",
        "concessionsMonthly": "<b>Recurring Concessions</b> - <i>The recurring (monthly) concessions. Example - if concession is $100 off per month</i>",
        "runrate": "<b>Recurring Rent</b> - <i>This is Rent minus Recurring Concessions. Excludes One-Time Concessions.</i>",
        "runratesqft": "<b>Recurring Rent / Sqft</b> - <i>This is Recurring Rent divided by Sqft </i>",
        "concessions": "<b>Total Concessions</b> - <i>This is the sum of One Time Concessions and 12 months of Recurring Concessions</i>",
        "ner": "<b>Net Effective Rent</b> - <i>Net Effective Rent (NER) is Rent less Recurring Concession and (One-Time Concessions / 12)</i>",
        "ner0": "<b>Net Effective Rent by # Bedrooms</b> - <i>Net Effective Rent grouped by number of bedrooms</i>",
        "nersqft0": "<b>Net Effective Rent / Sqft by # Bedrooms</b> - <i>Net Effective Rent per Square Foot grouped by number of bedrooms</i>",
        "nervscompavg": "<b>Net Effective Rent vs Comp Avg</b> - <i>Net Effective Rent divided by Comp average Net Effective Rent</i>",
        "nerweek": "<b>Net Effective Rent vs Last Week</b> - <i>Net Effective Rent divided by Last Week's Net Effective Rent</i>",
        "nermonth": "<b>Net Effective Rent vs Last Month</b> - <i>Net Effective Rent divided by Last Month's Net Effective Rent</i>",
        "neryear": "<b>Net Effective Rent vs Last Year</b> - <i>Net Effective Rent divided by Last Year's Net Effective Rent</i>",
        "nersqft": "<b>Net Effective Rent / Sqft</b> - <i>Net Effective Rent per Square Foot (NER divided by Sqft)</i>",
        "nersqftweek": "<b>Net Effective Rent / Sqft vs Last Week</b> - <i>Net Effective Rent / Sqft divided by Last Week's Net Effective Rent / Sqft</i>",
        "nersqftmonth": "<b>Net Effective Rent / Sqft vs Last Month</b> - <i>Net Effective Rent / Sqft divided by Last Month's Net Effective Rent / Sqft</i>",
        "nersqftyear": "<b>Net Effective Rent / Sqft vs Last Year</b> - <i>Net Effective Rent / Sqft divided by Last Year's Net Effective Rent / Sqft</i>",
        "nersqftvscompavg": "<b>Net Effective Rent/Sqft vs Comp Avg</b> - <i>Net Effective Rent / Sqft divided by Comp average Net Effective Rent / Sqft</i>",
        "last_updated": "<b>Last Updated</b> - <i>The date of the last survey completed for that property</i>",
      };

      $rootScope.$watch("globalConfirm", function (newValue) {
        if (typeof newValue === "undefined") {
          return;
        }

        if (newValue.toString() === "") {
          $window.onbeforeunload = function() {}
        } else {
          $window.onbeforeunload = function(event) {
            return newValue
          };
        }
      }, true);

      $rootScope.$on('$locationChangeStart', function( event ) {
        $rootScope.nav = "";
        if (!$rootScope.globalConfirm) return;
        var answer = confirm($rootScope.globalConfirm);
        if (!answer) {
          event.preventDefault();
        }
      });

    }]);
