var appName = 'sj-app';
var module = angular.module(appName, []);
var compileProvider;
var compiledDirectives = {};

module.config(function($compileProvider) {
  compileProvider = $compileProvider;
});

module.directive('require', function ($compile) {
  return {
    link: function (scope, element, attrs) {
      var directiveName = element[0].localName;
      if (compiledDirectives[directiveName]) return;

      var requireName = attrs.require;
      var targetDirective = require(requireName);
      if (compileProvider) {
        compileProvider.directive(directiveName, targetDirective);
        compiledDirectives[directiveName] = 1;
        $compile(element)(scope);
      }
    }
  };
});

angular.bootstrap(document, [appName]);
