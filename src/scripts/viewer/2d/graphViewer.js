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
      'mode': '=',
      'showSize': '='
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

          scope.$on('highlight-node', function(_, request) {
            highlightNodesFromRequest(request);
          });

          var graphUI = require('./graphUI')(renderer.svgRoot, scope.showSize);

          renderer.node(graphUI.node).placeNode(graphUI.placeNode);
          renderer.link(graphUI.link).placeLink(graphUI.placeLink);

          graphUI.on('nodeselected', onNodeSelected);
          graphUI.on('mouseenter', higlightNode);

          renderer.run();

          var rootNode = graph.getNode(scope.root);
          if (rootNode) {
            renderer.layout.pinNode(rootNode, true);
            higlightNode(rootNode);
          } else {
            graph.on('changed', pinRootNode);
          }

          return renderer;

          function pinRootNode(changes) {
            for (var i = 0; i < changes.length; ++i) {
              var change = changes[i];
              var isRootAdded = change.changeType === 'add' && change.node;
              if (isRootAdded) {
                graph.root = change.node;
                renderer.layout.pinNode(change.node, true);
                higlightNode(change.node);
                graph.off('changed', pinRootNode);
              }
            }
          }

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
