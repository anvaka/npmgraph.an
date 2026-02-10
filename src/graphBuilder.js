import createGraph from 'ngraph.graph'
import semver from 'semver'
import { registryUrl } from './config.js'

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

  var availableVersions = Object.keys(packageJson.versions)
  var version = semver.maxSatisfying(availableVersions, versionString, true)

  if (!version && versionString === '*' && availableVersions.every(function (av) {
    return new semver.SemVer(av, true).prerelease.length
  })) {
    version = packageJson['dist-tags'] && packageJson['dist-tags'].latest
  }

  if (!version) throw Error('could not find a satisfactory version for string ' + versionString)
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
  var cached = ctx.cache[cacheKey]
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

  return httpGet(registryUrl + escapedName).then(function (data) {
    ctx.cache[cacheKey] = data
    return data
  })
}

function processQueue(ctx) {
  if (typeof ctx.changed === 'function') {
    ctx.changed(ctx.queue.length)
  }

  var work = ctx.queue.pop()
  if (!work) return Promise.resolve(ctx.graph)

  return fetchPackageData(ctx, work)
    .then(function (data) {
      traverseDependencies(ctx, work, data)
    })
    .catch(function (err) {
      ctx.errors.push({ name: work.name, version: work.version, message: err.message })
    })
    .then(function () {
      return processQueue(ctx)
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

export default function buildGraph(pkgName, version, changed) {
  var ctx = {
    graph: createGraph(),
    cache: Object.create(null),
    queue: [],
    processed: Object.create(null),
    errors: [],
    changed: changed
  }

  if (!version) version = 'latest'

  ctx.queue.push({ name: pkgName, version: version, parent: null })

  return {
    graph: ctx.graph,
    start: function () { return processQueue(ctx) },
    errors: ctx.errors
  }
}

export function buildGraphFromJson(packageJson, options, changed) {
  var ctx = {
    graph: createGraph(),
    cache: Object.create(null),
    queue: [],
    processed: Object.create(null),
    errors: [],
    changed: changed
  }

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

  return {
    graph: ctx.graph,
    start: function () { return processQueue(ctx) },
    errors: ctx.errors
  }
}
