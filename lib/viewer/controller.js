/**
 * This controller is responsible for building graph from current route
 */
require('./graph');

var createGraphBuilder = require('npmgraphbuilder');

module.exports = function ($scope, $routeParams, $http) {
  $scope.name = ' ' + $routeParams.pkgId;
  var graph = require('ngraph.graph')();
  $scope.graph = graph;

  var graphBuilder = createGraphBuilder(function (url, data) {
    data.callback = 'JSON_CALLBACK';
    return $http.jsonp(url, {params: data});
  });

  graphBuilder.createNpmDependenciesGraph($routeParams.pkgId, graph)
   .then(function (graph) {
   });
};
