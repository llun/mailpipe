var crypto = require('crypto'),
    fs = require('fs'),
    path = require('path'),
    rest = require('restler'),
    simplesmtp = require('simplesmtp'),
    _ = require('underscore'),
    q = require('q');

_.str = require('underscore.string');
_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string');

var Message = require('../models/message'),
    Service = require('../models/service'),
    User = require('../models/user');

var Deliver = function (port, domain, fileDirectory) {

  this.port = port || 2525;
  this.fileDirectory = fileDirectory || '/tmp';
  this.domain = domain || 'mailpipe.me';
  this.smtp = null;

  var self = this;

  this.start = function () {
    var smtp = simplesmtp.createServer({
      debug: false,
      SMTPBanner: 'Hello, This is redirector'
    });
    smtp.listen(self.port, function () {
      console.log ('Redirector server listen on port ' + self.port);
    });
    smtp.on('startData', function (connection) {
      var hash = crypto.createHash('sha1');
      hash.update(connection.from + new Date().getTime());
      connection.filename = path.join(self.fileDirectory, hash.digest('hex') + '.mail');
      connection.saveStream = fs.createWriteStream(connection.filename);
    });
    smtp.on('data', function (connection, chunk) {
      connection.saveStream.write(chunk);
    });
    smtp.on('dataReady', function (connection, callback) {
      connection.saveStream.end();
      self.send(connection.filename, connection.from, connection.to);
      callback(null, 'MP3');
    });
    smtp.on('validateRecipient', function (connection, email, callback) {
      Service.isValidAddress(email, self.domain, function (err) {
        if (err) {
          callback(err);
        }
        else {
          callback(null, 'MP2');
        }
      });
    });

    this.smtp = smtp;
  }

  this.send = function (file, from, rcpts, cb) {
    cb = cb || function () {};

    var targets = _.map(rcpts, function (rcpt) { return _(rcpt).strLeft('@').split('+'); });
    var users = _.map(targets, function (mixes) { return q.nfcall(User.findOne.bind(User), { username: mixes[0] }); });

    var stat = null;

    q.nfcall(fs.stat, file)
      .then(function (data) {
        stat = data;
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
            rest.post(found.target, {
              multipart: true,
              data: {
                file: rest.file(file, 'raw.mail', stat.size, null, 'text/plain')
              }
            })
            .on('success', function (data) {
              found.success = true;
              deferred.resolve(found);
            })
            .on('fail', function (data, response) {
              found.success = false;
              found.error = 'Service response: ' + response.statusCode;
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
        console.err (err);
        return cb(err);
      });
  }

}

var _instance = new Deliver;
Deliver.instance = function () {
  return _instance;
}

module.exports = Deliver;