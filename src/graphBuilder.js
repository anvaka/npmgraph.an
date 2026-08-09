import createGraph from 'ngraph.graph'
import semver from 'semver'
import { registryUrl } from './config.js'

// How many registry requests may be in flight at once. The graph builder used
// to fetch one packument at a time, making the build time O(packages * RTT).
// With a small pool the build becomes network-throughput bound instead.
var MAX_PARALLEL_REQUESTS = 12

// Session-wide packument cache, shared across graph builds. Switching between
// 2D/3D views, changing a version, or revisiting a package no longer hits the
// network again. Bounded with simple LRU eviction so multi-megabyte packuments
// don't accumulate without limit.
var MAX_CACHE_ENTRIES = 200
var packumentCache = new Map()

// Packuments currently being fetched, keyed like packumentCache. When several
// queued work items need the same package (very common in diamond-shaped
// dependency trees) they all share a single HTTP request.
var pendingRequests = new Map()

// guessVersion() memoization keyed by packument object. semver.maxSatisfying
// sorts the full version list, and it used to run once per incoming dependency
// edge (i.e. hundreds of times for popular packages).
var resolvedVersionsByPackument = new WeakMap()

function cacheGet(key) {
  var value = packumentCache.get(key)
  if (value !== undefined) {
    // LRU touch
    packumentCache.delete(key)
    packumentCache.set(key, value)
  }
  return value
}

function cacheSet(key, value) {
  packumentCache.delete(key)
  packumentCache.set(key, value)
  if (packumentCache.size > MAX_CACHE_ENTRIES) {
    packumentCache.delete(packumentCache.keys().next().value)
  }
  return value
}

function httpGet(url) {
  return fetch(url).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url)
    return r.json()
  })
}

function escapeName(name) {
  return name && name.replace('/', '%2f')
}

function guessVersion(versionString, packageJson) {
  if (versionString === 'latest') versionString = '*'

  var memo = resolvedVersionsByPackument.get(packageJson)
  if (memo === undefined) {
    memo = Object.create(null)
    resolvedVersionsByPackument.set(packageJson, memo)
  } else if (Object.prototype.hasOwnProperty.call(memo, versionString)) {
    return memo[versionString]
  }

  var availableVersions = Object.keys(packageJson.versions)
  var version = semver.maxSatisfying(availableVersions, versionString, true)

  if (!version && versionString === '*' && availableVersions.every(function (av) {
    return new semver.SemVer(av, true).prerelease.length
  })) {
    version = packageJson['dist-tags'] && packageJson['dist-tags'].latest
  }

  if (!version) throw Error('could not find a satisfactory version for string ' + versionString)
  memo[versionString] = version
  return version
}

function isRemote(version) {
  return typeof version === 'string' && (
    version.indexOf('git') === 0 ||
    version.indexOf('http') === 0 ||
    version.indexOf('file') === 0 ||
    version.indexOf('github:') === 0 ||
    version.indexOf('bitbucket:') === 0 ||
    version.indexOf('gitlab:') === 0 ||
    version.indexOf('/') !== -1 // GitHub shorthand: user/repo or user/repo#ref
  )
}

