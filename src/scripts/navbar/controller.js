module.exports = require('an').controller(navbarController);
var registryUrl = require('../config.js').autoCompleteUrl;

function navbarController($scope, $http, $routeParams, $location) {
  $scope.formatPkg = function (model) {
    if (typeof  model === 'string') {
      return model;
    }
    return model && model.id;
  };

  var path = $location.path();
  if (path) {
    // TODO: why routeParams does not work here?
    var pathParts = path.match(/\/view\/[23]d\/([^\/]+)\/?/);
    $scope.selectedPackage = decodeURIComponent(pathParts[1] || '');
  }

  $scope.viewPackage = function (pkg) {
    var path = encodeURIComponent(pkg.id)
    if ($location.path().indexOf('/view/3d/') !== -1) {
      $location.path('/view/3d/' + path);
    } else {
      $location.path('/view/2d/' + path);
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
