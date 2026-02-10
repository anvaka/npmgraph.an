<template>
  <div v-show="graphLoaded" ref="infoBoxEl" class="infoBox" :class="{ 'responsive-open': responsiveOpen }">
    <a href="#" class="hide-info-box" @click.prevent="responsiveOpen = false">show graph</a>
    <div class="header">
      <a href="#" :class="{ selected: packageInfoVisible }" @click.prevent="switchInfoMode('package', true)">package info</a>
      <span v-if="showActions" class="infoBox-actions">
        <a href="#" @click.prevent="$emit('toggle-layout')">{{ layoutRunning ? 'pause' : 'resume' }}</a>
        <a href="#" @click.prevent="$emit('switch-mode')">3d</a>
      </span>
      <a href="#" :class="{ selected: graphInfoVisible }" class="last" @click.prevent="switchInfoMode('graph', true)">graph info</a>
      <div class="clearfix"></div>
    </div>
    <hr class="divider">

    <div v-show="packageInfoVisible" class="packageInfo">
      <div v-if="selectedPackage && selectedPackage.name">
        <a :href="'https://npmjs.org/package/' + selectedPackage.name">{{ selectedPackage.name }}</a>
        <span v-if="!versions" class="version" title="version">{{ selectedPackage.version }}</span>
        <span v-if="versions" class="version" title="version">
          <select v-model="selectedVersion" @change="renderUpdatedVersion">
            <option v-for="v in versions" :key="v" :value="v">{{ v }}</option>
          </select>
        </span>
        <p class="description">{{ selectedPackage.description }}</p>
        <pre class="sh sh_sourceCode"><code>npm install {{ selectedPackage.name }}</code><button class="copy-btn" title="Copy to clipboard" @click="copyInstallCommand(selectedPackage.name)">{{ copyLabel }}</button></pre>
        <div class="maintainers">
          <h4>maintainers</h4>
          <div class="maintainersContainer">
            <div v-for="maintainer in nodeMaintainers" :key="maintainer.email" class="maintainerBox">
              <a :href="maintainer.profile" target="_blank">
                <img :src="maintainer.avatar">
              </a>
            </div>
          </div>
          <div class="clearfix"></div>
        </div>
        <div v-if="nodeVulns.length" class="node-vulnerabilities">
          <h4>vulnerabilities</h4>
          <div v-for="vuln in nodeVulns" :key="vuln.id" class="vuln-item">
            <div class="vuln-header">
              <span class="vuln-severity" :style="{ background: vuln.color }">{{ vuln.severityLabel }}</span>
              <a :href="'https://osv.dev/vulnerability/' + vuln.id" target="_blank">{{ vuln.id }}</a>
            </div>
            <div v-if="vuln.summary" class="vuln-summary">{{ vuln.summary }}</div>
            <div v-if="vuln.aliases.length" class="vuln-aliases">{{ vuln.aliases.join(', ') }}</div>
            <div v-if="vuln.fixedVersion" class="vuln-fix">Fixed in: {{ vuln.fixedVersion }}</div>
          </div>
        </div>
      </div>
      <div v-else-if="selectedPackage">
        <h4>Remote dependency</h4>
        <pre class="sh sh_sourceCode"><code>npm install {{ selectedPackage.id }}</code><button class="copy-btn" title="Copy to clipboard" @click="copyInstallCommand(selectedPackage.id)">{{ copyLabel }}</button></pre>
      </div>
    </div>

    <div v-show="graphInfoVisible" class="graphInfo">
      <div class="nodes">
        <p># of nodes</p>
        <p class="number">{{ nodesCount }}</p>
      </div>
      <div class="links">
        <p># of links</p>
        <p class="number">{{ linksCount }}</p>
      </div>
      <div class="clearfix"></div>
      <hr>
      <div class="all-maintainers">
        <h4>maintainers</h4>
        <div class="maintainersContainer">
          <div
            v-for="maintainer in allMaintainers"
            :key="maintainer.email"
            class="maintainerBox"
            :class="{ selected: maintainer.selected }"
            @click="highlightNodes(maintainer, $event)"
          >
            <a :href="maintainer.profile" target="_blank">
              <img
                :src="maintainer.avatar"
                @mouseenter="maintainer.countVisible = true"
                @mouseleave="maintainer.countVisible = false"
              >
            </a>
            <span v-show="maintainer.countVisible" class="packagesCount">
              x {{ maintainer.count }}
            </span>
            <div class="border"></div>
          </div>
        </div>
        <div class="clearfix"></div>
      </div>
      <hr>
      <div class="all-licenses">
        <h4>licenses</h4>
        <div class="license-container">
          <a
            v-for="license in allLicenses"
            :key="license.name"
            class="license-row"
            href="#"
            :class="{ selected: license.selected }"
            @click.prevent="highlightNodes(license, $event)"
          >
            <span>{{ license.name }}</span>
            <span class="last">{{ license.count }}</span>
          </a>
        </div>
        <div class="clearfix"></div>
      </div>
      <div class="all-licenses">
        <h4>names</h4>
        <div class="license-container">
          <a
            v-for="name in allNames"
            :key="name.name"
            class="license-row"
            href="#"
            :class="{ selected: name.selected }"
            @click.prevent="highlightNodes(name, $event)"
          >
            <span>{{ name.name }}</span>
            <span class="last">{{ name.count }}</span>
          </a>
        </div>
        <div class="clearfix"></div>
      </div>
      <div v-if="vulnMap">
        <hr>
        <div class="all-licenses">
          <h4>vulnerabilities</h4>
          <div v-if="allVulnerabilities.length" class="license-container">
            <a
              v-for="sev in allVulnerabilities"
              :key="sev.name"
              class="license-row"
              href="#"
              :class="{ selected: sev.selected }"
              @click.prevent="highlightNodes(sev, $event)"
            >
              <span :style="{ color: sev.color }">{{ sev.name }}</span>
              <span class="last">{{ sev.count }}</span>
            </a>
          </div>
          <p v-else class="no-vulns">No known vulnerabilities found</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import toGravatar from '../toGravatar.js'
