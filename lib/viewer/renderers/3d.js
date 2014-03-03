/**
 * Creates a 3d renderer. This module is cheating, since it ignores user's
 * settings for a graph. I.e. nodes/edges are alwyas looking the same.
 */
module.exports = create3DRenderer;

function create3DRenderer(graph, container) {
  var renderer = require('ngraph.three')(graph, {
    container: container,
    physicsSettings: require('./physics')
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
    linkTemplate: noop
  };
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
