var fs = require('fs'),
    rest = require('restler'),
    _ = require('underscore'),
    q = require('q');

_.str = require('underscore.string');
_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string');

var Message = require('../models/message'),
    Service = require('../models/service'),
    User = require('../models/user');

var Deliver = function () {

  this.send = function (file, from, rcpts, cb) {

    var targets = _.map(rcpts, function (rcpt) { return _(rcpt).strLeft('@').split('+'); });
    var users = _.map(targets, function (mixes) { return q.nfcall(User.findOne.bind(User), { username: mixes[0] }); });

    var mail = '';

    q.nfcall(fs.readFile, file, { encoding: 'utf8' })
      .then(function (data) {
        mail = data;
        return q.all(users);
      })
      .then(function (founds) {
        var map = _.groupBy(founds, function (found) { return found.username; });
        _.each(targets, function (target) {
          target[0] = map[target[0]][0];
        });
        
        var next = _.map(targets, function (item) {
          return q.nfcall(Service.findOne.bind(Service), { user: item[0]._id, name: item[1] });
        });
        return q.all(next);
      })
      .then(function (founds) {
        var promises = _.map(founds, function (found) {
          var deferred = q.defer();

          rest.post(found.target)
            .on('success', function (data) {
              deferred.resolve(found);
            })
            .on('fail', function (data, response) {
              deferred.reject(new Error('Server response: ' + response.statusCode));
            })
            .on('error', function (err) {
              deferred.reject(err);
            });

          return deferred.promise;
        });

        return q.all(promises);
      })
      .then(function (mails) {
        
      })
      .fail(function (err) {
        console.log (err);
      })
      .done(function () {
        cb();
      });
  }

}

var _instance = new Deliver;
Deliver.instance = function () {
  return _instance;
}

module.exports = Deliver;