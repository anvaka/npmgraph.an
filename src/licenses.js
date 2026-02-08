export default function getAllLicenses(graph) {
  var histogram = {}
  var licenses = []

  graph.forEachNode(countNode)

  return licenses.sort(byCount)

  function countNode(node) { forEachLicense(node, countLicense) }

  function countLicense(license, node) {
    var record = histogram[license]
    if (!record) {
      record = histogram[license] = {}
      record.name = license
      record.count = 0
      record.packages = []
      licenses.push(record)
    }
    record.count += 1
    record.packages.push(node.id)
  }

  function byCount(x, y) {
    return y.count - x.count
  }
}

function forEachLicense(node, callback) {
  var license = 'unspecified'
  var pkg = node.data
  var fromLicenseField = getFromLicenseField(pkg.license)

  if (fromLicenseField) {
    license = fromLicenseField
    callback(license, node)
  } else if (pkg.licenses) {
    if (typeof pkg.licenses === 'string') {
      callback(pkg.licenses, node)
    } else if (pkg.licenses.length) {
      for (var i = 0; i < pkg.licenses.length; ++i) {
        fromLicenseField = getFromLicenseField(pkg.licenses[i])
        if (fromLicenseField) {
          callback(fromLicenseField, node)
        }
      }
    }
  } else {
    callback(license, node)
  }
}

function getFromLicenseField(field) {
  if (typeof field === 'string') {
    return field
  } else if (field && field.type) {
    return field.type
  }
}
