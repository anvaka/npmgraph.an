require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"+1xDHs":[function(require,module,exports){
exports.event = function (root) {

}

},{}],"./lib/events":[function(require,module,exports){
module.exports=require('+1xDHs');
},{}],3:[function(require,module,exports){
module.exports = function (text) {
  var root = document.createElement('div');
  root.innerHTML = text;

  var element = root.children[0];
  root.removeChild(element);

  return element;
}

},{}],"NE6+2T":[function(require,module,exports){
var makeElement = require('../makeElement');

exports.navbar = function (root) {
  var fs = require('fs');
  var template = "<div class=\"navbar\">\n  <div class=\"navbar-inner\">\n    <a class=\"brand\" href=\"#\">Yasiv <small>- npm visualization</small></a> \n    <form class=\"navbar-form pull-left\">\n      <div class=\"input-prepend input-append\">\n        <span class=\"add-on\">npm search</span>\n        <input class=\"span3\" id=\"npmSearchPackageName\" autocomplete=\"off\" type=\"text\" placeholder=\"package name\">\n        <button type=\"submit\" class=\"btn btn-primary\">Go</button>\n      </div>\n    </form>\n  </div>\n</div>\n";

  var newChild = makeElement(template);
  root.parentNode.replaceChild(newChild, root);
}

},{"../makeElement":3,"fs":10}],"./lib/navbar/navbar":[function(require,module,exports){
module.exports=require('NE6+2T');
},{}],"XjIiHz":[function(require,module,exports){
exports.sidebar = function (root) {

}

},{}],"./lib/sidebar/sidebar":[function(require,module,exports){
module.exports=require('XjIiHz');
},{}],8:[function(require,module,exports){
var sj = require('../');
var docLoaded = setInterval(checkDomReady);

function checkDomReady() {
  if (document.readyState === "complete") {
    clearInterval(docLoaded);
    sj.bind(document.body);
  }
}

},{"../":9}],9:[function(require,module,exports){
module.exports.bind = function(root, model, requires) {
  requires = requires || {};

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

      ctor(node, { model: model, requires: requires });
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
        ctor(node, attribute, { model: model, requires: requires });
      } else {
        throw new Error('Cannot find ' + nameParts[1] + ' attribute in module ' + nameParts[0]);
      }
    }
  }
}

},{}],10:[function(require,module,exports){

},{}]},{},[8])