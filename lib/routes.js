var fs = require('fs');

module.exports = ['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view/:pkgId', {
      template: fs.readFileSync(__dirname + '/viewer/index.html'),
      controller: require('./viewer/controller')
    }).otherwise({
      redirectTo: '/'
    });
}];
