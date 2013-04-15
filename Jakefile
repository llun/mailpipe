var fs = require('fs'),
    mongoose = require('mongoose'),
    nconf = require('nconf'),
    path = require('path'),
    q = require('q');

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

    q.nfcall(User.create.bind(User), [ { username: 'firstuser', email: 'firstuser@mailpipe.com', password: 'password' }])
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