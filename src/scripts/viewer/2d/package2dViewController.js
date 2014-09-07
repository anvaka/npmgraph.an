/**
 * This controller is responsible for building graph from current route
 */
require('./graphViewer');
var md5 = require('js-md5');

module.exports = function($scope, $routeParams, $http, $location) {
  $scope.name = ' ' + $routeParams.pkgId;
  $scope.root = $routeParams.pkgId;
  $scope.onNodeSelected = applyToScope(selectPackage);
  $scope.packageInfoVisible = true;
  $scope.switchInfoMode = function (mode, e) {
    e.preventDefault();
    $scope.packageInfoVisible = mode === 'package';
    $scope.graphInfoVisible = mode === 'graph';
  };
  $scope.switchMode = function() {
    $location.path('view/3d/' + $routeParams.pkgId);
  };

  var graphBuilder = require('../graphBuilder')($routeParams.pkgId, $http);
  $scope.graph = graphBuilder.graph;
  graphBuilder.start.then(function() {
    applyToScope(setCanSwitch)();

    var root = graphBuilder.graph.getNode($scope.root);
    if (root) {
      selectPackage(root);
    }
  });

  function setCanSwitch() {
    // todo: check if it supports webgl
    $scope.canSwitchMode = true;
    $scope.linksCount = $scope.graph.getLinksCount();
    $scope.nodesCount = $scope.graph.getNodesCount();

    $scope.allMaintainers = getAllMaintainers($scope.graph);
    $scope.allLicenses = require('./graphInfo/licenses')($scope.graph);
  }

  function applyToScope(cb) {
    return function() {
      var args = arguments;
      if (!$scope.$$phase) {
        $scope.$apply(function () {
          cb.apply(this, args);
        });
      } else {
        cb.apply(this, args);
      }
    };
  }

  function selectPackage(node) {
    var data = $scope.selectedPackage = node.data;
    if (data.maintainers && data.maintainers.length) {
      $scope.maintainers = data.maintainers.map(toGravatar);
    }
  }

  function toGravatar(record) {
    return {
      avatar:'https://secure.gravatar.com/avatar/' + md5(record.email) + '?s=25&d=retro',
      profile: 'https://www.npmjs.org/~' + record.name,
      name: record.name,
      email: record.email
    };
  }

  function getAllMaintainers(graph) {
    var histogram = {};
    var maintainers = [];
    graph.forEachNode(function (node) {
      var data = node.data;
      data.maintainers.forEach(function (maintainer) {
        var record = histogram[maintainer.email];
        if (!record) {
          record = histogram[maintainer.email] = toGravatar(maintainer);
          record.count = 0;
          record.packages = [];

          maintainers.push(record);
        }
        record.count += 1;
        record.packages.push(node.id);
      });
    });

    return maintainers.sort(function (x, y) { return y.count - x.count; });
  }
};
