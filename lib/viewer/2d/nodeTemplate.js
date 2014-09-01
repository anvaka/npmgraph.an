var svg = require('simplesvg');
var arrow = require('./arrow');

module.exports = function(svgRoot) {
  return {
    node: function(node) {
      var ui = svg.compile([
      "<g>",
        "<circle fill='#CFCCDF' r='5px'></circle>",
        "<text fill='#484A5C' y='-10' x='-5'>" + node.id + "</text>",
      "</g>"
      ].join('\n'));

      return ui;
    },

    placeNode: function(nodeUI, pos) {
      nodeUI.attr('transform',
        'translate(' + (pos.x) + ',' + (pos.y) + ')');
    },

    link: function(node) {
      var ui = arrow(svgRoot);
      ui.stroke("#5A5D6E");

      return ui;
    },

    placeLink: function(linkUI, to, from) {
      linkUI.render(
        arrow.intersectCircle(from, to, 7), // from
        arrow.intersectCircle(to, from, 7) // to
      );
    }
  };
};
