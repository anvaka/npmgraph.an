var fs = require('fs');

module.exports = function () {
  return {
    restrict: 'E',
    scope: {},
    template : fs.readFileSync(__dirname + '/navbar.html'),
    link: function (scope) {
    }
  };
};
