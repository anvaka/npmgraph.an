export default function getLocation(routeParams, is2d, newVersion, newPackageName) {
  var packageName = newPackageName || routeParams.pkgId
  var version = newVersion || routeParams.version || ''
  var mode = is2d ? '2d' : '3d'
  var path = '/view/' + mode + '/' + packageName
  if (version) {
    path += '/' + version
  }
  return path
}
