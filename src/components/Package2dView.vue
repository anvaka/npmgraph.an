<template>
  <div class="full">
    <GraphViewer
      v-if="graph"
      ref="graphViewerRef"
      :graph="graph"
      :root-id="rootId"
      :highlight-request="highlightRequest"
      @node-selected="onNodeSelected"
      @layout-ready="onLayoutReady"
    />
    <Teleport to="#sidebar-target">
      <PackageInfo
        v-if="graph"
        ref="packageInfoRef"
        :graph="graph"
        :show-actions="showSwitchMode"
        :layout-running="graphViewerRef?.layoutRunning ?? true"
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
        {{ graphViewerRef?.layoutRunning ? 'Stop' : 'Start' }} layout
      </button>
      <button class="btn" type="button" @click="switchMode">Show 3D</button>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, reactive, markRaw, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import buildGraph, { buildGraphFromJson } from '../graphBuilder.js'
import getLocation from '../getLocation.js'
import { uploadedPackageJson, includeDevDeps } from '../uploadStore.js'
import { scanVulnerabilities } from '../vulnerabilities.js'
import GraphViewer from './GraphViewer.vue'
import PackageInfo from './PackageInfo.vue'

const route = useRoute()
const router = useRouter()

const graph = shallowRef(null)
const rootId = ref('')
const showProgress = ref(true)
const progress = ref(0)
const errors = reactive([])
const showSwitchMode = ref(false)
const highlightRequest = shallowRef(null)
const packageInfoRef = ref(null)
const graphViewerRef = ref(null)
const vulnMap = shallowRef(null)
const vulnScanning = ref(false)
const vulnProgress = ref('')

var pendingGraphBuilder = null

onMounted(() => {
  if (route.params.pkgId === '~upload') {
    if (!uploadedPackageJson.value) {
      router.replace('/')
      return
    }
    var pkg = uploadedPackageJson.value
    rootId.value = (pkg.name || 'uploaded-project') + '@' + (pkg.version || '0.0.0')
    pendingGraphBuilder = buildGraphFromJson(pkg, { includeDevDeps: includeDevDeps.value }, progressChanged)
  } else {
    rootId.value = route.params.pkgId
    pendingGraphBuilder = buildGraph(route.params.pkgId, route.params.version, progressChanged)
  }

  graph.value = markRaw(pendingGraphBuilder.graph)
})

function onLayoutReady() {
  if (!pendingGraphBuilder) return
  var graphBuilder = pendingGraphBuilder
  pendingGraphBuilder = null

  graphBuilder.start().then(function () {
    graphLoaded(graphBuilder.errors)
  })
}

function progressChanged(queueLength) {
  progress.value = queueLength
}

function graphLoaded(buildErrors) {
  showSwitchMode.value = true
  showProgress.value = false

  if (buildErrors && buildErrors.length) {
    errors.push.apply(errors, buildErrors)
  }

  if (packageInfoRef.value) {
    packageInfoRef.value.onGraphLoaded(graph.value)
  }

  // Start vulnerability scan
  vulnScanning.value = true
  scanVulnerabilities(graph.value, {
    onProgress: function (msg) { vulnProgress.value = msg }
  }).then(function (result) {
    vulnMap.value = result
    vulnScanning.value = false
    if (graphViewerRef.value) {
      graphViewerRef.value.applyVulnStates(result)
    }
    if (packageInfoRef.value) {
      packageInfoRef.value.onVulnDataLoaded(result)
    }
  }).catch(function () {
    vulnScanning.value = false
    vulnProgress.value = ''
  })
}

function onNodeSelected(node) {
  if (packageInfoRef.value) {
    packageInfoRef.value.onNodeSelected(node)
  }
}

function onHighlightNode(request) {
  highlightRequest.value = request
}

function toggleLayout() {
  if (graphViewerRef.value) {
    graphViewerRef.value.toggleLayout()
  }
}

function switchMode() {
  var path = getLocation(route.params, false)
  router.push(path)
}
</script>
