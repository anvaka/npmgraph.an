var fs = require('fs');
var viewController = require('./viewer/controller');

module.exports = ['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view/:pkgId', {
      template: fs.readFileSync(__dirname + '/viewer/index.html'),
      controller: viewController
    }).otherwise({
      redirectTo: '/'
    });
}];
