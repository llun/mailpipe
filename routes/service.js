var _ = require('underscore'),
    q = require('q');

var Service = require('../models/service'),
    User = require('../models/user');

var ServiceRoute = {
  addPage: function (req, res) {
    res.render('add-service');
  },

  updatePage: function (req, res) {
    var name = req.param('name');
    var user = req.user;

    Service.findOne({ user: user._id, name: name }, function (err, service) {
      if (err) { return res.json(400, err); }
      return res.render('update-service', service);
    });
  },

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
          json.user = userMap[service.user][0].toObject();
          output.push(json);
        });

        return res.json(output);        
      });
    });
  },

  update: function (req, res) {
    var serviceID = req.param('id');

    Service.update(serviceID, req.body, function (err, service) {
      if (err) { return res.json(400, err); }
      return res.json(service);
    });
  },

  destroy: function (req, res) {
    var serviceID = req.param('id');
    Service.remove({ _id: serviceID }, function(err) {
      if (err) { return res.json(400, err); }
      return res.json({ success: true });
    });
  }

};

(function () {
  module.exports = ServiceRoute;
})();
