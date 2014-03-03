module.exports = create2DRenderer;

function create2DRenderer(graph, container) {
  return require('ngraph.vivasvg')(graph, {
    container: container,
    physics: require('./physics')()
  });
}