import getPackageVersions from '../getPackageVersions.js'
import getLocation from '../getLocation.js'
import getAllLicenses from '../licenses.js'
import getAllMaintainers from '../maintainers.js'
import getAllNames from '../names.js'
import { getVulnSummary } from '../vulnerabilities.js'

const props = defineProps({
  graph: { type: Object, required: true },
  showActions: { type: Boolean, default: false },
  layoutRunning: { type: Boolean, default: true },
  vulnMap: { type: Object, default: null }
})

const emit = defineEmits(['highlight-node', 'toggle-layout', 'switch-mode'])

const route = useRoute()
const router = useRouter()

const infoBoxEl = ref(null)
const graphLoaded = ref(false)
const packageInfoVisible = ref(true)
const graphInfoVisible = ref(false)
const responsiveOpen = ref(false)

watch(responsiveOpen, (open) => {
  if (!open && infoBoxEl.value) {
    infoBoxEl.value.scrollTop = 0
  }
})

watch(() => props.vulnMap, (vulnMap) => {
  if (vulnMap && selectedNodeId) {
    nodeVulns.value = vulnMap.get(selectedNodeId) || []
  }
})

const selectedPackage = ref(null)
const nodeMaintainers = ref([])
const versions = ref(null)
const selectedVersion = ref('')

const nodesCount = ref(0)
const linksCount = ref(0)
const allMaintainers = ref([])
const allLicenses = ref([])
const allNames = ref([])

const copyLabel = ref('copy')
let copyTimer = null
let selectedLicenseRecord = null

const allVulnerabilities = ref([])
const totalVulnCount = ref(0)
const nodeVulns = ref([])
let selectedNodeId = null

function onNodeSelected(node) {
  if (!node) return
  selectNode(node)
  switchInfoMode('package', false)
}

function onGraphLoaded(graph) {
  linksCount.value = graph.getLinksCount()
  nodesCount.value = graph.getNodesCount()
  graphLoaded.value = true

  allMaintainers.value = getAllMaintainers(graph)
  allLicenses.value = getAllLicenses(graph)
  allNames.value = getAllNames(graph)

  selectNode(graph.root)
  switchInfoMode('graph', false)
}

function selectNode(node) {
  var data = node.data
  if (data && !('name' in data)) {
    data = { id: node.id, remote: true }
  }

  selectedPackage.value = data
  selectedNodeId = node.id
  versions.value = null

  if (data.maintainers && data.maintainers.length) {
    nodeMaintainers.value = data.maintainers.map(toGravatar)
  } else {
    nodeMaintainers.value = []
  }

  if (!data.remote) {
    var name = data.name
    getPackageVersions(name).then(function (v) {
      if (v && selectedPackage.value && selectedPackage.value.name === name) {
        versions.value = v
        selectedVersion.value = data.version
      }
    })
  }

  // Look up vulnerabilities for this node
  if (props.vulnMap) {
    nodeVulns.value = props.vulnMap.get(node.id) || []
  } else {
    nodeVulns.value = []
  }
}

function onVulnDataLoaded(vulnMap) {
  allVulnerabilities.value = getVulnSummary(vulnMap)
  totalVulnCount.value = 0
  allVulnerabilities.value.forEach(function (r) { totalVulnCount.value += r.count })

  // Update nodeVulns for current selection
  if (selectedNodeId && vulnMap) {
    nodeVulns.value = vulnMap.get(selectedNodeId) || []
  }
}

function switchInfoMode(mode, fromUser) {
  packageInfoVisible.value = mode === 'package'
  graphInfoVisible.value = mode === 'graph'
  responsiveOpen.value = !!fromUser
}

function renderUpdatedVersion() {
  var path = getLocation(
    route.params,
    true,
    selectedVersion.value,
    selectedPackage.value.name
  )
  router.push(path)
}

function highlightNodes(record, e) {
  e.preventDefault()

  emit('highlight-node', {
    color: '#52CCE3',
    ids: record.packages
  })

  if (selectedLicenseRecord) selectedLicenseRecord.selected = false
  selectedLicenseRecord = record
  if (selectedLicenseRecord) selectedLicenseRecord.selected = true

  responsiveOpen.value = false
}

function copyInstallCommand(name) {
  navigator.clipboard.writeText('npm install ' + name).then(function () {
    copyLabel.value = 'copied!'
    clearTimeout(copyTimer)
    copyTimer = setTimeout(function () { copyLabel.value = 'copy' }, 1500)
  })
}

defineExpose({ onNodeSelected, onGraphLoaded, onVulnDataLoaded })
</script>
