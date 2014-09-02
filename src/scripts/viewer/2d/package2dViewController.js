/**
 * This controller is responsible for building graph from current route
 */
require('./graphViewer');

module.exports = function ($scope, $routeParams, $http, $location) {
  $scope.name = ' ' + $routeParams.pkgId;
  $scope.root = $routeParams.pkgId;
  $scope.onNodeSelected = selectPackage;
  $scope.switchMode = function () {
    $location.path('view/3d/' + $routeParams.pkgId);
  };

  var graphBuilder = require('../graphBuilder')($routeParams.pkgId, $routeParams.fake, $http);
  $scope.graph = graphBuilder.graph;
  graphBuilder.start.then(function () {
    // todo: check if it supports webgl
    if(!$scope.$$phase) {
      $scope.$apply(function () { $scope.canSwitchMode = true;});
    } else {
      $scope.canSwitchMode = true;
    }
  });

  function selectPackage(node) {
    $scope.$apply(function () { $scope.selectedPackage = node.data; });
  }
};
