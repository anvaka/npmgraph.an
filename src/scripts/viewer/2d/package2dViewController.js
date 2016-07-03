/**
 * This controller is responsible for building graph from current route
 */

require('./graphViewer');
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
    $scope.error = "error: " + err.status;
    $scope.errorData = {
      url: err.config.url,
      params: err.config.params,
      method: err.config.method
    };
  }

  function graphLoaded() {
    $scope.showSwitchMode = true; // todo: check if it supports webgl
    $scope.showProgress = false;
    $scope.$root.$broadcast('graph-loaded', $scope.graph);
  }

  function switchMode() {
    var path = 'view/3d/' + $routeParams.pkgId;
    if ($routeParams.version) {
      path += '/' + $routeParams.version;
    }
    $location.path(path);
  }
};
