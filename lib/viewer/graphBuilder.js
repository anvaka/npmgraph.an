var createGraphBuilder = require('npmgraphbuilder');

module.exports = function (pkgName, useFakeData, http) {
  var graph = require('ngraph.graph')();

  var graphBuilder;
  if (useFakeData) {
    graphBuilder = require('./offline/graphBuilder');
  } else {
    graphBuilder = createGraphBuilder(function (url, data) {
      data.callback = 'JSON_CALLBACK';
      return http.jsonp(url, {params: data});
    });
  }

  graph.on('changed', pinRootNode);

  var promise = graphBuilder.createNpmDependenciesGraph(pkgName, graph);

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
