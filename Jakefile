var fs = require('fs'),
    mongoose = require('mongoose'),
    nconf = require('nconf'),
    path = require('path'),
    q = require('q'),
    scrypt = require('scrypt'),
    _ = require('underscore');

jake.addListener('complete', function () {
  process.exit(0);
});

namespace('db', function () {

  desc('Clean all data without drop database');
  task('safe_clean', { async: true }, function () {
    var database = require('./models/database');
    var User = require('./models/user');

    q.nfcall(User.remove.bind(User))
      .then(function () {
        return q.nfcall(mongoose.disconnect.bind(mongoose));
      })
      .then(function () {
        console.log ('All data removed');
        complete();
      });
  });

  desc('Drop database');
  task('clean', { async: true }, function () {
    var database = require('./models/database');

    database.db.dropDatabase((function () {
      console.log ('done');
    }));
  });

  desc('Drop database and seed all data');
  task('clean_seed', { async: true }, function () {
    var database = require('./models/database');

    database.db.dropDatabase((function () {
      jake.Task['db:seed'].invoke();
    }));

  });

  desc('Seed data without drop database');
  task('seed', { async: true }, function () {
    var database = require('./models/database');
    var User = require('./models/user');

    var password = scrypt.passwordHashSync('password', 0.1);
    q.nfcall(User.create.bind(User), [ { username: 'firstuser', email: 'firstuser@mailpipe.com', password: password }])
      .then(function () {
        return q.nfcall(mongoose.disconnect.bind(mongoose));
      })
      .then(function () {
        console.log ('Seed data complete');
        console.log ('Please login with username: firstuser password: password');
        console.log ('And go to your profile to change password');
        jake.emit('complete');
      })
      .fail(function (reason) {
        mongoose.disconnect(function () {
          console.log (reason.message);
          jake.emit('complete');
        });
      });
  });

});

namespace('tools', function () {

  desc('Update service counters')
  task('update_counter', { async: true }, function () {
    var database = require('./models/database');
    var Service = require('./models/service');
    var Message = require('./models/message');

    var _services = [];
    q.nfcall(Service.find.bind(Service))
      .then(function (services) {
        _services = services;
        var success = _.map(services, function (service) { 
          return q.nfcall(Message.count.bind(Message), { to: service._id.toString(), status: 'sent' });
        });
        var fail = _.map(services, function (service) {
          return q.nfcall(Message.count.bind(Message), { to: service._id.toString(), status: 'fail' });
        });

        var allSuccess = q.all(success);
        var allFail = q.all(fail);

        return q.all([allSuccess, allFail]);
      })
      .spread(function (success, fail) {
        if (_services.length === 0) return;

        var counters = _.zip(success, fail);
        _.each(_services, function (service, index) {
          service.counter.success = counters[index][0];
          service.counter.fail = counters[index][1];
        });

        var allServices = _.map(_services, function (service) {
          return q.nfcall(service.save.bind(service));
        });
        return q.all(allServices);
      })
      .done(function () {
        console.log ('Update completed');
        complete();
      });
  });

});

desc('Run all test')
task('test', { async: true }, function () {
  jake.exec(['mocha --reporter spec ' + __dirname + '/spec'], function () {
    complete();
  });
});

desc('Seed data');
task('default', function () {
  jake.Task['db:seed'].invoke();
});
