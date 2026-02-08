<template>
  <div
    class="full"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <router-view class="full" :key="$route.fullPath" />
    <div class="left-panel">
      <NavBar />
      <div id="sidebar-target" class="sidebar-target"></div>
    </div>
    <div class="share">
      <p><a href="https://github.com/anvaka/npmgraph.an">view source code</a></p>
      <p><a href="#" @click.prevent="shareTwitter">share to twitter</a></p>
      <p><a href="https://www.patreon.com/anvaka" target="_blank">become a patron</a></p>
    </div>
    <div v-if="isDragOver" class="drop-overlay">
      <div class="drop-overlay-text">Drop <strong>package.json</strong> to graph dependencies</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import NavBar from './components/NavBar.vue'
import { handleDroppedFile } from './uploadStore.js'

var isDragOver = ref(false)
var dragLeaveTimer = null

function onDragOver() {
  clearTimeout(dragLeaveTimer)
  isDragOver.value = true
}

function onDragLeave() {
  clearTimeout(dragLeaveTimer)
  dragLeaveTimer = setTimeout(function () {
    isDragOver.value = false
  }, 50)
}

function onDrop(event) {
  isDragOver.value = false
  var file = event.dataTransfer.files[0]
  if (file) handleDroppedFile(file)
}

function shareTwitter() {
  const url = encodeURIComponent(window.location.href)
  const twitterUrl = 'https://twitter.com/intent/tweet?url=' + decodeURIComponent(url).replace(/#/g, '%23')
  window.open(twitterUrl, 'Sharetwitter', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=420,width=600')
}
</script>
