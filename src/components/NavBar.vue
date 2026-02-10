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
          <button class="btn" type="submit">visualize</button>
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

    <div
      class="upload-zone"
      :class="{ 'has-file': uploadedPackageJson }"
      @click="triggerFileInput"
    >
      <template v-if="!uploadedPackageJson">
        <span class="upload-prompt">or drop <strong>package.json</strong> to graph local dependencies</span>
      </template>
      <template v-else>
        <div class="staged-info">
          <button class="staged-close" type="button" @click.stop="clearStaged">&times;</button>
          <div class="staged-name">{{ uploadedPackageJson.name || 'uploaded-project' }}</div>
          <label class="dev-deps-toggle" @click.stop>
            <input type="checkbox" v-model="devDeps"> include devDependencies
          </label>
        </div>
      </template>
      <input ref="fileInput" type="file" accept=".json" hidden @change="onFileSelect">
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { autoCompleteUrl } from '../config.js'
import { uploadedPackageJson, includeDevDeps, handleDroppedFile } from '../uploadStore.js'

const router = useRouter()
const route = useRoute()

const query = ref('')
const suggestions = ref([])
const activeIndex = ref(-1)
const inputEl = ref(null)
const fileInput = ref(null)
const devDeps = ref(includeDevDeps.value)

let debounceTimer = null

function syncQueryFromRoute() {
  const path = route.path
  if (path) {
    const pathParts = path.match(/\/view\/[23]d\/([^/]+)\/?/)
    if (pathParts) {
      var pkgId = decodeURIComponent(pathParts[1] || '')
      if (pkgId === '~upload') {
        query.value = uploadedPackageJson.value
          ? (uploadedPackageJson.value.name || 'uploaded-project')
          : ''
      } else {
        query.value = pkgId
      }
    }
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
    suggestions.value = []
    activeIndex.value = -1
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
  clearStaged()
  var encodedName = encodeURIComponent(name)
  if (route.path.indexOf('/view/3d/') !== -1) {
    router.push('/view/3d/' + encodedName)
  } else {
    router.push('/view/2d/' + encodedName)
  }
}

function triggerFileInput() {
  if (!uploadedPackageJson.value) {
    fileInput.value.click()
  }
}

function onFileSelect(event) {
  handleDroppedFile(event.target.files[0])
  event.target.value = ''
}

function navigateToUpload() {
  if (!uploadedPackageJson.value) return

  includeDevDeps.value = devDeps.value
  query.value = uploadedPackageJson.value.name || 'uploaded-project'
  suggestions.value = []

  var uploadPath = route.path.indexOf('/view/3d/') !== -1
    ? '/view/3d/~upload'
    : '/view/2d/~upload'

  if (route.params.pkgId === '~upload') {
    router.replace('/').then(function () {
      router.replace(uploadPath)
    })
  } else {
    router.push(uploadPath)
  }
}

// Auto-visualize when a file is uploaded (from drop or file picker)
watch(uploadedPackageJson, function (val) {
  if (val) navigateToUpload()
})

// Auto-re-visualize when devDeps toggle changes
watch(devDeps, function () {
  if (uploadedPackageJson.value) navigateToUpload()
})

function clearStaged() {
  uploadedPackageJson.value = null
  devDeps.value = false
}
</script>
