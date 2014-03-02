/**
 * This controller is responsible for building graph from current route
 */
require('./graph');

var createGraphBuilder = require('npmgraphbuilder');

module.exports = function ($scope, $routeParams, $http) {
  $scope.name = ' ' + $routeParams.pkgId;
  var graph = require('ngraph.graph')();
  $scope.graph = graph;
  $scope.mode = '2D';
  $scope.alternateMode = '3D';
  $scope.onNodeSelected = selectPackage;
  $scope.switchMode = function () {
    if ($scope.mode === '2D') {
      $scope.alternateMode = '2D';
      $scope.mode = '3D';
    } else {
      $scope.alternateMode = '3D';
      $scope.mode = '2D';
    }
  };

  var graphBuilder = createGraphBuilder(function (url, data) {
    data.callback = 'JSON_CALLBACK';
    return $http.jsonp(url, {params: data});
  });

  graph.on('changed', pinRootNode);

  graphBuilder.createNpmDependenciesGraph($routeParams.pkgId, graph)
   .then (function () {
     // todo: check if it supports webgl
     $scope.canSwitchMode = true;
   });

  function pinRootNode(changes) {
    for (var i = 0; i < changes.length; ++i) {
      var change = changes[i];
      var isRootAdded = change.changeType === 'add' &&
                        change.node && change.node.id === $routeParams.pkgId;
      if (isRootAdded) {
        var data = change.node.data || (change.node.data = {});
        data.isPinned = true;
        graph.off('changed', pinRootNode);
      }
    }
  }

  function selectPackage(node) {
    $scope.$apply(function () { $scope.selectedPackage = node.data; });
  }
};
