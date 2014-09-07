module.exports = require('an').directive(graphViewer);

function graphViewer() {
  return {
    restrict: 'E',
    template: '<div class="graphView d2d"></div>',
    replace: true,
    transclude: true,
    scope: {
      'source': '=',
      'nodeSelected': '=',
      'root': '=',
      'mode': '='
    },

    compile: function(tElement, tAttrs, transclude) {
      var content = transclude(tElement.scope());
      var nodeTemplate, linkTemplate;

      angular.forEach(content, function(el) {
        var name = el.localName;
        if (name === 'node') {
          nodeTemplate = el.innerHTML;
        } else if (name === 'edge') {
          linkTemplate = el.innerHTML;
        }
      });

      return link;

      function link(scope, element) {
        var graph = scope.source;
        var renderer = createRenderer();

        scope.$on('$destroy', renderer.dispose);

        function createRenderer() {
          var renderer = require('ngraph.svg')(graph, {
            container: element[0],
            physics: require('../physics')()
          });
          var rootNode = graph.getNode(scope.root);

          renderer.layout.pinNode(rootNode, true);

          var graphUI = require('./graphUI')(renderer.svgRoot);

          renderer.node(graphUI.node).placeNode(graphUI.placeNode);
          renderer.link(graphUI.link).placeLink(graphUI.placeLink);

          graphUI.on('nodeselected', scope.nodeSelected);
          graphUI.on('mouseenter', higlightNode);

          renderer.run();

          higlightNode(rootNode);

          return renderer;

          function higlightNode(node) {
            graph.forEachNode(graphUI.resetHighlight);

            graphUI.resetLinks();
            graphUI.highlight(node.id, '#E0DE0F', '#E0DE0F');

            graph.forEachLinkedNode(node.id, function(other, link) {
              var color = '#CFCCDF';
              graphUI.highlight(other.id, color);
              graphUI.highlightLink(link.id, color);
            });
          }
        }
      }
    }
  };
}
