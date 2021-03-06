// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Directive for the ImageClickInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

oppia.directive('oppiaInteractiveImageClickInput', [
  '$sce', 'HtmlEscaperService', 'ContextService',
  'imageClickInputRulesService', 'UrlInterpolationService',
  'ImagePreloaderService', 'AssetsBackendApiService',
  'EXPLORATION_EDITOR_TAB_CONTEXT', 'EVENT_NEW_CARD_AVAILABLE',
  'LOADING_INDICATOR_URL',
  function(
      $sce, HtmlEscaperService, ContextService,
      imageClickInputRulesService, UrlInterpolationService,
      ImagePreloaderService, AssetsBackendApiService,
      EXPLORATION_EDITOR_TAB_CONTEXT, EVENT_NEW_CARD_AVAILABLE,
      LOADING_INDICATOR_URL) {
    return {
      restrict: 'E',
      scope: {
        getLastAnswer: '&lastAnswer'
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/ImageClickInput/directives/' +
        'image_click_input_interaction_directive.html'),
      controller: [
        '$scope', '$element', '$attrs', 'CurrentInteractionService',
        function($scope, $element, $attrs, CurrentInteractionService) {
          var imageAndRegions = HtmlEscaperService.escapedJsonToObj(
            $attrs.imageAndRegionsWithValue);
          $scope.highlightRegionsOnHover =
            ($attrs.highlightRegionsOnHoverWithValue === 'true');
          $scope.filepath = imageAndRegions.imagePath;
          $scope.imageUrl = '';
          $scope.loadingIndicatorUrl = UrlInterpolationService
            .getStaticImageUrl(LOADING_INDICATOR_URL);
          $scope.isLoadingIndicatorShown = false;
          $scope.isTryAgainShown = false;

          if (ImagePreloaderService.inExplorationPlayer()) {
            $scope.isLoadingIndicatorShown = true;
            $scope.dimensions = (
              ImagePreloaderService.getDimensionsOfImage($scope.filepath));
            // For aligning the gif to the center of it's container
            var loadingIndicatorSize = (
              ($scope.dimensions.height < 124) ? 24 : 120);
            $scope.imageContainerStyle = {
              height: $scope.dimensions.height + 'px'
            };
            $scope.loadingIndicatorStyle = {
              height: loadingIndicatorSize + 'px',
              width: loadingIndicatorSize + 'px'
            };

            $scope.loadImage = function() {
              ImagePreloaderService.getImageUrl($scope.filepath)
                .then(function(objectUrl) {
                  $scope.isTryAgainShown = false;
                  $scope.isLoadingIndicatorShown = false;
                  $scope.imageUrl = objectUrl;
                }, function() {
                  $scope.isTryAgainShown = true;
                  $scope.isLoadingIndicatorShown = false;
                });
            };
            $scope.loadImage();
          } else {
            // This is the case when user is in exploration editor or in
            // preview mode. We don't have loading indicator or try again for
            // showing images in the exploration editor or in preview mode. So
            // we directly assign the url to the imageUrl.
            $scope.imageUrl = AssetsBackendApiService.getImageUrlForPreview(
              ContextService.getExplorationId(), $scope.filepath);
          }

          $scope.mouseX = 0;
          $scope.mouseY = 0;
          $scope.interactionIsActive = ($scope.getLastAnswer() === null);
          if (!$scope.interactionIsActive) {
            $scope.lastAnswer = $scope.getLastAnswer();
          }

          $scope.currentlyHoveredRegions = [];
          $scope.allRegions = imageAndRegions.labeledRegions;
          $scope.updateCurrentlyHoveredRegions = function() {
            for (var i = 0; i < imageAndRegions.labeledRegions.length; i++) {
              var labeledRegion = imageAndRegions.labeledRegions[i];
              var regionArea = labeledRegion.region.area;
              if (regionArea[0][0] <= $scope.mouseX &&
                  $scope.mouseX <= regionArea[1][0] &&
                  regionArea[0][1] <= $scope.mouseY &&
                  $scope.mouseY <= regionArea[1][1]) {
                $scope.currentlyHoveredRegions.push(labeledRegion.label);
              }
            }
          };
          if (!$scope.interactionIsActive) {
            /* The following lines highlight the learner's last answer for this
              card. This need only be done at the beginning as if he submits
              an answer, based on EVENT_NEW_CARD_AVAILABLE, the image is made
              inactive, so his last selection would be higlighted.*/
            $scope.mouseX = $scope.getLastAnswer().clickPosition[0];
            $scope.mouseY = $scope.getLastAnswer().clickPosition[1];
            $scope.updateCurrentlyHoveredRegions();
          }
          $scope.getRegionDimensions = function(index) {
            var image = $($element).find('.oppia-image-click-img');
            var labeledRegion = imageAndRegions.labeledRegions[index];
            var regionArea = labeledRegion.region.area;
            var leftDelta = image.offset().left - image.parent().offset().left;
            var topDelta = image.offset().top - image.parent().offset().top;
            return {
              left: regionArea[0][0] * image.width() + leftDelta,
              top: regionArea[0][1] * image.height() + topDelta,
              width: (regionArea[1][0] - regionArea[0][0]) * image.width(),
              height: (regionArea[1][1] - regionArea[0][1]) * image.height()
            };
          };
          $scope.getRegionDisplay = function(label) {
            if ($scope.currentlyHoveredRegions.indexOf(label) === -1) {
              return 'none';
            } else {
              return 'inline';
            }
          };
          $scope.getDotDisplay = function() {
            if (ContextService.getEditorTabContext() ===
                EXPLORATION_EDITOR_TAB_CONTEXT.EDITOR) {
              return 'none';
            }
            return 'inline';
          };
          $scope.$on(EVENT_NEW_CARD_AVAILABLE, function() {
            $scope.interactionIsActive = false;
            $scope.lastAnswer = {
              clickPosition: [$scope.mouseX, $scope.mouseY]
            };
          });
          $scope.getDotLocation = function() {
            var image = $($element).find('.oppia-image-click-img');
            var dotLocation = {
              left: null,
              top: null
            };
            if ($scope.lastAnswer) {
              dotLocation.left =
                $scope.lastAnswer.clickPosition[0] * image.width() +
                image.offset().left -
                image.parent().offset().left - 5;
              dotLocation.top =
                $scope.lastAnswer.clickPosition[1] * image.height() +
                image.offset().top -
                image.parent().offset().top - 5;
            }
            return dotLocation;
          };
          $scope.onMousemoveImage = function(event) {
            if (!$scope.interactionIsActive) {
              return;
            }
            var image = $($element).find('.oppia-image-click-img');
            $scope.mouseX =
              (event.pageX - image.offset().left) / image.width();
            $scope.mouseY =
              (event.pageY - image.offset().top) / image.height();
            $scope.currentlyHoveredRegions = [];
            $scope.updateCurrentlyHoveredRegions();
          };
          $scope.onClickImage = function() {
            var answer = {
              clickPosition: [$scope.mouseX, $scope.mouseY],
              clickedRegions: $scope.currentlyHoveredRegions
            };
            CurrentInteractionService.onSubmit(
              answer, imageClickInputRulesService);
          };

          CurrentInteractionService.registerCurrentInteraction(null, null);
        }
      ]
    };
  }
]);

