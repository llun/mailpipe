var q = require('q');

var Service = require('../models/service');

var ServiceRoute = {
  add: function (req, res) {
    req.body.user = req.user;
    var service = new Service(req.body);
    service.save(function (err) {
      if (err) { return res.json(400, err); }
      return res.json(service);
    });
  }
};

(function () {
  module.exports = ServiceRoute;
})();
