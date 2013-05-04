var _ = require('underscore'),
    q = require('q');

var Message = require('../models/message');

var MessageRoute = {
  list: function (req, res) {
    var service = req.query.service;
    var page = req.query.page || 0;
    var limit = req.query.limit || 10;

    if (!service) return res.json(404, { error: 'service not found'})
    Message.find({ to: service }).skip(page * limit).sort('-timestamp').exec(
      function (err, messages) {
        res.json(messages);
      });
  }
};

(function () {
  module.exports = MessageRoute;
})();
