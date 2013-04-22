var q = require('q');

var Service = require('../models/service');

var ServiceRoute = {
  add: function (req, res) {
    Service.add(req.user, req.body, function (err, service) {
      if (err) { return res.json(400, err); }
      return res.json(service);
    });
  },

  list: function (req, res) {
    Service.all(req.user, function (err, services) {
      if (err) { return res.json(400, err); }
      return res.json(services);
    });
  }

};

(function () {
  module.exports = ServiceRoute;
})();
