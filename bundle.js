require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var fs = require('fs');

module.exports = function () {
  return {
    restrict: 'E',
    scope: {},
    template : "<nav class=\"navbar navbar-default\" role=\"navigation\">\n  <div class=\"container-fluid\">\n    <div class=\"navbar-header\">\n      <a class=\"navbar-brand\" href=\"#\">Yasiv <small>- npm visualization</small></a>\n    </div>\n\n    <div class=\"collapse navbar-collapse\" id=\"bs-example-navbar-collapse-1\">\n      <div class=\"row\">\n        <div class=\"col-md-4\">\n          <form class=\"navbar-form navbar-left\" role=\"search\">\n            <div class=\"input-group\">\n              <span class=\"input-group-addon\">npm {{hello}} search</span>\n              <input type=\"text\" autofocus class=\"form-control\" placeholder=\"package name\">\n              <span class=\"input-group-btn\">\n                <button class=\"btn btn-default\" type=\"button\">Go!</button>\n              </span>\n            </div>\n          </form>\n        </div>\n      </div>\n    </div>\n  </div>\n</nav>\n",
    link: function (scope) {
    }
  };
};

},{"fs":6}],"W3x+zM":[function(require,module,exports){
module.exports.init = function () {
  var module = angular.module('npmviz', []);

  module.directive('navbar', require('./lib/navbar/index.js'));
  angular.bootstrap(document, ['npmviz']);
};

},{"./lib/navbar/index.js":1}],"./main.js":[function(require,module,exports){
module.exports=require('W3x+zM');
},{}],4:[function(require,module,exports){
var sj = require('../');
var docLoaded = setInterval(checkDomReady);

function checkDomReady() {
  var state = document.readyState;
  if (state === "complete" || state === "interactive") {
    clearInterval(docLoaded);
    sj.bind(document.body);
  }
}

},{"../":5}],5:[function(require,module,exports){
module.exports.bind = function(root, model, requires) {
  requires = requires || {};
  model = model || {};

  compileSubtree(root);

  function compileSubtree(root) {
    if (root.localName && compileNode(root)) {
      return true;
    }
    for (var i = 0; i < root.childNodes.length; ++i) {
      compileSubtree(root.childNodes[i]);
    }
  }

  function compileNode(node) {
    var nameParts = node.localName.split(':');
    var foundComponent = false;
    if (nameParts.length === 2 && nameParts[0] in requires) {
      // potentially candidate for require
      var module = require(requires[nameParts[0]]);
      var ctor = module[nameParts[1]];
      if (typeof ctor !== 'function') {
        throw new Error('Cannot find function ' + nameParts[1] + ' in module ' + nameParts[0]);
      }

      ctor(node, model, requires);
      foundComponent = true;
    }

    if (node.nodeType === 1) { // element node, compile attributes;
      var attributes = node.attributes;
      for (var i = 0; i < attributes.length; ++i) {
        compileAttribute(node, attributes[i]);
      }
    }

    return foundComponent;
  }

  function compileAttribute(node, attribute) {
    var nameParts = attribute.localName.split(':');
    if (nameParts.length !== 2) return; // not our candidate

    var isNamespace = nameParts[0] === 'xmlns';
    if (isNamespace) {
      var requireMatch = attribute.nodeValue && attribute.nodeValue.match(/^require:(.+)$/);
      if (requireMatch) {
        requires[nameParts[1]] = requireMatch[1];
      }
    } else if (nameParts[0] in requires) {
      // we've seen it before, and there is registered handler:
      var module = require(requires[nameParts[0]]);
      var ctor = module[nameParts[1]] || module['*'];
      if (typeof ctor === 'function') {
        ctor(node, attribute, model, requires);
      } else {
        throw new Error('Cannot find ' + nameParts[1] + ' attribute in module ' + nameParts[0]);
      }
    }
  }
};

},{}],6:[function(require,module,exports){

},{}]},{},[4])