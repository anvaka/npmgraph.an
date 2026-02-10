<template>
  <div ref="container" class="graphView d2d"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, defineExpose } from 'vue'
import { createScene, NodeCollection, CanvasEdgeCollection, ForceLayoutAdapter } from 'ngraph.svg'
import { SEVERITY_COLORS, getNodeSeverity } from '../vulnerabilities.js'

const props = defineProps({
  graph: { type: Object, required: true },
  rootId: { type: String, required: true },
  highlightRequest: { type: Object, default: null }
})

const emit = defineEmits(['node-selected', 'layout-ready'])

const container = ref(null)
let scene = null
let nodeCol = null
let edgeCol = null
let layout = null

// BFS distance from root for importance computation
let bfsDistances = new Map()
let maxBfsDistance = 1
let bfsDirty = true
let bfsChangeListener = null
let hasInitialFit = false

onMounted(() => {
  if (props.graph && container.value) {
    initRenderer()
  }
})

onUnmounted(() => {
  if (bfsChangeListener && props.graph) {
    props.graph.off('changed', bfsChangeListener)
    bfsChangeListener = null
  }
  if (layout) {
    layout.dispose()
    layout = null
  }
  if (scene) {
    scene.dispose()
    scene = null
  }
  nodeCol = null
  edgeCol = null
})

watch(() => props.highlightRequest, (request) => {
  if (!nodeCol || !edgeCol) return

  // Clear previous highlight
  nodeCol.clearState('highlighted')
  nodeCol.clearState('dimmed')
  edgeCol.clearState('highlighted')
  edgeCol.clearState('dimmed')

  if (!request) {
    if (scene) scene.requestRender()
    return
  }

  // Apply new color highlight to requested nodes
  request.ids.forEach(function (id) {
    nodeCol.setState(id, 'highlighted', true)
  })

  // Dim the rest
  props.graph.forEachNode(function (node) {
    if (!nodeCol.getState(node.id, 'highlighted')) {
      nodeCol.setState(node.id, 'dimmed', true)
    }
  })

  if (scene) scene.requestRender()
})

function getPackageName(nodeId) {
  var parts = String(nodeId).split('@')
  if (parts.length === 3) return '@' + parts[1]
  return parts[0]
}

function getPackageVersion(nodeId) {
  var parts = String(nodeId).split('@')
  return parts[parts.length - 1]
}

function findRootId() {
  var graph = props.graph
  if (!graph) return null
  var rootId = props.rootId
  if (graph.getNode(rootId)) return rootId
  // rootId may lack a version suffix — find the first node that matches
  var found = null
  graph.forEachNode(function(node) {
    if (found) return
    if (getPackageName(node.id) === rootId) found = node.id
  })
  return found
}

function recomputeDistances() {
  var graph = props.graph
  if (!graph) return

  var rootId = findRootId()
  if (!rootId) return

  bfsDistances.clear()
  bfsDistances.set(rootId, 0)
  var queue = [rootId]
  var head = 0
  maxBfsDistance = 0

  while (head < queue.length) {
    var nodeId = queue[head++]
    var dist = bfsDistances.get(nodeId)
    graph.forEachLinkedNode(nodeId, function(other) {
      if (!bfsDistances.has(other.id)) {
        var d = dist + 1
        bfsDistances.set(other.id, d)
        if (d > maxBfsDistance) maxBfsDistance = d
        queue.push(other.id)
      }
    })
  }
  bfsDirty = false
  if (nodeCol) nodeCol.invalidateContent()
}

const importance = d => {
  var dist = bfsDistances.get(d.nodeId)
  if (dist === undefined) return 0
  return 1 - dist / Math.max(maxBfsDistance, 1)
}

function nodeFill(d, ctx) {
  if (ctx.dimmed) return '#666'
  if (ctx['vuln-critical']) return SEVERITY_COLORS.CRITICAL
  if (ctx['vuln-high']) return SEVERITY_COLORS.HIGH
  if (ctx['vuln-moderate']) return SEVERITY_COLORS.MODERATE
  if (ctx['vuln-low']) return SEVERITY_COLORS.LOW
  return '#E8E6F0'
}

