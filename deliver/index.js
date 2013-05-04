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
    cb = cb || function () {};

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

          if (!found) {
            // Ignore mail that doesn't found in system
            deferred.resolve(undefined);
          }
          else {
            rest.post(found.target)
            .on('success', function (data) {
              found.success = true;
              deferred.resolve(found);
            })
            .on('fail', function (data, response) {
              found.success = false;
              found.error = response.statusCode;
              deferred.resolve(found);
            })
            .on('error', function (err) {
              deferred.reject(err);
            });
          }

          return deferred.promise;
        });

        return q.all(promises);
      })
      .then(function (mails) {
        var messages = _.chain(mails).filter(function (mail) { return mail != undefined; })
          .map(function (mail) {
            var message = {
              from: from,
              to: mail._id,
              status: mail.success ? Message.STATUS.SENT : Message.STATUS.FAIL,
              error: mail.error
            }

            return q.nfcall(Message.create.bind(Message), message);
          }).value();

        return q.all(messages);
      })
      .then(function (messages) {
        return cb(null, messages);
      })
      .fail(function (err) {
        return cb(err);
      });
  }

}

var _instance = new Deliver;
Deliver.instance = function () {
  return _instance;
}

module.exports = Deliver;