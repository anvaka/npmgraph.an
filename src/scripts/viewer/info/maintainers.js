var toGravatar = require('./toGravatar');

module.exports = getAllMaintainers;

function getAllMaintainers(graph) {
  var histogram = {};
  var maintainers = [];
  graph.forEachNode(function(node) {
    var data = node.data;
    // this can happen if package is removed and is no longer maintained
    if (!data.maintainers) return;
    data.maintainers.forEach(countMaintainer);

    function countMaintainer(maintainer) {
      var record = histogram[maintainer.email];
      if (!record) {
        record = histogram[maintainer.email] = toGravatar(maintainer);
        record.count = 0;
        record.packages = [];

        maintainers.push(record);
      }
      record.count += 1;
      record.packages.push(node.id);
    }
  });

  return maintainers.sort(byCount);
}

function byCount(x, y) {
  return y.count - x.count;
}