function applyVulnStates(vulnMap) {
  if (!nodeCol) return
  // Clear previous vuln states
  nodeCol.clearState('vuln-critical')
  nodeCol.clearState('vuln-high')
  nodeCol.clearState('vuln-moderate')
  nodeCol.clearState('vuln-low')

  vulnMap.forEach(function (vulns, nodeId) {
    var severity = getNodeSeverity(vulnMap, nodeId)
    if (severity) {
      nodeCol.setState(nodeId, 'vuln-' + severity.toLowerCase(), true)
    }
  })

  if (scene) scene.requestRender()
}

function initRenderer() {
  var graph = props.graph

  scene = createScene(container.value, {
    viewBox: { left: -500, top: -500, right: 500, bottom: 500 },
    panZoom: { minZoom: 0.1, maxZoom: 50 }
  })

  nodeCol = new NodeCollection({
    graph: graph,
    maxScale: 2,

    data: (graphNode) => ({
      nodeId: graphNode.id,
      name: getPackageName(graphNode.id),
      version: getPackageVersion(graphNode.id),
      description: graphNode.data?.description || '',
    }),
    size: 10,

    levels: [
      // Base: dot (always shown for all nodes)
      {
        type: 'circle', radius: 2,
        fill: nodeFill,
        opacity: (d, ctx) => ctx.dimmed ? 0.4 : 1,
      },

      // Circle with name (importance-gated, available at any zoom)
      {
        importance,
        layers: [
          { type: 'circle', radius: 3,
            fill: nodeFill,
            opacity: (d, ctx) => ctx.dimmed ? 0.4 : 1 },
          { type: 'text', text: d => d.name,
            fontSize: d => { var imp = importance(d); return 9 + imp * imp * 16; },
            fill: nodeFill,
            anchor: 'top', offset: [0, -10] },
        ],
      },

      // Circle with name + version (importance-gated, zoom >= 3.5)
      {
        minZoom: 2, importance,
        layers: [
          { type: 'circle', radius: 4,
            fill: nodeFill,
            opacity: (d, ctx) => ctx.dimmed ? 0.4 : 1 },
          { type: 'text', text: d => d.name,
            fontSize: d => { var imp = importance(d); return 10 + imp * imp * 18; },
            fill: nodeFill,
            anchor: 'top', offset: [0, -12] },
          { type: 'text', text: d => d.version, fontSize: 14,
            fill: (d, ctx) => ctx.dimmed ? '#555' : '#A0A0B8',
            anchor: 'bottom', offset: [0, 20], visible: d => !!d.version },
        ],
      },

      // Name + version + description (importance-gated, zoom >= 6)
      {
        minZoom: 3.5, importance,
        layers: [
          { type: 'circle', radius: 4,
            fill: nodeFill,
            opacity: (d, ctx) => ctx.dimmed ? 0.4 : 1 },
          { type: 'text', text: d => d.name,
            fontSize: d => { var imp = importance(d); return 10 + imp * imp * 18; },
            fill: nodeFill,
            anchor: 'top', offset: [0, -12] },
          { type: 'text', text: d => d.version, fontSize: 14,
            fill: (d, ctx) => ctx.dimmed ? '#555' : '#A0A0B8',
            anchor: 'bottom', offset: [0, 20], visible: d => !!d.version },
          { type: 'text', text: d => d.description, fontSize: 12,
            fill: (d, ctx) => ctx.dimmed ? '#555' : '#9090A8',
            maxWidth: 180,
            anchor: 'bottom', offset: [0, 36], visible: d => !!d.description },
        ],
      },
    ],
  })

  edgeCol = new CanvasEdgeCollection({
    graph: graph,
    nodeCollection: nodeCol,
    directed: true,
    container: container.value,
    color: (d, ctx) => ctx.highlighted ? '#E0DE0F' : '#565E72',
    width: (d, ctx) => ctx.highlighted ? 2 : 1,
    opacity: (d, ctx) => ctx.dimmed ? 0.2 : 1,
  })

  scene.addCollection(edgeCol)
  scene.addCollection(nodeCol)

  layout = new ForceLayoutAdapter(graph, {
    springLength: 80,
    springCoefficient: 0.0002,
    gravity: -1.2,
    dragCoefficient: 0.02,
    layeredLayout: false,
    onStabilized: () => {
      layoutRunning.value = false
      if (!hasInitialFit) {
        hasInitialFit = true
        layout.getBounds().then(function (bounds) {
          if (scene) scene.fitToView(bounds, 40)
        })
      }
    }
  })

  bfsChangeListener = function() { bfsDirty = true }
  graph.on('changed', bfsChangeListener)

  layout.onUpdate((positions) => {
    if (!layoutRunning.value) layoutRunning.value = true
    if (bfsDirty) recomputeDistances()
    nodeCol.syncPositions(positions)
    edgeCol.syncPositions(positions)
    scene.requestRender()
  })

  layout.getLayout().then(function () {
    emit('layout-ready')
  })
  layout.start()

  // Pin root node
  var rootNode = graph.getNode(props.rootId)
  if (rootNode) {
    graph.root = rootNode
    layout.pinNode(props.rootId)
  } else {
    graph.on('changed', pinRootNode)
  }

  // Click/tap handling via spatial index (with drag detection)
  function handleNodeHit(clientX, clientY) {
    var rect = scene.svg.getBoundingClientRect()
    var nodeId = nodeCol.getNodeAt(clientX - rect.left, clientY - rect.top, scene.drawContext)
    if (nodeId) {
      var node = graph.getNode(nodeId)
      if (node) {
        emit('node-selected', node)
        highlightNode(node)
      }
    } else {
      clearHighlight()
      emit('node-selected', null)
    }
  }

  // Mouse click handling (desktop)
  var mouseDownPos = null
  scene.svg.addEventListener('mousedown', (e) => {
    mouseDownPos = { x: e.clientX, y: e.clientY }
  })
  scene.svg.addEventListener('click', (e) => {
    if (mouseDownPos) {
      var mdx = e.clientX - mouseDownPos.x
      var mdy = e.clientY - mouseDownPos.y
      if (mdx * mdx + mdy * mdy > 25) return
    }
    handleNodeHit(e.clientX, e.clientY)
  })

  // Touch tap handling (mobile)
  // The panZoom controller calls preventDefault() on touchstart,
  // which prevents click events from firing on mobile. We detect
  // taps manually here.
  var touchStartPos = null
  scene.svg.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else {
      touchStartPos = null
    }
  }, { passive: true })
  scene.svg.addEventListener('touchend', (e) => {
    if (touchStartPos && e.changedTouches.length === 1) {
      var touch = e.changedTouches[0]
      var dx = touch.clientX - touchStartPos.x
      var dy = touch.clientY - touchStartPos.y
      if (dx * dx + dy * dy < 25) {
        handleNodeHit(touch.clientX, touch.clientY)
      }
    }
    touchStartPos = null
  })

  function pinRootNode(changes) {
    for (var i = 0; i < changes.length; i++) {
      var change = changes[i]
      if (change.changeType === 'add' && change.node) {
        graph.root = change.node
        layout.pinNode(change.node.id)
        graph.off('changed', pinRootNode)
        break
      }
    }
  }
}

