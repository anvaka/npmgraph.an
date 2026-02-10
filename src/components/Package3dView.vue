<template>
  <div class="full">
    <div ref="container" class="graphView"></div>
    <Teleport to="#sidebar-target">
      <PackageInfo
        v-if="graph"
        ref="packageInfoRef"
        :graph="graph"
        :show-actions="showSwitchMode"
        :layout-running="rendererLayoutRunning"
        :vuln-map="vulnMap"
        @highlight-node="onHighlightNode"
        @toggle-layout="toggleLayout"
        @switch-mode="switchMode"
      />

      <div v-if="errors.length" class="graph-errors">
        <h4>Failed to resolve {{ errors.length }} package{{ errors.length > 1 ? 's' : '' }}:</h4>
        <ul>
          <li v-for="(err, i) in errors" :key="i">
            <strong>{{ err.name }}</strong>
            <span v-if="err.version" class="error-version">{{ err.version }}</span>
            <div class="error-message">{{ err.message }}</div>
          </li>
        </ul>
      </div>

      <div v-if="showProgress" class="graph-progress">
        <h4>Remaining packages: <span>{{ progress }}</span></h4>
      </div>
      <div v-if="vulnScanning && vulnProgress" class="graph-progress">
        <h4>{{ vulnProgress }}</h4>
      </div>
    </Teleport>

    <div v-if="showSwitchMode" class="switchMode d2d">
      <button class="btn" type="button" @click="toggleLayout">
        {{ rendererLayoutRunning ? 'Stop' : 'Start' }} layout
      </button>
      <button class="btn" type="button" @click="switchMode">Show 2D</button>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, reactive, markRaw, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import buildGraph, { buildGraphFromJson } from '../graphBuilder.js'
import getLocation from '../getLocation.js'
import { uploadedPackageJson, includeDevDeps } from '../uploadStore.js'
import { scanVulnerabilities } from '../vulnerabilities.js'
import PackageInfo from './PackageInfo.vue'

const route = useRoute()
const router = useRouter()

const container = ref(null)
const graph = shallowRef(null)
const showSwitchMode = ref(false)
const showProgress = ref(true)
const progress = ref(0)
const errors = reactive([])
const packageInfoRef = ref(null)
const vulnMap = shallowRef(null)
const vulnScanning = ref(false)
const vulnProgress = ref('')
const rendererLayoutRunning = ref(true)

let renderer3d = null
let layoutToggleCount = 0

onMounted(() => {
  var graphBuilder

  if (route.params.pkgId === '~upload') {
    if (!uploadedPackageJson.value) {
      router.replace('/')
      return
    }
    var pkg = uploadedPackageJson.value
    graphBuilder = buildGraphFromJson(pkg, { includeDevDeps: includeDevDeps.value }, progressChanged)
  } else {
    graphBuilder = buildGraph(route.params.pkgId, route.params.version, progressChanged)
  }

  var g = markRaw(graphBuilder.graph)
  graph.value = g

  import('../renderer3d.js').then(function (module) {
    if (!container.value) return
    var create3DRenderer = module.default
    renderer3d = create3DRenderer(g, container.value)

    renderer3d.onNodeSelected(function (node) {
      if (packageInfoRef.value) {
        packageInfoRef.value.onNodeSelected(node)
      }
    })

    renderer3d.run()

    // Start graph building after renderer is ready
    graphBuilder.start().then(function () {
      graphLoaded(graphBuilder.errors)
    })
  })
})

onUnmounted(() => {
  if (renderer3d) {
    renderer3d.dispose()
    renderer3d = null
  }
})

function progressChanged(queueLength) {
  progress.value = queueLength
}

function graphLoaded(buildErrors) {
  showSwitchMode.value = true
  showProgress.value = false

  if (buildErrors && buildErrors.length) {
    errors.push.apply(errors, buildErrors)
  }

  // Set graph.root so PackageInfo.onGraphLoaded can select it
  var g = graph.value
  var rootId = route.params.pkgId === '~upload'
    ? (uploadedPackageJson.value.name || 'uploaded-project') + '@' + (uploadedPackageJson.value.version || '0.0.0')
    : null
  if (!g.root) {
    if (rootId) {
      g.root = g.getNode(rootId)
    }
    if (!g.root) {
      // Fallback: pick first node
      g.forEachNode(function (node) {
        if (!g.root) g.root = node
      })
    }
  }

  if (packageInfoRef.value) {
    packageInfoRef.value.onGraphLoaded(g)
  }

  // Start vulnerability scan
  vulnScanning.value = true
  scanVulnerabilities(graph.value, {
    onProgress: function (msg) { vulnProgress.value = msg }
  }).then(function (result) {
    vulnMap.value = result
    vulnScanning.value = false
    if (renderer3d) {
      renderer3d.applyVulnStates(result)
    }
    if (packageInfoRef.value) {
      packageInfoRef.value.onVulnDataLoaded(result)
    }
  }).catch(function () {
    vulnScanning.value = false
    vulnProgress.value = ''
  })
}

function onHighlightNode(request) {
  if (renderer3d) {
    renderer3d.highlightNodes(request)
  }
}

function toggleLayout() {
  if (renderer3d) {
    renderer3d.toggleLayout()
    layoutToggleCount += 1
    rendererLayoutRunning.value = renderer3d.layoutRunning
  }
}

function switchMode() {
  var path = getLocation(route.params, true)
  router.push(path)
}
</script>
