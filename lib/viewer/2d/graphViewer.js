module.exports = require('an').directive(graphViewer);

function graphViewer() {
  return {
    restrict: 'E',
    template: '<div class="graphView"></div>',
    replace: true,
    transclude: true,
    scope: {
      'source': '=',
      'nodeSelected': '=',
      'root': '=',
      'mode': '='
    },

    compile: function (tElement, tAttrs, transclude) {
      var content = transclude(tElement.scope());
      var nodeTemplate, linkTemplate;
      var templates = require('./nodeTemplate');

      angular.forEach(content, function (el) {
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

        scope.$on('$destroy', function(){
          renderer.dispose();
        });

        function createRenderer() {
          var renderer = require('ngraph.svg')(graph, {
              container: element[0],
              physics: require('../physics')()
            });

          renderer.layout.pinNode(graph.getNode(scope.root), true);
          renderer.on('nodeSelected', scope.nodeSelected);

          renderer.node(templates.node);
          renderer.link(templates.link);
          renderer.placeNode(function (nodeUI, pos) {
            nodeUI.attr('transform',
                        'translate(' +
                              (pos.x) + ',' + (pos.y) +
                        ')');
          });
//          renderer.linkTemplate(linkTemplate);
          renderer.run();
          return renderer;
        }
      }
    }
  };
}
