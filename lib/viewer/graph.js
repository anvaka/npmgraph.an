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

      return function link(scope, element) {
          var graph = scope.source;
          var renderer = create2DRenderer(graph, element[0]);
          renderer.on('nodeSelected', scope.nodeSelected);
          renderer.nodeTemplate(nodeTemplate);
          renderer.linkTemplate(linkTemplate);
          renderer.run();

          scope.$watch('mode', function (newValue, oldValue) {
            if (newValue !== oldValue) {
              renderer.dispose();
              if (newValue === '3D') {
                renderer = require('./renderers/3d')(graph, element[0]);
                renderer.run();
              }
            }
          });

          scope.$on('$destroy', function(){
            renderer.dispose();
          });
        };
    }
  };
}

function create2DRenderer(graph, container) {
  return require('ngraph.vivasvg')(graph, {
    container: container,
    physics: require('./renderers/physics')
  });
}
