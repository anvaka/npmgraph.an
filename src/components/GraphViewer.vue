<template>
  <div ref="container" class="graphView d2d"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import createSvgRenderer from 'ngraph.svg'
import createPhysicsSettings from '../physics.js'
import createGraphUI from '../graphUI.js'

const props = defineProps({
  graph: { type: Object, required: true },
  rootId: { type: String, required: true },
  highlightRequest: { type: Object, default: null }
})

const emit = defineEmits(['node-selected'])

const container = ref(null)
let renderer = null
let graphUI = null

onMounted(() => {
  if (props.graph && container.value) {
    initRenderer()
  }
})

onUnmounted(() => {
  if (renderer) {
    renderer.dispose()
    renderer = null
  }
})

watch(() => props.highlightRequest, (request) => {
  if (request && graphUI) {
    props.graph.forEachNode(graphUI.defaultHighlight)
    request.ids.forEach(function (id) { graphUI.setColor(id, request.color) })
  }
})

function initRenderer() {
  var graph = props.graph
  var settings = {
    physics: createPhysicsSettings(),
    container: container.value,
    scrollSpeed: 0.02
  }

  renderer = createSvgRenderer(graph, settings)
  graphUI = createGraphUI(renderer.svgRoot)

  renderer.node(graphUI.node).placeNode(graphUI.placeNode)
  renderer.link(graphUI.link).placeLink(graphUI.placeLink)

  graphUI.on('nodeselected', function (node) {
    emit('node-selected', node)
  })

  graphUI.on('mouseenter', highlightNode)

  renderer.run()

  var rootNode = graph.getNode(props.rootId)
  if (rootNode) {
    renderer.layout.pinNode(rootNode, true)
    highlightNode(rootNode)
  } else {
    graph.on('changed', pinRootNode)
  }

  function pinRootNode(changes) {
    for (var i = 0; i < changes.length; ++i) {
      var change = changes[i]
      var isRootAdded = change.changeType === 'add' && change.node
      if (isRootAdded) {
        graph.root = change.node
        renderer.layout.pinNode(change.node, true)
        highlightNode(change.node)
        graph.off('changed', pinRootNode)
      }
    }
  }
}

function highlightNode(node) {
  resetHighlight()
  graphUI.resetLinks()
  graphUI.highlight(node.id, '#E0DE0F', '#E0DE0F')

  props.graph.forEachLinkedNode(node.id, function (other, link) {
    var color = '#CFCCDF'
    graphUI.highlight(other.id, color)
    graphUI.highlightLink(link.id, color)
  })
}

function resetHighlight() {
  props.graph.forEachNode(graphUI.resetHighlight)
}
</script>
