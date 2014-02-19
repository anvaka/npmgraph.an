module.exports = require('an').controller(navbarController);

function navbarController($scope, $http) {
  $scope.formatPkg = function (model) {
    return model && model.id;
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
