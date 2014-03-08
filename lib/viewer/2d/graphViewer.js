debugger;
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
          var renderer = require('ngraph.vivasvg')(graph, {
              container: element[0],
              physics: require('../physics')()
            });

          renderer.layout.pinNode(graph.getNode(scope.root), true);
          renderer.on('nodeSelected', scope.nodeSelected);
          renderer.nodeTemplate(nodeTemplate);
          renderer.linkTemplate(linkTemplate);
          renderer.run();
          return renderer;
        }
      }
    }
  };
}
