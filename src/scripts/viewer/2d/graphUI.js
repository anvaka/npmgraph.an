var svg = require('simplesvg');
var eventify = require('ngraph.events');
var arrow = require('./arrow');
var defaultNodeColor = '#CFCCDF';
var defaultTextColor = '#70738f';

module.exports = function(svgRoot) {
  var nodeUIModels = Object.create(null);
  var linkUIModels = Object.create(null);

  var graphUI = {

    highlight: function(nodeId, color) {
      var info = nodeUIModels[nodeId];
      info.model.nodeColor = color;
      info.model.textColor = color;
      info.ui.dataSource(info.model);
    },

    setColor: function (nodeId, color, textColor) {
      var info = nodeUIModels[nodeId];
      var model = info.model;
      model.originalColor = model.nodeColor = color;
      model.originalTextColor = model.textColor = textColor || color;
      info.ui.dataSource(info.model);
    },

    highlightLink: highlightLink,

    resetLinks: function() {
      Object.keys(linkUIModels).forEach(function(key) {
        highlightLink(key, '#5A5D6E');
      });
    },

    resetHighlight: function(node) {
      var info = nodeUIModels[node.id];
      setNodeColor(info, info.model.originalColor, info.model.originalTextColor);
    },

    defaultHighlight: function(node) {
      graphUI.setColor(node.id, defaultNodeColor, defaultTextColor);
    },

    node: function(node) {
      var ui = svg.compile([
        "<g>",
        "<circle fill='{{nodeColor}}' r='5px'></circle>",
        "<text fill='{{textColor}}' y='-10' x='-5'>{{text}}</text>",
        "</g>"
      ].join('\n'));

      var uiModel = {
        nodeColor: defaultNodeColor,
        originalColor: defaultNodeColor,
        textColor: defaultTextColor,
        originalTextColor: defaultTextColor,
        text: node.id
      };

      nodeUIModels[node.id] = {
        ui: ui,
        model: uiModel
      };

      ui.dataSource(uiModel);
      ui.on('mousedown', fire('nodeselected'));
      ui.on('mouseenter', fire('mouseenter'));
      ui.on('mouseleave', fire('mouseleave'));

      return ui;

      function fire(name) {
        return function(e) {
          graphUI.fire(name, node);
        };
      }
    },

    placeNode: function(nodeUI, pos) {
      nodeUI.attr('transform', 'translate(' + pos.x + ',' + pos.y + ')');
    },

    link: function(link) {
      var ui = arrow(svgRoot);
      ui.stroke("#5A5D6E");

      linkUIModels[link.id] = ui;
      return ui;
    },

    placeLink: function(linkUI, to, from) {
      linkUI.render(
        arrow.intersectCircle(from, to, 7), // from
        arrow.intersectCircle(to, from, 7) // to
      );
    }
  };

  eventify(graphUI);

  return graphUI;

  function highlightLink(linkId, color) {
    var ui = linkUIModels[linkId];
    if (ui) ui.stroke(color);
  }

  function setNodeColor(info, nodeColor, textColor) {
    info.model.nodeColor = nodeColor;
    info.model.textColor = textColor;
    info.ui.dataSource(info.model);
  }
};
