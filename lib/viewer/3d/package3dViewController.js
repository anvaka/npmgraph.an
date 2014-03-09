module.exports = function ($scope, $routeParams, $http, $location) {
  $scope.name = ' ' + $routeParams.pkgId;

  $scope.switchMode = function () {
    $location.path('view/2d/' + $routeParams.pkgId);
  };
  $scope.exportModel = function () {
  };

  var graphBuilder = require('../graphBuilder')($routeParams.pkgId, $routeParams.fake, $http);
  graphBuilder.start.then(function () {
    // todo: check if it supports webgl
    if(!$scope.$$phase) {
      $scope.$apply(function () { $scope.canSwitchMode = true;});
    } else {
      $scope.canSwitchMode = true;
    }
  });

  var graph = graphBuilder.graph;
  var factory = require('./renderer3d');
  var renderer = factory(graph, document.querySelector('.graphView'));
  renderer.run();
  $scope.$on('$destroy', function() {
    renderer.dispose();
  });
};
