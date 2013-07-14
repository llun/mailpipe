var cluster = require('cluster'),
    crypto = require('crypto'),
    fs = require('fs'),
    mailparser = require('mailparser'),
    path = require('path'),
    rest = require('restler'),
    simplesmtp = require('simplesmtp'),
    _ = require('underscore'),
    q = require('q');

_.str = require('underscore.string');
_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string');

var MailParser = mailparser.MailParser;

var modules = require('./modules');

var Message = require('../models/message'),
    Service = require('../models/service'),
    User = require('../models/user');

var Deliver = function (port, totalProcess, domain, fileDirectory) {

  this.port = port;
  this.fileDirectory = fileDirectory;
  this.domain = domain;
  this.totalProcess = totalProcess;
  this.smtp = null;

  this.strategies = modules;

  var self = this;

  this.start = function () {
    if (cluster.isMaster) {
      for (var i = 0; i < totalProcess; i++) {
        cluster.fork();
      }

      cluster.on('disconnect', function(worker) {
        console.error('disconnect!');
        cluster.fork();
      });

    }
    else {
      var domain = require('domain');

      var smtp = simplesmtp.createServer(
        {
          debug: false,
          SMTPBanner: 'Hello, This is MailPipe'
        },
        function (req) {
          var d = domain.create();

          d.on('error', function(er) {
            console.error('error', er.stack);

            try {
              var killtimer = setTimeout(function() {
                process.exit(1);
              }, 30000);
              killtimer.unref();
              server.close();
              cluster.worker.disconnect();
            } catch (er2) {
              console.error('Error sending 500!', er2.stack);
            }
          });

          d.add(req);

          d.run(function () {
            req.pipe(process.stdout);
            req.accept();
          });
        });
      smtp.listen(self.port, function () {
        console.log ('MailPipe server listen on port ' + self.port);
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

      self.smtp = smtp;
    }
    
  }

  this.send = function (file, from, rcpts, cb) {
    cb = cb || function () {};

    var self = this;

    var targets = _.map(rcpts, function (rcpt) { return _(rcpt).strLeft('@').split('+'); });
    var users = _.map(targets, function (mixes) { return q.nfcall(User.findOne.bind(User), { username: mixes[0] }); });

    var stat = null;
    var mail = null;

    q.nfcall(fs.stat, file)
      .then(function (data) {
        stat = data;

        var mailparser = new MailParser;
        var deferred = q.defer();

        mailparser.on('end', function (mail_object) {
          deferred.resolve(mail_object);
        });
        fs.createReadStream(file).pipe(mailparser); 

        return deferred.promise;  
      })
      .then(function (mail_object) {
        mail = mail_object;
        return q.all(users);
      })
      .then(function (founds) {
        var map = _.groupBy(founds, function (found) { return found.username; });
        _.each(targets, function (target) {
          target[0] = map[target[0]][0];
        });
        
        var next = _.map(targets, function (item) {
          return q.nfcall(Service.findOne.bind(Service), { user: item[0]._id, name: item[1], enable: true });
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

            var strategy = self.strategies.default;
            if (found.type && self.strategies[found.type]) {
              strategy = self.strategies[found.type];
            }

            var action = new strategy(found, mail);
            action.process(function (err, result) {
              if (err) { 
                found.success = false;
                found.error = err.message;
                found.counter.fail += 1;
                found.save();
              }
              else {
                found.success = true;
                found.counter.success += 1;
                found.save();
              }

              return deferred.resolve(found);
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

  this.use = function (stategy) {
    // Don't override strategy
    if (!this.strategies[strategy.name]) {
      this.strategies[strategy.name] = strategy;
    }
  }

}

var _instance = new Deliver;
Deliver.instance = function () {
  return _instance;
}

module.exports = Deliver;
