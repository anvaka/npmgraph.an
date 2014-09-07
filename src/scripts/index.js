// we need this to use navbar directive
require('./navbar/navbar');
require('./shareController');

// bootstrap angular application:
npmVizApp = angular.module('npmViz', ['ngRoute']);
npmVizApp.config(require('./routes'));

require('an').flush(npmVizApp);

angular.bootstrap(document, [npmVizApp.name]);
