var _ = require('underscore'),
    q = require('q');

var Service = require('../models/service'),
    User = require('../models/user');

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

      var actions = _.chain(services)
        .map(function (service) { return service.user; })
        .uniq()
        .map(function (id) { return q.nfcall(User.findOne.bind(User), { _id: id }); })
        .value();
      q.all(actions).then(function (users) {
        var output = [];
        var userMap = _.groupBy(users, 
          function (user) {
            return user._id;
          });
        _.each(services, function (service) {
          var json = service.toJSON();
          json.user = userMap[service.user][0];
          output.push(json);
        });

        return res.json(output);        
      });
    });
  },

  update: function (req, res) {
    var serviceID = req.param('id');
    console.log (serviceID);
    console.log (req.body);
    res.send('Hello, World');
  }

};

(function () {
  module.exports = ServiceRoute;
})();
