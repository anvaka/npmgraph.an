module.exports = getAllLicenses;

function getAllLicenses(graph) {
  var histogram = {};
  var licenses = [];

  graph.forEachNode(countNode);

  return licenses.sort(byCount);

  function countNode(node) { forEachLicnese(node.data, countLicnese); }

  function countLicnese(license, pkg) {
    var record = histogram[license];
    if (!record) {
      record = histogram[license] = {};
      record.name = license;
      record.count = 0;
      record.packages = [];
      licenses.push(record);
    }
    record.count += 1;
    record.packages.push(pkg.id);
  }

  function byCount(x, y) {
    return y.count - x.count;
  }
}

function forEachLicnese(pkg, callback) {
  var license = 'unspecified';

  if (typeof pkg.license === 'string') {
    license = pkg.license;
  } else if (typeof pkg.license === 'object' && pkg.license.type) {
    license = pkg.license.type;
  }

  callback(license, pkg);
}
