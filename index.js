// we need this to use navbar directive
require('./lib/navbar/navbar');

// bootstrap angular application:
npmVizApp = angular.module('npmViz', ['ngRoute']);
npmVizApp.config(require('./lib/routes'));

require('an').flush(npmVizApp);

angular.bootstrap(document, [npmVizApp.name]);