oppia.directive('oppiaResponseImageClickInput', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/ImageClickInput/directives/' +
        'image_click_input_response_directive.html'),
      controller: [
        '$scope', '$attrs', 'HtmlEscaperService',
        function($scope, $attrs, HtmlEscaperService) {
          var _answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);

          // Sometimes, it was found that in the time it takes for this
          // interaction to load, it used the learner input for the previous
          // interaction which threw a console error. Though, this doesn't
          // affect user experience as, as soon as the new card was recorded in
          // the transcript, this starts taking the right value. this is a
          // temporary fix until the issue is resolved.
          if (_answer.clickedRegions) {
            $scope.clickRegionLabel = '(Clicks on ' + (
              _answer.clickedRegions.length > 0 ?
                '\'' + _answer.clickedRegions[0] + '\'' : 'image') + ')';
          }
        }
      ]
    };
  }
]);

oppia.directive('oppiaShortResponseImageClickInput', [
  'HtmlEscaperService', 'UrlInterpolationService',
  function(HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/ImageClickInput/directives/' +
        'image_click_input_short_response_directive.html'),
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        var _answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
        $scope.clickRegionLabel = (
          _answer.clickedRegions.length > 0 ? _answer.clickedRegions[0] :
          'Clicked on image');
      }]
    };
  }
]);

oppia.factory('imageClickInputRulesService', [function() {
  return {
    IsInRegion: function(answer, inputs) {
      return answer.clickedRegions.indexOf(inputs.x) !== -1;
    }
  };
}]);
