module.exports = require('an').controller(navbarController);

function navbarController($scope, $http) {
  $scope.getPackages = function(val) {
    debugger;
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
          packages.push(pkg.id + ': ' + pkg.value.description);
        });
        return packages;
      });
    };
}
