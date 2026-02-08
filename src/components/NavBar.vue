<template>
  <div class="navbar-component">
    <form class="search" role="search" @submit.prevent="submitPackage">
      <div class="input-group typeahead-container">
        <input
          ref="inputEl"
          v-model="query"
          type="text"
          autofocus
          class="form-control no-shadow"
          placeholder="npm package (e.g. browserify)"
          @input="onInput"
          @keydown.down.prevent="moveDown"
          @keydown.up.prevent="moveUp"
          @keydown.enter.prevent="selectCurrent"
          @keydown.escape="closeSuggestions"
        >
        <span class="input-group-btn">
          <button class="btn" type="submit">show</button>
        </span>
        <ul v-if="suggestions.length > 0">
          <li
            v-for="(pkg, index) in suggestions"
            :key="pkg.id"
            :class="{ active: index === activeIndex }"
          >
            <a @mousedown.prevent="selectPackage(pkg)">
              <strong>{{ pkg.id }}</strong>
              <small>{{ pkg.description }}</small>
            </a>
          </li>
        </ul>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { autoCompleteUrl } from '../config.js'

const router = useRouter()
const route = useRoute()

const query = ref('')
const suggestions = ref([])
const activeIndex = ref(-1)
const inputEl = ref(null)

let debounceTimer = null

function syncQueryFromRoute() {
  const path = route.path
  if (path) {
    const pathParts = path.match(/\/view\/[23]d\/([^/]+)\/?/)
    if (pathParts) query.value = decodeURIComponent(pathParts[1] || '')
  }
}

syncQueryFromRoute()
watch(() => route.path, syncQueryFromRoute)

function onInput() {
  clearTimeout(debounceTimer)
  activeIndex.value = -1
  debounceTimer = setTimeout(fetchSuggestions, 250)
}

function fetchSuggestions() {
  const val = query.value.trim()
  if (!val) {
    suggestions.value = []
    return
  }

  if (val.match(/^https?:\/\//)) {
    suggestions.value = [{ id: val, description: '' }]
    return
  }

  if (val.length < 2) {
    suggestions.value = []
    return
  }

  fetch(autoCompleteUrl + '&text=' + encodeURIComponent(val))
    .then(function (r) { return r.json() })
    .then(function (data) {
      suggestions.value = (data.objects || []).map(function (pkg) {
        return {
          id: pkg.package.name,
          description: pkg.package.description
        }
      })
    })
    .catch(function () {
      suggestions.value = []
    })
}

function moveDown() {
  if (activeIndex.value < suggestions.value.length - 1) {
    activeIndex.value++
  }
}

function moveUp() {
  if (activeIndex.value > 0) {
    activeIndex.value--
  }
}

function selectCurrent() {
  if (activeIndex.value >= 0 && activeIndex.value < suggestions.value.length) {
    selectPackage(suggestions.value[activeIndex.value])
  } else if (query.value.trim()) {
    navigateToPackage(query.value.trim())
  }
}

function selectPackage(pkg) {
  query.value = pkg.id
  suggestions.value = []
  activeIndex.value = -1
  navigateToPackage(pkg.id)
}

function submitPackage() {
  if (query.value.trim()) {
    suggestions.value = []
    navigateToPackage(query.value.trim())
  }
}

function closeSuggestions() {
  suggestions.value = []
  activeIndex.value = -1
}

function navigateToPackage(name) {
  var encodedName = encodeURIComponent(name)
  if (route.path.indexOf('/view/3d/') !== -1) {
    router.push('/view/3d/' + encodedName)
  } else {
    router.push('/view/2d/' + encodedName)
  }
}
</script>
