var fs = require('fs');

module.exports = require('an').directive('packageInfo', packageInfo);

function packageInfo() {
  return {
    restrict: 'E',
    replace: true,
    template : fs.readFileSync(__dirname + '/packageInfo.html', 'utf8'),
    scope: {
      graph: '='
    },
    controller: require('./infoController')
  };
}
