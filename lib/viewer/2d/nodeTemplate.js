var svg = require('simplesvg');

module.exports = function (node) {
  return svg.compile([
    "<circle fill='#CFCCDF' r='5px'></circle>"
  ].join('\n'));
};
