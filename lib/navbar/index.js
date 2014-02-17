var fs = require('fs');

module.exports = function () {
  return {
    restrict: 'E',
    template : fs.readFileSync(__dirname + '/navbar.html')
  };
};
