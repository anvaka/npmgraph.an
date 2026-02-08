import svg from 'simplesvg'

export default function arrow(root) {
  var dom = svg('path')
  var defs

  var knownStrokes = root.arrowStroke
  if (!root.arrowStroke) {
    knownStrokes = root.arrowStroke = {}
  }

  dom.stroke = stroke
  dom.render = render

  return dom

  function render(from, to) {
    dom.attr('d', 'M ' + from.x + ' ' + from.y + ' L ' + to.x + ' ' + to.y)
  }

  function stroke(color) {
    if (typeof color !== 'string' && typeof color !== 'number') {
      throw new Error('Stroke color is expected to be a string or a number')
    }

    var strokeDef = knownStrokes[color]
    if (!strokeDef) {
      knownStrokes[color] = strokeDef = defineStroke(color)
    }

    dom.attr('marker-end', 'url(#' + strokeDef + ')').attr('stroke', color)
  }

  function defineStroke(color) {
    if (!defs) {
      defs = root.getElementsByTagName('defs')[0] || createDefs()
    }

    var id = 'triangle_' + normalizeColor(color)
    var marker = svg.compile([
      '<marker id="' + id + '"',
      '        viewBox="0 0 10 10"',
      '        refX="8" refY="5"',
      '        markerUnits="strokeWidth"',
      '        markerWidth="10" markerHeight="5"',
      '        orient="auto" style="fill: ' + color + '">',
      '  <path d="M 0 0 L 10 5 L 0 10 z"></path>',
      '</marker>'
    ].join('\n'))

    defs.appendChild(marker)

    return id
  }

  function createDefs() {
    defs = svg('defs')
    root.appendChild(defs)
    return defs
  }
}

function normalizeColor(color) {
  if (typeof color === 'number') {
    return color.toString(16)
  } else if (color[0] === '#') {
    return color.substr(1)
  }
}

arrow.intersectCircle = function (start, end, circleRadius) {
  var width = end.x - start.x
  var height = end.y - start.y
  var angle = Math.atan2(height, width)
  var dx = Math.cos(angle) * circleRadius
  var dy = Math.sin(angle) * circleRadius
  return {
    x: end.x - dx,
    y: end.y - dy
  }
}
