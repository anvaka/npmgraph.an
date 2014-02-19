require('./controller');
require('typeahead.an');

module.exports = require('an').directive(navbar);

var fs = require('fs');
function navbar() {
  return {
    restrict: 'E',
    template : fs.readFileSync(__dirname + '/navbar.html')
  };
}
