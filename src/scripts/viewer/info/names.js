module.exports = getAllNames;

function getAllNames(graph) {
  var histogram = {};
  var names = [];

  graph.forEachNode(countNode);

  return names.sort(byCount);

  function countNode(node) {
    var parts = node.id.split('@');
    var name;
    if (parts.length === 3) {
      name = parts[1];
    } else {
      name = parts[0];
    }

    var record = histogram[name];

    if (!record) {
      record = histogram[name] = Object.create(null);
      record.name = name;
      record.count = 0;
      record.packages = [];
      names.push(record);
    }
    record.count += 1;
    record.packages.push(node.id);
  }

  function byCount(x, y) {
    return y.count - x.count;
  }
}
