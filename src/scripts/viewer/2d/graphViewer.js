require('../info/packageInfo');

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
          var settings = {
            physics: require('../physics')(),
            container: element[0],
            scrollSpeed: 0.02
          };
          var renderer = require('ngraph.svg')(graph, settings);

          var rootNode = graph.getNode(scope.root);
          scope.$on('highlight-node', function(_, request) {
            highlightNodesFromRequest(request);
          });

          renderer.layout.pinNode(rootNode, true);

          var graphUI = require('./graphUI')(renderer.svgRoot);

          renderer.node(graphUI.node).placeNode(graphUI.placeNode);
          renderer.link(graphUI.link).placeLink(graphUI.placeLink);

          graphUI.on('nodeselected', onNodeSelected);
          graphUI.on('mouseenter', higlightNode);

          renderer.run();

          higlightNode(rootNode);

          return renderer;

          function higlightNode(node) {
            resetHighlight();

            graphUI.resetLinks();
            graphUI.highlight(node.id, '#E0DE0F', '#E0DE0F');

            graph.forEachLinkedNode(node.id, function(other, link) {
              var color = '#CFCCDF';
              graphUI.highlight(other.id, color);
              graphUI.highlightLink(link.id, color);
            });
          }

          function resetHighlight() {
            graph.forEachNode(graphUI.resetHighlight);
          }

          function onNodeSelected(node) {
            scope.$root.$broadcast('node-selected', node);
          }

          function highlightNodesFromRequest(request) {
            graph.forEachNode(graphUI.defaultHighlight);
            request.ids.forEach(function (id) { graphUI.setColor(id, request.color); });
          }
        }
      }
    }
  };
}
