var toGravatar = require('./toGravatar');
module.exports = infoController;

function infoController($scope) {
  var applyToScope = require('../applyToScope')($scope);
  var selectedLicense;

  $scope.highlightNodes = function(record, e) {
    e.preventDefault();

    $scope.$root.$broadcast('highlight-node', {
      color: '#52CCE3',
      ids: record.packages
    });

    if (selectedLicense) selectedLicense.selected = false;
    selectedLicense = record;
    if (selectedLicense) selectedLicense.selected = true;
  };

  $scope.graphLoaded = false;
  $scope.packageInfoVisible = true;

  $scope.switchInfoMode = switchInfoMode;
  $scope.$on('node-selected', applyToScope(onSelectNode));
  $scope.$on('graph-loaded', graphLoaded);

  function onSelectNode(e, node) {
    selectNode(node);
  }

  function switchInfoMode(mode, e) {
    if (e) e.preventDefault();
    $scope.packageInfoVisible = mode === 'package';
    $scope.graphInfoVisible = mode === 'graph';
  }

  function selectNode(node) {
    var data = $scope.selectedPackage = node.data;

    if (data.maintainers && data.maintainers.length) {
      $scope.maintainers = data.maintainers.map(toGravatar);
    }
  }

  function graphLoaded(e, rootId) {
    var graph = $scope.graph;
    $scope.linksCount = graph.getLinksCount();
    $scope.nodesCount = graph.getNodesCount();

    $scope.graphLoaded = true;
    $scope.allMaintainers = require('./maintainers')(graph);
    $scope.allLicenses = require('./licenses')(graph);

    selectNode(graph.getNode(rootId));
  }
}

infoController.$inject = ['$scope'];
