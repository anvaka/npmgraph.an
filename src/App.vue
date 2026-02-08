<template>
  <div class="full">
    <router-view class="full" :key="$route.fullPath" />
    <NavBar />
    <div class="share">
      <p><a href="https://github.com/anvaka/npmgraph.an">view source code</a></p>
      <p><a href="#" @click.prevent="shareTwitter">share to twitter</a></p>
      <p><a href="https://www.patreon.com/anvaka" target="_blank">become a patron</a></p>
    </div>
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'

function shareTwitter() {
  const url = encodeURIComponent(window.location.href)
  const twitterUrl = 'https://twitter.com/intent/tweet?url=' + decodeURIComponent(url).replace(/#/g, '%23')
  window.open(twitterUrl, 'Sharetwitter', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=420,width=600')
}
</script>
