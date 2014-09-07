module.exports = function($scope) {
  return function applyToScope(cb) {
    return function() {
      var args = arguments;
      if (!$scope.$$phase) {
        $scope.$apply(function() {
          cb.apply(this, args);
        });
      } else {
        cb.apply(this, args);
      }
    };
  };
};
