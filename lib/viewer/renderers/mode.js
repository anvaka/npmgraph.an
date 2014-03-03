/**
 * This file is responsible for switching/initalizing current rending mode,
 * based on query string
 */

// For easy switching between modes, we store alternate modes in hash:
var alternateMode = {
  '2D': '3D',
  '3D': '2D'
};

module.exports = function initalizeMode($scope, $location) {
  var currentMode = ($location.search().mode || '2D').toUpperCase();

  if (!(currentMode in alternateMode)) {
    currentMode = '2D';
  }

  $scope.mode = currentMode;
  $scope.alternateMode = alternateMode[currentMode];
  $scope.switchMode = function () {
    $scope.selectedPackage = undefined; // remove package details
    $scope.mode = alternateMode[$scope.mode];
    $scope.alternateMode = alternateMode[$scope.mode];
    $location.search({mode: $scope.mode});
  };
};
