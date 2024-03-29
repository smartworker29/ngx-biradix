angular.module('biradix.global').directive('gallery', function () {
    return {
        restrict: 'E',
        scope: {
            options: '=',
            images: '=',
            orderchanged: '='
        },
        link: function($scope) {
            $scope.attachment = false;
            $scope.canClick = true;
            $scope.options = $scope.options || {};
            $scope.options.gallery = false;

            $.fn.attachDragger = function(){
                var lastPosition, position, difference;
                $( $(this).selector ).on("mousedown mouseup mousemove",function(e){
                    if( e.type == "mousedown" ) {
                        $scope.attachment = true;
                        lastPosition = [e.clientX, e.clientY];
                    }
                    if( e.type == "mouseup" ) {
                        $scope.attachment = false;
                        window.setTimeout(function() {
                            $scope.canClick = true;
                        }, 50)

                    }
                    if( e.type == "mousemove" && $scope.attachment == true ){
                        $scope.canClick = false;
                        position = [e.clientX, e.clientY];
                        difference = [ (position[0]-lastPosition[0]), (position[1]-lastPosition[1]) ];
                        $(this).scrollLeft( $(this).scrollLeft() - difference[0] );
                        $(this).scrollTop( $(this).scrollTop() - difference[1] );
                        lastPosition = [e.clientX, e.clientY];
                    }
                });
                $(window).on("mouseup", function(){
                    $scope.attachment = false;
                    window.setTimeout(function() {
                        $scope.canClick = true;
                    }, 50)
                });
            }

            $(document.body).append($('.gallery-overlay').detach());

            window.setTimeout(function() {
                $(".gallery-overlay .thumbcontainer .thumbs").attachDragger();
            },100);
        },
        controller: function ($scope, $element,toastr,$dialog) {


            $scope.sortableOptions = {
                items: "li:not(.not-sortable)",
                tolerance: "pointer",
                // sort: function( event, ui ) {
                //     console.log(ui);
                // }
                update: function (e, ui) {
                    // var logEntry = $scope.images.map(function (i) {
                    //     return i.value;
                    // }).join(', ');
                    // $scope.sortingLog.push('Update: ' + logEntry);
                    $scope.orderchanged = true;
                },
                // stop: function (e, ui) {
                //     // this callback has the changed model
                //     var logEntry = $scope.images.map(function (i) {
                //         return i.value;
                //     }).join(', ');
                //     $scope.sortingLog.push('Stop: ' + logEntry);
                // }
            };

            $scope.$watch("options.show", function() {
                if ($scope.options.admin) {
                    $scope.options.gallery = true;
                    $scope.copy = _.cloneDeep($scope.images);
                    $scope.copyIndex = $scope.index;
                } else {
                    $scope.options.gallery = false;
                }

                $scope.select(0);
            }, true)

            $scope.$watch("options.gallery", function(newvalue, oldvalue) {

                if (oldvalue === true && newvalue == false) {
                    $scope.select($scope.index);
                }
            }, true)

            // $scope.$watch("options.admin", function(newvalue, oldvalue) {
            //
            //     if (oldvalue === false && newvalue == true) {
            //         $scope.copy = _.cloneDeep($scope.images);
            //         $scope.copyIndex = $scope.index;
            //     }
            // }, true)

            $scope.closeView = function() {
                $scope.options.show = false;
            }

            $scope.next = function() {
                if ($scope.index >= $scope.images.length - 1) {
                    $scope.select(0);
                } else {
                    $scope.select($scope.index + 1);
                }
            }

            $scope.previous = function() {
                if ($scope.index == 0) {
                    $scope.select($scope.images.length - 1);
                } else {
                    $scope.select($scope.index - 1);
                }
            }

            $scope.select = function(i) {
                if ($scope.canClick == false) {
                    return;
                }
                $scope.index = i;

                var scroll = 155 * (i - 1.5);

                if (scroll <= 0) {
                    scroll = 40;
                }

                $scope.options = $scope.options || {};

                if (!$scope.options.admin) {
                    $scope.options.gallery = false;
                }
                else {
                    $scope.options.gallery = true;
                }

                $scope.scroll = scroll;

                if ($scope.scrolling) {
                    $scope.scrollmore = true;
                }

                $scope.animate();
            }


            $scope.animate = function() {

                if (!$scope.scrolling) {
                    $scope.scrolling = true;
                    $(".gallery-overlay .thumbs").animate({scrollLeft: $scope.scroll}, 800, function() {
                        $scope.scrolling = false;

                        if ($scope.scrollmore) {
                            $scope.scrollmore = false;
                            $scope.animate();
                        }
                    });
                }

            }

            $scope.imageClick = function ($event) {

                var clickX = $event.clientX;
                var centerX = parseInt($event.target.offsetLeft + $event.target.offsetWidth / 2);

                var dir = 'Next'
                if (clickX < centerX) {
                    $scope.previous();
                } else {
                    $scope.next();
                }

            }

            $scope.remove = function(i) {
                $scope.copy.splice(i,1);

                if ($scope.copyIndex > $scope.copy.length - 1 ) {
                    $scope.copyIndex = $scope.copy.length - 1;
                }

                // $scope.select($scope.copyIndex);
            }

            $scope.save = function() {
                var changed = JSON.stringify(_.pluck($scope.copy || [],'url')) != JSON.stringify(_.pluck($scope.images|| [],'url'));
                if (!changed) {
                    $scope.options.gallery = false;
                    $scope.options.admin = false
                    $scope.closeView();
                }
                else {
                    $dialog.confirm('You have made changes to your pictures. Are you sure you want to apply them?<Br><Br>Note: Your changes will not be saved until you save your property.', function () {
                        $scope.images = _.cloneDeep($scope.copy);
                        $scope.index = $scope.copyIndex;
                        $scope.select($scope.index);
                        $scope.options.gallery = false;
                        $scope.options.admin = false;
                        $scope.closeView();
                    }, function () {
                    });
                }
            }

            $scope.cancel = function() {

                var changed = JSON.stringify(_.pluck($scope.copy,"url")) != JSON.stringify(_.pluck($scope.images,"url"));

                if (!changed) {
                    $scope.options.gallery = false;
                    $scope.options.admin = false
                    $scope.closeView();
                }
                else {
                    $dialog.confirm('You have made changes that have not been saved. Are you sure you want to close without saving?', function () {
                        $scope.options.gallery = false;
                        $scope.options.admin = false
                        $scope.closeView();
                    }, function () {
                    });
                }
            }

            $scope.fakeThumbs = function() {
                if ($scope.copy.length < 12) {
                    return new Array(12-$scope.copy.length);
                }
                return [];
            }
        },
        templateUrl: '/components/gallery/template.html?bust=' + version
    }
})