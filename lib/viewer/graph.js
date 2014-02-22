module.exports = require('an').directive(graphViewer);

function graphViewer() {
  return {
    restrict: 'E',
    template: '<div class="full graphView"></div>',
    replace: true,
    scope: {
      'source': '='
    },
    link: function (scope, element) {
      var graph = scope.source;
      var renderer = require('ngraph.fabric')(graph, {
        container: element[0],
        physics: {
          springLength : 80,
          springCoeff : 0.0002,
          gravity: -1.2,
          theta : 0.8,
          dragCoeff : 0.02
        }
      });
      renderer.run();

      scope.$on('$destroy', function(){
        // TODO: Implement me
      });
    }
  };
}
