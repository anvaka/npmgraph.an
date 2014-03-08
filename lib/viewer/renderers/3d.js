/**
 * Creates a 3d renderer. This module is cheating, since it ignores user's
 * settings for a graph. I.e. nodes/edges are alwyas looking the same.
 */
module.exports = create3DRenderer;

function create3DRenderer(graph, container) {
  var renderer = require('ngraph.three')(graph, {
    container: container,
    physicsSettings: require('./physics')()
  });

  var scene = renderer.scene;
  var lights = addLights(scene);
  var camera = renderer.camera;

  renderer.onFrame(animateScene(scene, camera, lights));
  renderer.createNodeUI(nodeUI).createLinkUI(linkUI);

  var noop = function () {};

  return {
    run: renderer.run,
    dispose: renderer.dispose,
    layout: renderer.layout,
    on : noop,
    nodeTemplate: noop,
    linkTemplate: noop,

    exportSTL: function () {
      var three2stl = require('three2stl');
      var layout = renderer.layout;
      var scene = renderer.scene;

      var linkMaterial = new THREE.LineBasicMaterial({ color: 0x333333 });
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
        var tubeGeom = new THREE.TubeGeometry( path, 8, 1 );
        var mesh = new THREE.Mesh( tubeGeom, lineMaterial );
        scene.add(mesh);
      });
      renderer.renderOneFrame();

      return three2stl.scene(renderer.scene);
    }
  };
}

function getMesh(from, to, material) {
  var direction = new THREE.Vector3().subVectors(from, to);
  var arrow = new THREE.ArrowHelper(direction.clone().normalize(), to);

  //var rotation = new THREE.Vector3();

  var edgeGeometry = new THREE.CylinderGeometry( 2, 2, direction.length(), 10, 4 );

  var edge = new THREE.Mesh(edgeGeometry, material);
  edge.rotation.setFromQuaternion(arrow.quaternion);
  edge.position = new THREE.Vector3().addVectors(to, direction.multiplyScalar(0.5));

  return edge;
}

function nodeUI(node) {
  var nodeGeometry = new THREE.SphereGeometry(3);
  var nodeMaterial = new THREE.MeshPhongMaterial({
    color: 0x00BFFF
  });
  return new THREE.Mesh(nodeGeometry, nodeMaterial);
}

function linkUI(link) {
  var linkGeometry = new THREE.Geometry();
  linkGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
  linkGeometry.vertices.push(new THREE.Vector3(0, 0, 0));

  var linkMaterial = new THREE.LineBasicMaterial({ color: 0x333333 });
  return new THREE.Line(linkGeometry, linkMaterial);
}

function addLights(scene) {
  var light = new THREE.DirectionalLight(0xffffff);
  scene.add(light);

  return light;
}

function animateScene(scene, camera, lights) { 
  return function () {
    var timer = Date.now() * 0.0002;
    camera.position.x = Math.cos(timer) * 400;
    camera.position.z = Math.sin(timer) * 400;
    lights.position.x = Math.cos(timer);
    lights.position.z = Math.sin(timer);
    camera.lookAt(scene.position);
  };
}
