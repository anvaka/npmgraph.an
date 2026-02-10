import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import createLayout from 'ngraph.forcelayout'
import { SEVERITY_COLORS, getNodeSeverity } from './vulnerabilities.js'

var DEFAULT_COLOR = new THREE.Color(0x52CCE3)
var ROOT_COLOR = new THREE.Color(0xCFCCDF)
var ROOT_SCALE = 2.5
var EDGE_COLOR = 0x2A5A6A
var DIMMED_FACTOR = 0.03
var LAYOUT_STEPS_PER_FRAME = 6
var GLOW_WIDTH = 1.8

// Billboard-quad glow: each edge → a camera-facing quad with soft edges
var GLOW_VERTEX = [
  'attribute vec3 posA;',
  'attribute vec3 posB;',
  'attribute float direction;',
  'attribute float side;',
  'uniform float uWidth;',
  'varying float vDirection;',
  'varying float vSide;',
  'void main() {',
  '  vec3 pos = mix(posA, posB, direction);',
  '  vec3 lineDir = normalize(posB - posA);',
  '  vec3 camDir = normalize(cameraPosition - pos);',
  '  vec3 offset = normalize(cross(lineDir, camDir));',
  '  pos += offset * side * uWidth;',
  '  vDirection = direction;',
  '  vSide = side;',
  '  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);',
  '}'
].join('\n')

var GLOW_FRAGMENT = [
  'uniform float uTime;',
  'uniform vec3 uColor;',
  'varying float vDirection;',
  'varying float vSide;',
  'void main() {',
  '  float edge = 1.0 - abs(vSide);',
  '  edge = edge * edge;',
  '  float speed = 0.7;',
  '  float t = uTime * speed;',
  '  float p1 = fract(vDirection - t);',
  '  float p2 = fract(vDirection - t + 0.5);',
  '  float glow = exp(-p1 * p1 * 18.0) + exp(-p2 * p2 * 18.0);',
  '  float base = 0.06;',
  '  float brightness = (base + glow * 0.7) * edge;',
  '  gl_FragColor = vec4(uColor * brightness, brightness);',
  '}'
].join('\n')

