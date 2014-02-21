module.exports = require('an').controller(navbarController);

function navbarController($scope, $http) {
  $scope.formatPkg = function (model) {
    return model && model.name;
  };

  $scope.getPackages = function(val) {
    return $http.jsonp('http://registry.npmjs.org/-/all/-/jsonp/JSON_CALLBACK', {
      params: {
        limit: 10,
        reduce: false,
        //callback: 'JSON_CALLBACK',
        startkey: JSON.stringify(val)
      }
    }).then(function(res){
      var packages = [];
      Object.keys(res.data).forEach(function(key) {
        if (key[0] === '_') return;
        packages.push(res.data[key]);
      });
      return packages;
    });
  };
}
