/**
 * Creates a 3d renderer. This module is cheating, since it ignores user's
 * settings for a graph. I.e. nodes/edges are alwyas looking the same.
 */
module.exports = create3DRenderer;

function create3DRenderer(graph, container) {
  var renderer = require('ngraph.three')(graph, {
    container: container,
    interactive: true,
    physicsSettings: require('../physics')()
  });

  var THREE = renderer.THREE;
  var scene = renderer.scene;
  var lights = addLights(scene);
  var camera = renderer.camera;

  renderer.renderer.setClearColor(0x36394A, 1);

  renderer.createNodeUI(nodeUI).createLinkUI(linkUI);

  var noop = function () {};

  return {
    run: renderer.run,
    dispose: renderer.dispose,
    layout: renderer.layout,

    exportSTL: function () {
      var three2stl = require('three2stl');
      var layout = renderer.layout;
      var scene = renderer.scene;

      var linkMaterial = new THREE.LineBasicMaterial({ color: 0x5A5D6E });
      // todo: this should be configurable
      graph.forEachNode(function (node) {
        var pos = layout.getNodePosition(node.id);
        pos.x *= 0.25;
        pos.y *= 0.25;
        pos.z *= 0.25;
      });

      var lineMaterial = new THREE.LineBasicMaterial({
            color: 0x222222, linewidth: 0.2 
        });
      graph.forEachLink(function (link) {
        var pos = layout.getLinkPosition(link.id);
        var path = new THREE.LineCurve3(
          new THREE.Vector3( pos.from.x, pos.from.y, pos.from.z ),
          new THREE.Vector3( pos.to.x, pos.to.y, pos.to.z )
        );
        var tubeGeom = new THREE.TubeGeometry( path, 8, 0.5 );
        var mesh = new THREE.Mesh( tubeGeom, lineMaterial );
        scene.add(mesh);
      });
      renderer.renderOneFrame();

      return three2stl.scene(renderer.scene);
    }
  };

function nodeUI(node) {
  var nodeGeometry = new THREE.SphereGeometry(3);
  var nodeMaterial = new THREE.MeshPhongMaterial({
    color: 0xCFCCDF
  });
  return new THREE.Mesh(nodeGeometry, nodeMaterial);
}

function linkUI(link) {
  var linkGeometry = new THREE.Geometry();
  linkGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
  linkGeometry.vertices.push(new THREE.Vector3(0, 0, 0));

  var linkMaterial = new THREE.LineBasicMaterial({ color: 0x5A5D6E });
  return new THREE.Line(linkGeometry, linkMaterial);
}

function addLights(scene) {
  var light = new THREE.DirectionalLight(0xffffff);
  scene.add(light);

  return light;
}
}


