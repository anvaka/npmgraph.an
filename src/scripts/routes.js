var fs = require('fs');
var package3DViewController = require('./viewer/3d/package3dViewController');
var package2DViewController = require('./viewer/2d/package2dViewController');

module.exports = ['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view/2d/:pkgId/:version?', {
      template: fs.readFileSync(__dirname + '/viewer/2d/package2dView.html'),
      controller: package2DViewController
    }).when('/view/3d/:pkgId/:version?', {
      template: fs.readFileSync(__dirname + '/viewer/3d/package3dView.html'),
      controller: package3DViewController
    }).otherwise({
      redirectTo: '/'
    });
}];
