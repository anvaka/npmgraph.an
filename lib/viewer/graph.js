module.exports = require('an').directive(graphViewer);

function graphViewer() {
  return {
    restrict: 'E',
    template: '<div class="full graphView"></div>',
    replace: true,
    transclude: true,
    scope: {
      'source': '='
    },

    compile: function (tElement, tAttrs, transclude) {
      var content = transclude(tElement.scope());
      var nodeTemplate, linkTemplate;
      var layers = [];

      angular.forEach(content.find('layer'), function (el) {
        layers.push(angular.element(el).attr('name'));
      });

      angular.forEach(content, function (el) {
        var name = el.localName;
        if (name === 'node') {
          nodeTemplate = name.innerHTML;
        } else if (name === 'edge') {
          linkTemplate = name.innerHTML;
        }
      });

      return function link(scope, element) {
          var graph = scope.source;
          var renderer = require('ngraph.vivasvg')(graph, {
            container: element[0],
            physics: {
              springLength : 80,
              springCoeff : 0.0002,
              gravity: -1.2,
              theta : 0.8,
              dragCoeff : 0.02
            }
          });

          var svgScene = renderer.scene;
          svgScene.setLayersOrder(layers);
          renderer.nodeTemplate(nodeTemplate);
          renderer.linkTemplate(linkTemplate);
          renderer.run();

          scope.$on('$destroy', function(){
            renderer.dispose();
          });
        };
    }
  };
}
