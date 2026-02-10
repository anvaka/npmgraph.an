export var SEVERITY_ORDER = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW']

export var SEVERITY_COLORS = {
  CRITICAL: '#DC5F65',
  HIGH: '#E8964F',
  MODERATE: '#E8D44F',
  LOW: '#A0A0B8'
}

function parseNodeId(nodeId) {
  var str = String(nodeId)
  var idx = str.lastIndexOf('@')
  if (idx <= 0) return { name: str, version: '' }
  return { name: str.substring(0, idx), version: str.substring(idx + 1) }
}

function normalizeSeverity(sev) {
  if (!sev) return 'MODERATE'
  var upper = sev.toUpperCase()
  if (upper === 'MEDIUM') return 'MODERATE'
  if (SEVERITY_ORDER.indexOf(upper) >= 0) return upper
  return 'MODERATE'
}

function chunk(arr, size) {
  var chunks = []
  for (var i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

export function scanVulnerabilities(graph, opts) {
  var onProgress = (opts && opts.onProgress) || function () {}

  var queries = []
  var nodeIds = []

  graph.forEachNode(function (node) {
    var parsed = parseNodeId(node.id)
    if (!parsed.version) return
    queries.push({ package: { name: parsed.name, ecosystem: 'npm' }, version: parsed.version })
    nodeIds.push(node.id)
  })

  if (queries.length === 0) return Promise.resolve(new Map())

  onProgress('Scanning vulnerabilities...')

  var batches = chunk(queries, 1000)
  var batchNodeIds = chunk(nodeIds, 1000)

  // Step 1: Query batch API for all packages
  return Promise.all(batches.map(function (batch, batchIdx) {
    return fetch('https://api.osv.dev/v1/querybatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries: batch })
    }).then(function (res) { return res.json() }).then(function (data) {
      return { results: data.results || [], nodeIds: batchNodeIds[batchIdx] }
    })
  })).then(function (batchResults) {
    // Collect unique vuln IDs and map them to nodeIds
    var vulnIdToNodes = {}
    var uniqueVulnIds = []

    batchResults.forEach(function (batch) {
      batch.results.forEach(function (result, i) {
        var nid = batch.nodeIds[i]
        if (!result || !result.vulns) return
        result.vulns.forEach(function (v) {
          if (!vulnIdToNodes[v.id]) {
            vulnIdToNodes[v.id] = []
            uniqueVulnIds.push(v.id)
          }
          vulnIdToNodes[v.id].push(nid)
        })
      })
    })

    if (uniqueVulnIds.length === 0) {
      onProgress('')
      return new Map()
    }

    onProgress('Fetching vulnerability details (' + uniqueVulnIds.length + ')...')

    // Step 2: Fetch details in parallel, 10 at a time
    var detailChunks = chunk(uniqueVulnIds, 10)
    var vulnDetails = {}

    return detailChunks.reduce(function (chain, ids) {
      return chain.then(function () {
        return Promise.all(ids.map(function (id) {
          return fetch('https://api.osv.dev/v1/vulns/' + encodeURIComponent(id))
            .then(function (res) { return res.json() })
            .then(function (detail) { vulnDetails[id] = detail })
            .catch(function () { /* skip failed fetches */ })
        }))
      })
    }, Promise.resolve()).then(function () {
      // Step 3: Build the result map
      var resultMap = new Map()

      uniqueVulnIds.forEach(function (vulnId) {
        var detail = vulnDetails[vulnId]
        if (!detail) return

        var severity = 'MODERATE'
        if (detail.database_specific && detail.database_specific.severity) {
          severity = normalizeSeverity(detail.database_specific.severity)
        }

        var affectedNodes = vulnIdToNodes[vulnId] || []

        affectedNodes.forEach(function (nid) {
          var parsed = parseNodeId(nid)
          var fixedVersion = null

          // Find fixed version for this specific package
          if (detail.affected) {
            detail.affected.forEach(function (aff) {
              if (aff.package && aff.package.name === parsed.name && aff.ranges) {
                aff.ranges.forEach(function (range) {
                  if (range.events) {
                    range.events.forEach(function (ev) {
                      if (ev.fixed) fixedVersion = ev.fixed
                    })
                  }
                })
              }
            })
          }

          var aliases = (detail.aliases || []).filter(function (a) { return a !== vulnId })
          var cwes = []
          if (detail.database_specific && detail.database_specific.cwe_ids) {
            cwes = detail.database_specific.cwe_ids
          }

          var info = {
            id: vulnId,
            summary: detail.summary || '',
            aliases: aliases,
            severityLabel: severity,
            color: SEVERITY_COLORS[severity] || SEVERITY_COLORS.MODERATE,
            fixedVersion: fixedVersion,
            cwes: cwes
          }

          var existing = resultMap.get(nid)
          if (!existing) {
            existing = []
            resultMap.set(nid, existing)
          }
          existing.push(info)
        })
      })

      onProgress('')
      return resultMap
    })
  })
}

export function getNodeSeverity(vulnMap, nodeId) {
  if (!vulnMap) return null
  var vulns = vulnMap.get(nodeId)
  if (!vulns || !vulns.length) return null

  var highest = SEVERITY_ORDER.length
  vulns.forEach(function (v) {
    var idx = SEVERITY_ORDER.indexOf(v.severityLabel)
    if (idx >= 0 && idx < highest) highest = idx
  })
  return highest < SEVERITY_ORDER.length ? SEVERITY_ORDER[highest] : null
}

export function getVulnSummary(vulnMap) {
  var counts = {}
  SEVERITY_ORDER.forEach(function (sev) {
    counts[sev] = { name: sev, count: 0, packages: [], color: SEVERITY_COLORS[sev], selected: false }
  })

  vulnMap.forEach(function (vulns, nodeId) {
    var severity = getNodeSeverity(vulnMap, nodeId)
    if (severity && counts[severity]) {
      counts[severity].count += 1
      counts[severity].packages.push(nodeId)
    }
  })

  return SEVERITY_ORDER.map(function (sev) { return counts[sev] }).filter(function (r) { return r.count > 0 })
}
