var svg = require('simplesvg');
var arrow = require('./arrow');

module.exports = function(svgRoot) {
  return {
    node: function(node) {
      return svg.compile([
      "<g>",
        "<circle fill='#CFCCDF' r='5px'></circle>",
        "<text fill='#484A5C' y='-10' x='-5'>" + node.id + "</text>",
      "</g>"
      ].join('\n'));
    },
    placeNode: function(nodeUI, pos) {
      nodeUI.attr('transform',
        'translate(' + (pos.x) + ',' + (pos.y) + ')');
    },

    link: function(node) {
      var ui = arrow(svgRoot);
      ui.ctrl.stroke("#5A5D6E");

      return ui;
    },

    placeLink: function(linkUI, from, to, model) {
      linkUI.ctrl.render(from, to);
    }
  };
};