function isHttp(name) {
  return typeof name === 'string' && name.match(/^https?:\/\//)
}

function fetchPackageData(ctx, work) {
  var cacheKey = isRemote(work.version) ? work.name + work.version : work.name

  var cached = cacheGet(cacheKey)
  if (cached) return Promise.resolve(cached)

  if (isRemote(work.version)) return Promise.resolve({})

  var escapedName = escapeName(work.name)
  if (!escapedName && isHttp(work.name)) {
    return httpGet(work.name).then(function (pkgJSON) {
      pkgJSON._id = pkgJSON.name + '@' + pkgJSON.version
      var versions = {}
      versions[pkgJSON.version] = pkgJSON
      return { versions: versions }
    })
  }

  if (!escapedName) {
    return Promise.reject(new Error('Escaped name is missing for ' + work.name))
  }

  var pending = pendingRequests.get(cacheKey)
  if (pending) return pending

  var request = httpGet(registryUrl + escapedName).then(function (data) {
    pendingRequests.delete(cacheKey)
    return cacheSet(cacheKey, data)
  }, function (err) {
    pendingRequests.delete(cacheKey)
    throw err
  })
  pendingRequests.set(cacheKey, request)
  return request
}

function notifyChanged(ctx) {
  if (typeof ctx.changed === 'function') {
    ctx.changed(ctx.queue.length)
  }
}

function processQueue(ctx) {
  notifyChanged(ctx)

  return new Promise(function (resolve) {
    // Tops up the in-flight pool and detects termination. Called once to kick
    // off, then again every time a request settles.
    function schedule() {
      if (ctx.queue.length === 0 || ctx.cancelled) {
        if (ctx.inFlight === 0 || ctx.cancelled) {
          resolve(ctx.graph)
          return
        }
        return
      }
      while (ctx.inFlight < MAX_PARALLEL_REQUESTS && ctx.queue.length > 0) {
        launch(ctx.queue.pop())
      }
    }

    function launch(work) {
      ctx.inFlight += 1
      fetchPackageData(ctx, work)
        .then(function (data) {
          if (!ctx.cancelled) traverseDependencies(ctx, work, data)
        })
        .catch(function (err) {
          if (!ctx.cancelled) {
            ctx.errors.push({ name: work.name, version: work.version, message: err.message })
          }
        })
        .then(function () {
          ctx.inFlight -= 1
          if (!ctx.cancelled) notifyChanged(ctx)
          schedule()
        })
    }

    schedule()
  })
}

function traverseDependencies(ctx, work, packageJson) {
  var version, pkg, id

  if (isRemote(work.version)) {
    version = ''
    pkg = packageJson
    id = work.version
  } else {
    version = guessVersion(work.version, packageJson)
    pkg = packageJson.versions[version]
    id = pkg._id
  }

  var dependencies = pkg.dependencies

  ctx.graph.beginUpdate()
  ctx.graph.addNode(id, pkg)

  if (work.parent && !ctx.graph.hasLink(work.parent, id)) {
    ctx.graph.addLink(work.parent, id)
  }
  ctx.graph.endUpdate()

  if (ctx.processed[id]) return
  ctx.processed[id] = true

  if (dependencies) {
    Object.keys(dependencies).forEach(function (name) {
      ctx.queue.push({
        name: name,
        version: dependencies[name],
        parent: id
      })
    })
  }
}

export function parsePackageId(pkgId) {
  var idx = pkgId.indexOf('@', pkgId.charAt(0) === '@' ? 1 : 0)
  if (idx > 0) {
    return { name: pkgId.slice(0, idx), version: pkgId.slice(idx + 1) }
  }
  return { name: pkgId, version: '' }
}

function createBuildContext(changed) {
  return {
    graph: createGraph(),
    queue: [],
    processed: Object.create(null),
    errors: [],
    changed: changed,
    inFlight: 0,
    cancelled: false
  }
}

function builderApi(ctx) {
  return {
    graph: ctx.graph,
    start: function () { return processQueue(ctx) },
    // Stops picking up new work (in-flight requests still settle, warming the
    // shared cache). Used when navigating away mid-build.
    cancel: function () { ctx.cancelled = true },
    errors: ctx.errors
  }
}

export default function buildGraph(pkgName, version, changed) {
  var ctx = createBuildContext(changed)

  if (!version) version = 'latest'

  ctx.queue.push({ name: pkgName, version: version, parent: null })

  return builderApi(ctx)
}

export function buildGraphFromJson(packageJson, options, changed) {
  var ctx = createBuildContext(changed)

  var name = packageJson.name || 'uploaded-project'
  var version = packageJson.version || '0.0.0'
  var id = name + '@' + version

  ctx.graph.addNode(id, packageJson)
  ctx.processed[id] = true

  var deps = Object.assign({}, packageJson.dependencies)
  if (options && options.includeDevDeps) {
    Object.assign(deps, packageJson.devDependencies)
  }

  Object.keys(deps).forEach(function (depName) {
    ctx.queue.push({ name: depName, version: deps[depName], parent: id })
  })

  return builderApi(ctx)
}
