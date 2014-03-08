var fs = require('fs');
var package3DViewController = require('./viewer/package3DViewController');
var packageViewController = require('./viewer/packageViewController');

module.exports = ['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view/2d/:pkgId', {
      template: fs.readFileSync(__dirname + '/viewer/packageView.html'),
      controller: packageViewController
    }).when('/view/3d/:pkgId', {
      template: fs.readFileSync(__dirname + '/viewer/package3DView.html'),
      controller: package3DViewController
    }).otherwise({
      redirectTo: '/'
    });
}];
