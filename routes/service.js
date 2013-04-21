var q = require('q');

var Service = require('../models/service');

var ServiceRoute = {
  add: function (req, res) {
    res.send('Hello, World');
  }
};

(function () {
  module.exports = ServiceRoute;
})();
