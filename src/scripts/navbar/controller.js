module.exports = require('an').controller(navbarController);
var registryUrl = require('../config.js').registryUrl;

function navbarController($scope, $http, $routeParams, $location) {
  $scope.formatPkg = function (model) {
    if (typeof  model === 'string') {
      return model;
    }
    return model && model.id;
  };

  var path = $location.path();
  if (path) {
    var pathParts = path.split('/');
    $scope.selectedPackage = pathParts[pathParts.length - 1];
  }

  $scope.viewPackage = function (pkg) {
    if ($location.path().indexOf('/view/3d/') !== -1) {
      $location.path('/view/3d/' + pkg.id);
    } else {
      $location.path('/view/2d/' + pkg.id);
    }
  };

  $scope.getPackages = function(val) {
    return $http.get(registryUrl, {
      params: {
        limit: 10,
        reduce: false,
        startkey: JSON.stringify(val)
      }
    }).then(function(res){
      var packages = [];
      angular.forEach(res.data.rows, function(pkg){
        packages.push(pkg);
      });
      return packages;
    });
  };
}
