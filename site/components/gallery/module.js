angular.module('biradix.global').directive('gallery', function () {
    return {
        restrict: 'E',
        scope: {
            options: '=',
            images: '=',
        },
        link: function($scope) {
            $scope.attachment = false;
            $scope.canClick = true;
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

            $(".gallery-overlay .thumbs").attachDragger();
        },
        controller: function ($scope, $element,toastr) {


            $scope.$watch("options.show", function() {
                $scope.select(0);
            }, true)

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

                if (scroll < 0) {
                    scroll = 0;
                }

                $scope.options = $scope.options || {};

                $scope.options.gallery = false;

                $(".gallery-overlay .thumbs").animate({scrollLeft: scroll}, 800);
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
        },
        templateUrl: '/components/gallery/template.html?bust=' + version
    }
})