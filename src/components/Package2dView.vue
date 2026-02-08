<template>
  <div class="full">
    <GraphViewer
      v-if="graph"
      :graph="graph"
      :root-id="rootId"
      :highlight-request="highlightRequest"
      @node-selected="onNodeSelected"
    />
    <PackageInfo
      v-if="graph"
      ref="packageInfoRef"
      :graph="graph"
      @highlight-node="onHighlightNode"
    />

    <div v-if="showError" class="failed">
      <h4>{{ error }}</h4>
      <pre>{{ errorData }}</pre>
    </div>

    <div v-if="showProgress" class="graph-progress">
      <h4>Remaining packages: <span>{{ progress }}</span></h4>
    </div>

    <div v-if="showSwitchMode" class="switchMode d2d">
      <button class="btn" type="button" @click="switchMode">Show 3D</button>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, markRaw, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import buildGraph from '../graphBuilder.js'
import getLocation from '../getLocation.js'
import GraphViewer from './GraphViewer.vue'
import PackageInfo from './PackageInfo.vue'

const route = useRoute()
const router = useRouter()

const graph = shallowRef(null)
const rootId = ref('')
const showProgress = ref(true)
const progress = ref(0)
const showError = ref(false)
const error = ref('')
const errorData = ref('')
const showSwitchMode = ref(false)
const highlightRequest = shallowRef(null)
const packageInfoRef = ref(null)

onMounted(() => {
  rootId.value = route.params.pkgId

  var graphBuilder = buildGraph(
    route.params.pkgId,
    route.params.version,
    progressChanged
  )

  graph.value = markRaw(graphBuilder.graph)

  graphBuilder.start
    .then(graphLoaded)
    .catch(errorOccurred)
})

function progressChanged(queueLength) {
  progress.value = queueLength
}

function errorOccurred(err) {
  showError.value = true
  showProgress.value = false

  if (err.status) {
    error.value = 'error: ' + err.status
    errorData.value = JSON.stringify({
      url: err.config && err.config.url,
      method: err.config && err.config.method
    }, null, 2)
  } else {
    error.value = 'Error'
    errorData.value = JSON.stringify({ message: err.message }, null, 2)
  }
}

function graphLoaded() {
  showSwitchMode.value = true
  showProgress.value = false
  if (packageInfoRef.value) {
    packageInfoRef.value.onGraphLoaded(graph.value)
  }
}

function onNodeSelected(node) {
  if (packageInfoRef.value) {
    packageInfoRef.value.onNodeSelected(node)
  }
}

function onHighlightNode(request) {
  highlightRequest.value = request
}

function switchMode() {
  var path = getLocation(route.params, false)
  router.push(path)
}
</script>
