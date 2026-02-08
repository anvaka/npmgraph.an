import { registryUrl } from './config.js'

var cache = Object.create(null)

function escapeName(name) {
  // scoped packages need slash url-encoded for the registry, e.g. @foo%2Fbar
  return name && name.replace('/', '%2f')
}

export default function getPackageVersions(packageName) {
  var cached = cache[packageName]
  if (cached) {
    return Promise.resolve(cached)
  }

  var escapedName = escapeName(packageName)
  if (!escapedName) {
    throw new Error('Could not escape ' + packageName)
  }

  return fetch(registryUrl + escapedName)
    .then(function (r) { return r.json() })
    .then(function (data) {
      var versions = Object.keys(data.versions)
      cache[packageName] = versions
      return versions
    })
}
