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
    version.indexOf('file') === 0
  )
}

function isHttp(name) {
  return typeof name === 'string' && name.match(/^https?:\/\//)
}

export default function buildGraph(pkgName, version, changed) {
  var graph = createGraph({ uniqueLinkId: false })
  var cache = Object.create(null)
  var queue = []
  var processed = Object.create(null)

  if (!version) version = 'latest'

  queue.push({ name: pkgName, version: version, parent: null })

  var promise = processQueue()

  return {
    graph: graph,
    start: promise
  }

  function processQueue() {
    if (typeof changed === 'function') {
      changed(queue.length)
    }

    var work = queue.pop()
    if (!work) return Promise.resolve(graph)

    var cacheKey = isRemote(work.version) ? work.name + work.version : work.name
    var cached = cache[cacheKey]
    if (cached) {
      return Promise.resolve(processResponse(work, cached))
    }

    if (isRemote(work.version)) {
      return Promise.resolve(processResponse(work, {}))
    }

    var escapedName = escapeName(work.name)
    if (!escapedName && isHttp(work.name)) {
      return httpGet(work.name).then(function (pkgJSON) {
        pkgJSON._id = pkgJSON.name + '@' + pkgJSON.version
        var versions = {}
        versions[pkgJSON.version] = pkgJSON
        var data = { versions: versions }
        return processResponse(work, data)
      })
    }

    if (!escapedName) {
      throw new Error('Escaped name is missing for ' + work.name)
    }

    return httpGet(registryUrl + escapedName).then(function (data) {
      cache[cacheKey] = data
      return processResponse(work, data)
    })
  }

  function processResponse(work, packageJson) {
    traverseDependencies(work, packageJson)

    if (queue.length) {
      return processQueue()
    }

    return graph
  }

  function traverseDependencies(work, packageJson) {
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

    graph.beginUpdate()
    graph.addNode(id, pkg)

    if (work.parent && !graph.hasLink(work.parent, id)) {
      graph.addLink(work.parent, id)
    }
    graph.endUpdate()

    if (processed[id]) return
    processed[id] = true

    if (dependencies) {
      Object.keys(dependencies).forEach(function (name) {
        queue.push({
          name: name,
          version: dependencies[name],
          parent: id
        })
      })
    }
  }
}