export default function create3DRenderer(graph, container) {
  var width = container.clientWidth
  var height = container.clientHeight

  // Scene
  var scene = new THREE.Scene()
  scene.background = new THREE.Color(0x020208)

  // Lighting
  var ambientLight = new THREE.AmbientLight(0x112233, 0.6)
  scene.add(ambientLight)

  var keyLight = new THREE.DirectionalLight(0xCCEEFF, 3.0)
  keyLight.position.set(1, 1.5, 1)
  scene.add(keyLight)

  var fillLight = new THREE.PointLight(0x52CCE3, 2.0, 0)
  fillLight.position.set(-200, -100, -200)
  scene.add(fillLight)

  var rimLight = new THREE.PointLight(0x4488AA, 1.5, 0)
  rimLight.position.set(0, 200, -300)
  scene.add(rimLight)

  // Camera
  var camera = new THREE.PerspectiveCamera(60, width / height, 1, 10000)
  camera.position.set(0, 0, 300)

  // WebGL Renderer
  var webglRenderer = new THREE.WebGLRenderer({ antialias: true })
  webglRenderer.setSize(width, height)
  webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  webglRenderer.toneMapping = THREE.ACESFilmicToneMapping
  webglRenderer.toneMappingExposure = 1.5
  container.appendChild(webglRenderer.domElement)

  // Environment map for glass-like reflections
  var pmremGenerator = new THREE.PMREMGenerator(webglRenderer)
  var envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = envTexture
  pmremGenerator.dispose()

  // CSS2D Renderer for labels
  var labelRenderer = new CSS2DRenderer()
  labelRenderer.setSize(width, height)
  labelRenderer.domElement.style.position = 'absolute'
  labelRenderer.domElement.style.top = '0'
  labelRenderer.domElement.style.left = '0'
  labelRenderer.domElement.style.pointerEvents = 'none'
  container.appendChild(labelRenderer.domElement)

  // Controls
  var controls = new OrbitControls(camera, webglRenderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.15
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
  }

  // Layout
  var layout = createLayout(graph, {
    dimensions: 3,
    springLength: 30,
    springCoefficient: 0.001,
    gravity: -1.5,
    theta: 0.8,
    dragCoefficient: 0.1
  })

  // State
  var nodeIds = []
  var nodeIndexById = Object.create(null)
  var instancedMesh = null
  var edgeGeometry = null
  var edgeLine = null
  var layoutRunning = true
  var animFrameId = null
  var disposed = false
  var selectedCallback = null
  var vulnMap = null
  var rootId = null
  var dummy = new THREE.Object3D()
  var tempColor = new THREE.Color()
  var highlightedIds = null   // sidebar filter
  var glowConnectedIds = null // nodes connected to clicked node (including itself)

  // Hover label
  var hoverLabel = null
  var hoverLabelObj = null
  var hoveredInstanceId = -1

  // Glow edges
  var glowMesh = null
  var glowGeometry = null
  var glowMaterial = null
  var glowNodeId = null
  var glowLinks = []

  // Camera transition
  var cameraTransitionStart = null
  var cameraTransitionNodeId = null
  var cameraTransitionT = 0
  var lastFrameTime = 0
  var _v1 = new THREE.Vector3()
  var _v2 = new THREE.Vector3()

  function createHoverLabel() {
    var el = document.createElement('div')
    el.style.cssText = 'color:#e0f0ff;font:12px monospace;background:rgba(2,2,8,0.85);padding:3px 8px;border-radius:4px;border:1px solid rgba(82,204,227,0.4);white-space:nowrap;pointer-events:none;'
    hoverLabel = el
    hoverLabelObj = new CSS2DObject(el)
    hoverLabelObj.visible = false
    hoverLabelObj.center.set(0.5, -0.5)
    scene.add(hoverLabelObj)
  }
  createHoverLabel()

  var pointerDownPos = null

  function findRootId() {
    var firstNode = null
    graph.forEachNode(function (node) {
      if (!firstNode) firstNode = node.id
    })
    return firstNode
  }

  function stripVersion(nodeId) {
    var atIdx = nodeId.lastIndexOf('@')
    return atIdx > 0 ? nodeId.substring(0, atIdx) : nodeId
  }

  var sharedSphereGeo = new THREE.IcosahedronGeometry(2.0, 4)

  // --- Glow edge system (billboard quads) ---

  function clearGlowEdges() {
    if (glowMesh) {
      scene.remove(glowMesh)
      glowGeometry.dispose()
      glowMaterial.dispose()
      glowMesh = null
      glowGeometry = null
      glowMaterial = null
    }
    glowNodeId = null
    glowLinks = []
    if (glowConnectedIds) {
      glowConnectedIds = null
      applyColors()
    }
  }

  function buildGlowEdges(nodeId) {
    clearGlowEdges()
    if (!nodeId) return

    glowNodeId = nodeId

    var links = []
    glowConnectedIds = new Set([nodeId])
    graph.forEachLinkedNode(nodeId, function (linked, link) {
      links.push(link)
      glowConnectedIds.add(linked.id)
    })
    if (links.length === 0) {
      glowConnectedIds = null
      return
    }
    glowLinks = links

    // 4 vertices per edge, 6 indices per edge (2 triangles)
    var vertCount = links.length * 4
    var posA = new Float32Array(vertCount * 3)
    var posB = new Float32Array(vertCount * 3)
    var dirs = new Float32Array(vertCount)
    var sides = new Float32Array(vertCount)
    var indices = new Uint16Array(links.length * 6)

    for (var i = 0; i < links.length; i++) {
      var link = links[i]
      var clickedIsFrom = (link.fromId === nodeId)
      var srcPos = layout.getNodePosition(clickedIsFrom ? link.fromId : link.toId)
      var dstPos = layout.getNodePosition(clickedIsFrom ? link.toId : link.fromId)

      var vi = i * 4
      // 4 verts: (src,-1), (src,+1), (dst,-1), (dst,+1)
      // posA = source, posB = dest for ALL verts (shader uses direction to pick end)
      for (var v = 0; v < 4; v++) {
        var fv = (vi + v) * 3

        posA[fv] = srcPos.x;  posA[fv + 1] = srcPos.y;  posA[fv + 2] = srcPos.z || 0
        posB[fv] = dstPos.x;  posB[fv + 1] = dstPos.y;  posB[fv + 2] = dstPos.z || 0

        dirs[vi + v] = v < 2 ? 0.0 : 1.0
        sides[vi + v] = (v % 2 === 0) ? -1.0 : 1.0
      }

      // Two triangles: (0,1,2) (2,1,3)
      var ii = i * 6
      indices[ii] = vi;     indices[ii + 1] = vi + 1; indices[ii + 2] = vi + 2
      indices[ii + 3] = vi + 2; indices[ii + 4] = vi + 1; indices[ii + 5] = vi + 3
    }

    glowGeometry = new THREE.BufferGeometry()
    glowGeometry.setAttribute('posA', new THREE.BufferAttribute(posA, 3))
    glowGeometry.setAttribute('posB', new THREE.BufferAttribute(posB, 3))
    glowGeometry.setAttribute('direction', new THREE.BufferAttribute(dirs, 1))
    glowGeometry.setAttribute('side', new THREE.BufferAttribute(sides, 1))
    glowGeometry.setIndex(new THREE.BufferAttribute(indices, 1))

    glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x52CCE3) },
        uWidth: { value: GLOW_WIDTH }
      },
      vertexShader: GLOW_VERTEX,
      fragmentShader: GLOW_FRAGMENT,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    })

    glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
    glowMesh.frustumCulled = false
    scene.add(glowMesh)

    applyColors()
  }

  function updateGlowPositions() {
    if (!glowMesh || glowLinks.length === 0) return

    var posAAttr = glowGeometry.getAttribute('posA')
    var posBAttr = glowGeometry.getAttribute('posB')
    var aArr = posAAttr.array
    var bArr = posBAttr.array

    for (var i = 0; i < glowLinks.length; i++) {
      var link = glowLinks[i]
      var clickedIsFrom = (link.fromId === glowNodeId)
      var srcPos = layout.getNodePosition(clickedIsFrom ? link.fromId : link.toId)
      var dstPos = layout.getNodePosition(clickedIsFrom ? link.toId : link.fromId)

      for (var v = 0; v < 4; v++) {
        var fv = (i * 4 + v) * 3

        aArr[fv] = srcPos.x;  aArr[fv + 1] = srcPos.y;  aArr[fv + 2] = srcPos.z || 0
        bArr[fv] = dstPos.x;  bArr[fv + 1] = dstPos.y;  bArr[fv + 2] = dstPos.z || 0
      }
    }
    posAAttr.needsUpdate = true
    posBAttr.needsUpdate = true

    glowMaterial.uniforms.uTime.value = performance.now() * 0.001
  }

  // --- Meshes ---

  function pinRootNode() {
    if (!rootId) return
    var rootNode = graph.getNode(rootId)
    if (!rootNode) return
    layout.setNodePosition(rootId, 0, 0, 0)
    layout.pinNode(rootNode, true)
  }

  function rebuildMeshes() {
    rootId = findRootId()
    pinRootNode()

    if (instancedMesh) {
      scene.remove(instancedMesh)
      instancedMesh.material.dispose()
    }
    if (edgeLine) {
      scene.remove(edgeLine)
      edgeGeometry.dispose()
      edgeLine.material.dispose()
    }

    nodeIds = []
    nodeIndexById = Object.create(null)
    graph.forEachNode(function (node) {
      nodeIndexById[node.id] = nodeIds.length
      nodeIds.push(node.id)
    })

    var nodeCount = nodeIds.length
    if (nodeCount === 0) return

    var sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      roughness: 0.15,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      envMapIntensity: 0.5
    })
    instancedMesh = new THREE.InstancedMesh(sharedSphereGeo, sphereMat, nodeCount)
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)

    for (var i = 0; i < nodeCount; i++) {
      var id = nodeIds[i]
      var color = getNodeColor(id)
      instancedMesh.setColorAt(i, color)

      dummy.position.set(0, 0, 0)
      dummy.scale.setScalar(id === rootId ? ROOT_SCALE : 1)
      dummy.updateMatrix()
      instancedMesh.setMatrixAt(i, dummy.matrix)
    }
    instancedMesh.instanceColor.needsUpdate = true
    scene.add(instancedMesh)

    // Large bounding sphere so raycaster broadphase never rejects
    instancedMesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 100000)

    var linkCount = graph.getLinksCount()
    var edgePositions = new Float32Array(linkCount * 6)
    edgeGeometry = new THREE.BufferGeometry()
    edgeGeometry.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3))
    edgeGeometry.setDrawRange(0, linkCount * 2)

    var edgeMat = new THREE.LineBasicMaterial({
      color: EDGE_COLOR,
      transparent: true,
      opacity: 0.5
    })
    edgeLine = new THREE.LineSegments(edgeGeometry, edgeMat)
    scene.add(edgeLine)

    // Rebuild glow if a node was selected
    if (glowNodeId && graph.getNode(glowNodeId)) {
      buildGlowEdges(glowNodeId)
    } else {
      clearGlowEdges()
    }
  }

  function getNodeColor(id) {
    if (vulnMap) {
      var severity = getNodeSeverity(vulnMap, id)
      if (severity && SEVERITY_COLORS[severity]) {
        tempColor.set(SEVERITY_COLORS[severity])
        if (isDimmed(id)) tempColor.multiplyScalar(DIMMED_FACTOR)
        return tempColor
      }
    }
    if (id === rootId) {
      tempColor.copy(ROOT_COLOR)
    } else {
      tempColor.copy(DEFAULT_COLOR)
    }
    if (isDimmed(id)) tempColor.multiplyScalar(DIMMED_FACTOR)
    return tempColor
  }

  function isDimmed(id) {
    if (highlightedIds && !highlightedIds.has(id)) return true
    if (glowConnectedIds && !glowConnectedIds.has(id)) return true
    return false
  }

  function applyColors() {
    if (!instancedMesh) return
    for (var i = 0; i < nodeIds.length; i++) {
      var color = getNodeColor(nodeIds[i])
      instancedMesh.setColorAt(i, color)
    }
    instancedMesh.instanceColor.needsUpdate = true

    var anyDimming = highlightedIds || glowConnectedIds
    if (edgeLine) {
      edgeLine.material.opacity = anyDimming ? 0.3 : 0.5
    }
  }

  function updatePositions() {
    if (!instancedMesh) return

    var nodeCount = nodeIds.length
    for (var i = 0; i < nodeCount; i++) {
      var pos = layout.getNodePosition(nodeIds[i])
      dummy.position.set(pos.x, pos.y, pos.z || 0)
      dummy.scale.setScalar(nodeIds[i] === rootId ? ROOT_SCALE : 1)
      dummy.updateMatrix()
      instancedMesh.setMatrixAt(i, dummy.matrix)
    }
    instancedMesh.instanceMatrix.needsUpdate = true

    if (edgeLine) {
      var posAttr = edgeGeometry.getAttribute('position')
      var posArray = posAttr.array
      var idx = 0
      graph.forEachLink(function (link) {
        var fromPos = layout.getNodePosition(link.fromId)
        var toPos = layout.getNodePosition(link.toId)
        posArray[idx] = fromPos.x
        posArray[idx + 1] = fromPos.y
        posArray[idx + 2] = fromPos.z || 0
        posArray[idx + 3] = toPos.x
        posArray[idx + 4] = toPos.y
        posArray[idx + 5] = toPos.z || 0
        idx += 6
      })
      posAttr.needsUpdate = true
    }

    if (hoverLabelObj.visible && hoveredInstanceId >= 0 && hoveredInstanceId < nodeCount) {
      var hPos = layout.getNodePosition(nodeIds[hoveredInstanceId])
      hoverLabelObj.position.set(hPos.x, hPos.y, hPos.z || 0)
    }

    updateGlowPositions()
  }

  // Raycaster picking
  var raycaster = new THREE.Raycaster()
  var pointer = new THREE.Vector2()

  function onPointerDown(e) {
    pointerDownPos = { x: e.clientX, y: e.clientY }
  }

  function onPointerUp(e) {
    if (!pointerDownPos) return
    var dx = e.clientX - pointerDownPos.x
    var dy = e.clientY - pointerDownPos.y
    pointerDownPos = null
    if (dx * dx + dy * dy > 25) return

    if (!pickNode(e)) {
      clearGlowEdges()
      cameraTransitionNodeId = null
      if (highlightedIds) {
        highlightedIds = null
        applyColors()
      }
      if (selectedCallback) selectedCallback(null)
    }
  }

  function onPointerMove(e) {
    if (!instancedMesh) return
    var rect = webglRenderer.domElement.getBoundingClientRect()
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(pointer, camera)
    var hits = raycaster.intersectObject(instancedMesh)
    if (hits.length > 0) {
      var instId = hits[0].instanceId
      if (instId !== hoveredInstanceId) {
        hoveredInstanceId = instId
        var nodeId = nodeIds[instId]
        hoverLabel.textContent = stripVersion(nodeId)
        hoverLabelObj.visible = true
      }
      webglRenderer.domElement.style.cursor = 'pointer'
    } else {
      hoveredInstanceId = -1
      hoverLabelObj.visible = false
      webglRenderer.domElement.style.cursor = ''
    }
  }

  function startCameraTransition(nodeId) {
    cameraTransitionStart = controls.target.clone()
    cameraTransitionNodeId = nodeId
    cameraTransitionT = 0
  }

  function pickNode(e) {
    if (!instancedMesh) return false
    var rect = webglRenderer.domElement.getBoundingClientRect()
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(pointer, camera)
    var hits = raycaster.intersectObject(instancedMesh)
    if (hits.length > 0) {
      var instanceId = hits[0].instanceId
      var nodeId = nodeIds[instanceId]
      var node = graph.getNode(nodeId)
      if (node) {
        if (selectedCallback) selectedCallback(node)
        buildGlowEdges(nodeId)
        startCameraTransition(nodeId)
        return true
      }
    }
    return false
  }

  webglRenderer.domElement.addEventListener('pointerdown', onPointerDown)
  webglRenderer.domElement.addEventListener('pointerup', onPointerUp)
  webglRenderer.domElement.addEventListener('pointermove', onPointerMove)

  // Graph growth
  var rebuildScheduled = false
  function onGraphChanged() {
    if (rebuildScheduled) return
    rebuildScheduled = true
    requestAnimationFrame(function () {
      rebuildScheduled = false
      if (disposed) return
      rebuildMeshes()
      applyColors()
    })
  }
  graph.on('changed', onGraphChanged)

  // Resize
  function onResize() {
    width = container.clientWidth
    height = container.clientHeight
    if (width === 0 || height === 0) return
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    webglRenderer.setSize(width, height)
    labelRenderer.setSize(width, height)
  }
  window.addEventListener('resize', onResize)

  // Animation loop
  function animate() {
    if (disposed) return
    animFrameId = requestAnimationFrame(animate)

    var now = performance.now()
    var dt = lastFrameTime ? Math.min((now - lastFrameTime) / 1000, 0.05) : 0.016
    lastFrameTime = now

    if (layoutRunning) {
      for (var i = 0; i < LAYOUT_STEPS_PER_FRAME; i++) {
        layout.step()
      }
    }
    updatePositions()

    // Smooth camera transition to clicked node
    if (cameraTransitionNodeId && graph.getNode(cameraTransitionNodeId)) {
      cameraTransitionT = Math.min(1, cameraTransitionT + dt * 2.5)
      var ease = cameraTransitionT * cameraTransitionT * (3 - 2 * cameraTransitionT)
      var nodePos = layout.getNodePosition(cameraTransitionNodeId)
      _v1.set(nodePos.x, nodePos.y, nodePos.z || 0)
      _v2.lerpVectors(cameraTransitionStart, _v1, ease)
      _v1.copy(_v2).sub(controls.target)
      controls.target.add(_v1)
      camera.position.add(_v1)
      if (cameraTransitionT >= 1) cameraTransitionNodeId = null
    }

    controls.update()
    webglRenderer.render(scene, camera)
    labelRenderer.render(scene, camera)
  }

  // Public API
  return {
    run: function () {
      rebuildMeshes()
      animate()
    },

    dispose: function () {
      disposed = true
      if (animFrameId) cancelAnimationFrame(animFrameId)
      graph.off('changed', onGraphChanged)
      window.removeEventListener('resize', onResize)
      webglRenderer.domElement.removeEventListener('pointerdown', onPointerDown)
      webglRenderer.domElement.removeEventListener('pointerup', onPointerUp)
      webglRenderer.domElement.removeEventListener('pointermove', onPointerMove)
      controls.dispose()
      if (instancedMesh) {
        instancedMesh.material.dispose()
      }
      if (edgeLine) {
        edgeGeometry.dispose()
        edgeLine.material.dispose()
      }
      clearGlowEdges()
      sharedSphereGeo.dispose()
      if (envTexture) envTexture.dispose()
      if (hoverLabelObj) scene.remove(hoverLabelObj)
      webglRenderer.dispose()
      if (container.contains(webglRenderer.domElement)) {
        container.removeChild(webglRenderer.domElement)
      }
      if (container.contains(labelRenderer.domElement)) {
        container.removeChild(labelRenderer.domElement)
      }
    },

    applyVulnStates: function (map) {
      vulnMap = map
      applyColors()
    },

    onNodeSelected: function (callback) {
      selectedCallback = callback
    },

    highlightNodes: function (request) {
      if (request && request.ids && request.ids.length > 0) {
        highlightedIds = new Set(request.ids)
      } else {
        highlightedIds = null
      }
      applyColors()
    },

    toggleLayout: function () {
      layoutRunning = !layoutRunning
    },

    get layoutRunning() {
      return layoutRunning
    }
  }
}
