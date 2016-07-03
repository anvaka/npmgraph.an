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

    $scope.responsiveOpen = false;
    if (e) {
      // i know it's bad, but I'm not sure how to make it better:
      var container = document.querySelector('.infoBox');
      if (container) container.scrollTop = 0;
    }
  };

  $scope.hideInfoBox = function (e) {
    $scope.responsiveOpen = false;
    e.preventDefault();
  };

  $scope.graphLoaded = false;
  $scope.packageInfoVisible = true;

  $scope.switchInfoMode = switchInfoMode;
  $scope.$on('node-selected', applyToScope(onSelectNode));
  $scope.$on('graph-loaded', graphLoaded);

  function onSelectNode(e, node) {
    selectNode(node);
    switchInfoMode('package');
  }

  function switchInfoMode(mode, e) {
    if (e) e.preventDefault();
    $scope.packageInfoVisible = mode === 'package';
    $scope.graphInfoVisible = mode === 'graph';
    // only open in responsive mode when use explicitly clicked on a link:
    $scope.responsiveOpen = !!e;
  }

  function selectNode(node) {
    var data = $scope.selectedPackage = node.data;

    if (data.maintainers && data.maintainers.length) {
      $scope.maintainers = data.maintainers.map(toGravatar);
    }
  }

  function graphLoaded() {
    var graph = $scope.graph;
    $scope.linksCount = graph.getLinksCount();
    $scope.nodesCount = graph.getNodesCount();

    $scope.graphLoaded = true;
    $scope.allMaintainers = require('./maintainers')(graph);
    $scope.allLicenses = require('./licenses')(graph);

    selectNode(graph.root);
  }
}

infoController.$inject = ['$scope'];
