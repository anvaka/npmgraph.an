var makeElement = require('../makeElement');

exports.navbar = function (root) {
  var fs = require('fs');
  var template = fs.readFileSync(__dirname + '/navbar.html');

  var newChild = makeElement(template);
  root.parentNode.replaceChild(newChild, root);
}