function clearHighlight() {
  if (!nodeCol || !edgeCol) return
  nodeCol.clearState('highlighted')
  nodeCol.clearState('dimmed')
  edgeCol.clearState('highlighted')
  edgeCol.clearState('dimmed')
  if (scene) scene.requestRender()
}

function highlightNode(node) {
  if (!nodeCol || !edgeCol) return

  nodeCol.clearState('highlighted')
  nodeCol.clearState('dimmed')
  edgeCol.clearState('highlighted')
  edgeCol.clearState('dimmed')

  nodeCol.setState(node.id, 'highlighted', true)

  props.graph.forEachLinkedNode(node.id, function (other, link) {
    nodeCol.setState(other.id, 'highlighted', true)
    edgeCol.setState(link.id, 'highlighted', true)
  })

  props.graph.forEachNode(function (n) {
    if (!nodeCol.getState(n.id, 'highlighted')) {
      nodeCol.setState(n.id, 'dimmed', true)
    }
  })

  props.graph.forEachLink(function (link) {
    if (!edgeCol.getState(link.id, 'highlighted')) {
      edgeCol.setState(link.id, 'dimmed', true)
    }
  })

  if (scene) scene.requestRender()
}

const layoutRunning = ref(true)

function toggleLayout() {
  if (!layout) return
  if (layout._running) {
    layout.stop()
    layoutRunning.value = false
  } else {
    layout.start()
    layoutRunning.value = true
  }
}

defineExpose({ toggleLayout, layoutRunning, applyVulnStates })
</script>
