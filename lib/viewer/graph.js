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
                renderer = create3DRenderer(graph, element[0]);
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
    physics: getDefaultPhysics()
  });
}

function create3DRenderer(graph, container) {
  var renderer = require('ngraph.three')(graph, {
    container: container,
    physicsSettings: getDefaultPhysics()
  });

  var scene = renderer.scene;
  var camera = renderer.camera;
  var directionalLight = new THREE.DirectionalLight(0xffffff);
  scene.add(directionalLight);
  renderer.onFrame(function () {
    var timer = Date.now() * 0.0002;
    camera.position.x = Math.cos(timer) * 400;
    camera.position.z = Math.sin(timer) * 400;
    directionalLight.position.x = Math.cos(timer);
    directionalLight.position.z = Math.sin(timer);
    camera.lookAt(scene.position);
  });

  renderer.createNodeUI(function (node) {
      var nodeGeometry = new THREE.SphereGeometry(3);
      var nodeMaterial = new THREE.MeshPhongMaterial({
        color: 0x00BFFF
      });
      return new THREE.Mesh(nodeGeometry, nodeMaterial);
  }).createLinkUI(function (link) {
    var linkGeometry = new THREE.Geometry();
    linkGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
    linkGeometry.vertices.push(new THREE.Vector3(0, 0, 0));

    var linkMaterial = new THREE.LineBasicMaterial({ color: 0x222222 });
    return new THREE.Line(linkGeometry, linkMaterial);
  });
  return renderer;
}

function getDefaultPhysics () {
  return {
    springLength : 80,
    springCoeff : 0.0002,
    gravity: -1.2,
    theta : 0.8,
    dragCoeff : 0.02
  };
}
