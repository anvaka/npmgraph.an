// we need this to use navbar directive
require('./lib/navbar');
require('./lib/mainController');

// bootstrap angular application:
npmVizApp = angular.module('npmViz', ['ngRoute']);
npmVizApp.config(require('./lib/routes'));

require('an').flush(npmVizApp);

angular.bootstrap(document, [npmVizApp.name]);
