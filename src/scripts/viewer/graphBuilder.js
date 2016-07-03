/**
 * Creates a graph for a give package name
 */
var createGraphBuilder = require('npmgraphbuilder');
var registryUrl = require('../config.js').registryUrl;

module.exports = buildGraph;

function buildGraph(pkgName, version, http, changed) {
  var graph = require('ngraph.graph')({uniqueLinkId: false});

  var graphBuilder = createGraphBuilder(function (url) {
    return http.get(url);
  }, registryUrl);

  graphBuilder.notifyProgress(changed);
  var promise = graphBuilder.createNpmDependenciesGraph(pkgName, graph, version);

  return {
    graph: graph,
    start: promise
  };
}
