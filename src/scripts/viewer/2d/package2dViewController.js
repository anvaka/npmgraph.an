/**
 * This controller is responsible for building graph from current route
 */
require('./graphViewer');

var toGravatar = require('./graphInfo/toGravatar');

module.exports = function($scope, $routeParams, $http, $location) {
  $scope.name = ' ' + $routeParams.pkgId;
  $scope.root = $routeParams.pkgId;
  $scope.onNodeSelected = applyToScope(selectPackage);
  $scope.packageInfoVisible = true;
  $scope.graphLoaded = false;

  $scope.switchInfoMode = function(mode, e) {
    e.preventDefault();
    $scope.packageInfoVisible = mode === 'package';
    $scope.graphInfoVisible = mode === 'graph';
  };
  $scope.switchMode = function() {
    $location.path('view/3d/' + $routeParams.pkgId);
  };

  var graphBuilder = require('../graphBuilder')($routeParams.pkgId, $http, applyToScope(progressChanged));
  $scope.graph = graphBuilder.graph;
  graphBuilder.start
      .then(showGraphInfo)
      .catch(showError);

  function progressChanged(queueLength) {
    $scope.progress = queueLength;
  }

  function showGraphInfo() {
    applyToScope(graphLoaded)();

    var root = graphBuilder.graph.getNode($scope.root);
    if (root) {
      selectPackage(root);
    }
  }

  function showError(err) {
    applyToScope(errorOccured)(err);
  }

  function errorOccured(err) {
    $scope.isError = true;
    $scope.error = "error: " + err.status;
    $scope.errorData = {
      url: err.config.url,
      params: err.config.params,
      method: err.config.method
    };
  }

  function graphLoaded() {
    // todo: check if it supports webgl
    $scope.canSwitchMode = true;
    $scope.linksCount = $scope.graph.getLinksCount();
    $scope.nodesCount = $scope.graph.getNodesCount();

    $scope.graphLoaded = true;
    $scope.allMaintainers = require('./graphInfo/maintainers')($scope.graph);
    $scope.allLicenses = require('./graphInfo/licenses')($scope.graph);
  }

  function applyToScope(cb) {
    return function() {
      var args = arguments;
      if (!$scope.$$phase) {
        $scope.$apply(function() {
          cb.apply(this, args);
        });
      } else {
        cb.apply(this, args);
      }
    };
  }

  function selectPackage(node) {
    var data = $scope.selectedPackage = node.data;
    if (data.maintainers && data.maintainers.length) {
      $scope.maintainers = data.maintainers.map(toGravatar);
    }
  }
};
