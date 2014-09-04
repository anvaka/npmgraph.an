/**
 * This controller is responsible for building graph from current route
 */
require('./graphViewer');

module.exports = function($scope, $routeParams, $http, $location) {
  $scope.name = ' ' + $routeParams.pkgId;
  $scope.root = $routeParams.pkgId;
  $scope.onNodeSelected = selectPackage;
  $scope.switchMode = function() {
    $location.path('view/3d/' + $routeParams.pkgId);
  };

  var graphBuilder = require('../graphBuilder')($routeParams.pkgId, $http);
  $scope.graph = graphBuilder.graph;
  graphBuilder.start.then(function() {
    // todo: check if it supports webgl
    if (!$scope.$$phase) {
      $scope.$apply(function() {
        $scope.canSwitchMode = true;
      });
    } else {
      $scope.canSwitchMode = true;
    }
    var root = graphBuilder.graph.getNode($scope.root);
    if (root) {
      selectPackage(root);
    }
  });

  function selectPackage(node) {
    if (!$scope.$$phase) {
      $scope.$apply(function() {
        $scope.selectedPackage = node.data;
      });
    } else {
      $scope.selectedPackage = node.data;
    }
  }
};
