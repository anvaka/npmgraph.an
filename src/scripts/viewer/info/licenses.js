module.exports = getAllLicenses;

function getAllLicenses(graph) {
  var histogram = {};
  var licenses = [];

  graph.forEachNode(countNode);

  return licenses.sort(byCount);

  function countNode(node) { forEachLicnese(node, countLicnese); }

  function countLicnese(license, node) {
    var record = histogram[license];
    if (!record) {
      record = histogram[license] = {};
      record.name = license;
      record.count = 0;
      record.packages = [];
      licenses.push(record);
    }
    record.count += 1;
    record.packages.push(node.id);
  }

  function byCount(x, y) {
    return y.count - x.count;
  }
}

function forEachLicnese(node, callback) {
  var license = 'unspecified';
  var pkg = node.data;
  var fromLicenseField = getFromLicenseField(pkg.license);

  if (fromLicenseField) {
    license = fromLicenseField;
    callback(license, node);
  } else if (pkg.licenses && pkg.licenses.length) {
    for (var i = 0; i < pkg.licenses.length; ++i) {
      fromLicenseField = getFromLicenseField(pkg.licenses[i]);
      if (fromLicenseField) {
        callback(fromLicenseField, node);
      }
    }
  } else {
    callback(license, node);
  }
}

function getFromLicenseField(field) {
  if (typeof field === 'string') {
    return field;
  } else if (field && field.type) {
    return field.type;
  }
}
