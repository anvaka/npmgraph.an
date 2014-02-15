var makeElement = require('../makeElement');

module.exports = function (root) {
  var fs = require('fs');
  var template = fs.readFileSync(__dirname + '/navbar.html');

  var newChild = makeElement(template);
  root.parentNode.replaceChild(newChild, root);
};
