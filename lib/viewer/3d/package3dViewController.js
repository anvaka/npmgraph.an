var createGraphBuilder = require('npmgraphbuilder');

module.exports = function ($scope, $routeParams, $http, $location) {
  $scope.name = ' ' + $routeParams.pkgId;

  $scope.switchMode = function () {
    $location.path('view/2d/' + $routeParams.pkgId);
  };

  var graph = require('ngraph.graph')();
  $scope.graph = graph;
  var graphBuilder;
  if ($routeParams.fake) {
    graphBuilder = require('../offline/graphBuilder');
  } else {
    graphBuilder = createGraphBuilder(function (url, data) {
      data.callback = 'JSON_CALLBACK';
      return $http.jsonp(url, {params: data});
    });
  }

  // if we are offline during demo, uncomment this:
  graph.on('changed', pinRootNode);

  graphBuilder.createNpmDependenciesGraph($routeParams.pkgId, graph)
   .then (function () {
     // todo: check if it supports webgl
     if(!$scope.$$phase) {
       $scope.$apply(function () { $scope.canSwitchMode = true;});
     } else {
       $scope.canSwitchMode = true;
     }
   });

  var factory = require('./renderer3d');
  var renderer = factory(graph, document.querySelector('.graphView'));
  renderer.run();
  $scope.$on('$destroy', function() {
    renderer.dispose();
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
};
