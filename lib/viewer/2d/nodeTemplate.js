var svg = require('simplesvg');

exports.node = function (node) {
  return svg.compile([
    "<circle fill='#CFCCDF' r='5px'></circle>",
    "<text fill='#484A5C' y='-10' x='-5'>" + node.id + "</text>"
  ].join('\n'));
};

exports.link = function (node) {
  return svg("line").attr("stroke", "#5A5D6E");
};
