module.exports.init = function () {
  var module = angular.module('npmviz', []);

  module.directive('navbar', require('./lib/navbar/index.js'));
  angular.bootstrap(document, ['npmviz']);
};
