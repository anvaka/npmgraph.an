/**
 * This controller is responsible for building graph from current route
 */

require('./graphViewer');
var getLocation = require('../getLocation.js');
var createGraphBuilder = require('../graphBuilder');

module.exports = function($scope, $routeParams, $http, $location) {
  var applyToScope = require('../applyToScope')($scope);

  // TODO: Remove root, it's no longer valid
  $scope.root = $routeParams.pkgId;
  $scope.showProgress = true;
  $scope.switchMode = switchMode;

  var graphBuilder = createGraphBuilder($routeParams.pkgId, $routeParams.version, $http, applyToScope(progressChanged));
  $scope.graph = graphBuilder.graph;

  graphBuilder.start
    .then(applyToScope(graphLoaded))
    .catch(applyToScope(errorOccured));

  function progressChanged(queueLength) {
    $scope.progress = queueLength;
  }

  function errorOccured(err) {
    $scope.showError = true;
    $scope.showProgress = false;

    if (err.status) {
      $scope.error = "error: " + err.status;
      $scope.errorData = {
        url: err.config.url,
        params: err.config.params,
        method: err.config.method
      };
    } else {
      $scope.error = "Error";
      $scope.errorData = {
        message: err.message
      };
    }
  }

  function graphLoaded() {
    $scope.showSwitchMode = true; // todo: check if it supports webgl
    $scope.showProgress = false;
    $scope.$root.$broadcast('graph-loaded', $scope.graph);
  }

  function switchMode() {
    var path = getLocation($routeParams, /* is2d = */ false);
    $location.path(path);
  }
};
