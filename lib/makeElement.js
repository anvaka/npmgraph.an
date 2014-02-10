module.exports = function (text) {
  var root = document.createElement('div');
  root.innerHTML = text;

  var element = root.children[0];
  root.removeChild(element);

  return element;
}
