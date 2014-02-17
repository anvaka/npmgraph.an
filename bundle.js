require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
      if (compiledDirectives[directiveName]) {
        return;
      }
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

},{}],"fylAWl":[function(require,module,exports){
var fs = require('fs');

module.exports = function () {
  return {
    restrict: 'E',
    template : "<nav class=\"navbar navbar-default\" role=\"navigation\">\n  <div class=\"container-fluid\">\n    <div class=\"navbar-header\">\n      <a class=\"navbar-brand\" href=\"#\">Yasiv <small>- npm visualization</small></a>\n    </div>\n\n    <div class=\"collapse navbar-collapse\" id=\"bs-example-navbar-collapse-1\">\n      <div class=\"row\">\n        <div class=\"col-md-4\">\n          <form class=\"navbar-form navbar-left\" role=\"search\">\n            <div class=\"input-group\">\n              <span class=\"input-group-addon\">npm {{hello}} search</span>\n              <input  type=\"text\" autofocus class=\"form-control\" placeholder=\"package name\" autosuggest>\n              <span class=\"input-group-btn\">\n                <button class=\"btn btn-default\" type=\"button\">Go!</button>\n              </span>\n            </div>\n          </form>\n        </div>\n      </div>\n    </div>\n  </div>\n</nav>\n"
  };
};

},{"fs":4}],"./lib/navbar/index.js":[function(require,module,exports){
module.exports=require('fylAWl');
},{}],4:[function(require,module,exports){

// not implemented
// The reason for having an empty file and not throwing is to allow
// untraditional implementation of this module.

},{}]},{},[1])
;