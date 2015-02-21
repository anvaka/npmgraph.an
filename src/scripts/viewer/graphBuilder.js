/**
 * Creates a graph for a give package name
 */
var createGraphBuilder = require('npmgraphbuilder');
var registryUrl = require('../config.js').registryUrl;

module.exports = function (pkgName, http, changed) {
  var graph = require('ngraph.graph')();

  var graphBuilder = createGraphBuilder(function (url, data) {
    return http.get(url, {params: data});
  }, registryUrl);

  graph.on('changed', pinRootNode);

  var promise = graphBuilder.createNpmDependenciesGraph(pkgName, graph);
  graphBuilder.notifyProgress(changed);

  return {
    graph: graph,
    start: promise
  };

  function pinRootNode(changes) {
    for (var i = 0; i < changes.length; ++i) {
      var change = changes[i];
      var isRootAdded = change.changeType === 'add' &&
                        change.node && change.node.id === pkgName;
      if (isRootAdded) {
        var data = change.node.data || (change.node.data = {});
        data.isPinned = true;
        graph.off('changed', pinRootNode);
      }
    }
  }
};
