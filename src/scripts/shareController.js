module.exports = require('an').controller('ShareController', ShareController);

function ShareController($scope) {
  $scope.share = share;

  var services = {
    twitter: function(url) {
      return 'https://twitter.com/intent/tweet?url=' + decodeURIComponent(url).replace(/#/g, '%23');
    },
    google: function(url) {
      return 'https://plus.google.com/share?url=' + url;
    },
    facebook: function(url) {
      return 'http://www.facebook.com/sharer/sharer.php?u=' + url;
    }
  };

  function share(serviceName, e) {
    var url = encodeURIComponent(window.location.href);
    window.open(services[serviceName](url), 'Share' + serviceName, 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=420,width=600');
    e.preventDefault();
  }
}

ShareController.$inject = ['$scope'];
