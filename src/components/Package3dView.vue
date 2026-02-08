<template>
  <div class="full">
    <div ref="container" class="graphView"></div>
    <div v-if="canSwitchMode" class="switchMode">
      <button class="btn" type="button" @click="switchMode">Show 2D</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import buildGraph from '../graphBuilder.js'
import getLocation from '../getLocation.js'

const route = useRoute()
const router = useRouter()

const container = ref(null)
const canSwitchMode = ref(false)
let renderer3d = null

onMounted(() => {
  var graphBuilder = buildGraph(route.params.pkgId, route.params.version)

  graphBuilder.start.then(function () {
    canSwitchMode.value = true
  })

  var graph = graphBuilder.graph

  import('../renderer3d.js').then(function (module) {
    var create3DRenderer = module.default
    renderer3d = create3DRenderer(graph, container.value)
    renderer3d.run()
  })
})

onUnmounted(() => {
  if (renderer3d) {
    renderer3d.dispose()
    renderer3d = null
  }
})

function switchMode() {
  var path = getLocation(route.params, true)
  router.push(path)
}
</script>
