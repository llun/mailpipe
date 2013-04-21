var q = require('q');

var Service = require('../models/service');

var ServiceRoute = {
  add: function (req, res) {
    var input = {
      name: req.body.name,
      target: req.body.target,
      authentication: {
        type: req.body['authentication.type'],
        key: req.body['authentication.key'],
        pass: req.body['authentication.pass']
      }
    }
    var service = new Service(input);
    service.save(function (err) {
      if (err) { return res.json(err); }
      return res.json(service);
    });
  }
};

(function () {
  module.exports = ServiceRoute;
})();
