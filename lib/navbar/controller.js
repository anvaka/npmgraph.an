module.exports = require('an').controller(navbarController);

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
    $location.path('/view/' + pkg.id);
  };

  $scope.getPackages = function(val) {
    return $http.jsonp('http://isaacs.iriscouch.com/registry/_design/scratch/_view/byField', {
      params: {
        limit: 10,
        reduce: false,
        callback: 'JSON_CALLBACK',
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
