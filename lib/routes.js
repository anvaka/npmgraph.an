var fs = require('fs');
var packageViewController = require('./viewer/packageViewController');

module.exports = ['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view/:pkgId', {
      template: fs.readFileSync(__dirname + '/viewer/packageView.html'),
      controller: packageViewController
    }).otherwise({
      redirectTo: '/'
    });
}];
