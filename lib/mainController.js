module.exports = require('an').controller(mainController);

function mainController($scope) {
  $scope.onPackageSelected = function(pkg) {
    $scope.selectedPackage = pkg;
  };
}
