var chai = require('chai'),
    scrypt = require('scrypt'),
    should = require('chai').should(),
    sinon = require('sinon'),
    sinon_chai = require('sinon-chai'),
    chai_as_promised = require('chai-as-promised'),
    q = require('q'),
    _ = require('underscore');

chai.use(sinon_chai);
chai.use(chai_as_promised);

require('mocha-as-promised')();

var User = require('../models/user');

describe('User', function () {

  describe('#save', function () {

    it ('should lowercase username before save', function (done) {
      var user = new User({
        username: 'MayThEE',
        email: 'email@gmail.com',
        password: 'password'
      });

      var stub = sinon.stub(user.collection, 'insert', function (user, options, cb) {
        user.username.should.equal('maythee');
        stub.restore();

        done();
      });

      user.save();

    });

    it ('should lowercase email before save', function (done) {
      var user = new User({
        username: 'MayThEE',
        email: 'EMaIl@GMAIL.com',
        password: 'password'
      });

      var stub = sinon.stub(user.collection, 'insert', function (user, options, cb) {
        user.email.should.equal('email@gmail.com');
        stub.restore();

        done();
      });

      user.save();
    });

    it ('should not allow invalid character in username', function (done) {

      var user = new User({
        username: 'llun&as',
        email: 'sample@gmail.com',
        password: 'password'
      });

      user.save(function (err) {
        should.exist(err, 'Username should have errors');
        err.message.should.equal('Validation failed');
        err.errors.username.type.should.equal('Invalid username');

        done();
      });

    });

    it ('should not allow invalid email format', function (done) {
      var user = new User({
        username: 'test',
        email: 'sample',
        password: 'password'
      });

      user.save(function (err) {
        should.exist(err, 'Email should have errors');
        err.message.should.equal('Validation failed');
        err.errors.email.type.should.equal('Invalid email');

        done();
      });
    });

  });

  describe('#toObject', function () {

    it ('should remove password from output', function () {
      var user = new User({
        username: 'test',
        email: 'sample@mail.com',
        password: 'password'
      });

      var object = user.toObject();
      should.not.exist(object.password);
    });

    it ('should have timestamp', function () {
      var user = new User({
        username: 'test',
        email: 'sample@mail.com',
        password: 'password'
      });

      var object = user.toObject();
      should.exist(object.timestamp);
    });

  });

  describe('#register', function () {

    var findStub = null;
    var createStub = null;

    before(function () {
      findStub = sinon.stub(User, 'findOne');
      findStub.withArgs({ username: 'user' }).callsArgWith(1, null, { username: 'user', password: 'hash', email: 'user@mail.com' });
      findStub.withArgs({ email: 'user@mail.com' }).callsArgWith(1, null, { username: 'user', password: 'hash', email: 'user@mail.com' });
      findStub.callsArg(1);

      createStub = sinon.stub(User, 'create', function (user, cb) {
        var registeredUser = _.clone(user);
        registeredUser._id = 'id';
        cb(null, registeredUser);
      });

    });

    after(function () {
      findStub.restore();
      createStub.restore();
    });

    it ('should hash password before register', function () {
      var user = {
        username: 'newuser',
        email: 'newuser@mail.com',
        password: 'password',
        confirm: 'password'
      }
      return q.nfcall(User.register.bind(User), user).should.be.fulfilled.then(function (registeredUser) {
        registeredUser.password.should.not.equal('password');
      });
    });

    it ('should return error when username already exist', function () {
      var user = {
        username: 'user',
        email: 'newuser@mail.com',
        password: 'password',
        confirm: 'password'
      }
      return q.nfcall(User.register.bind(User), user)
        .then(function (registeredUser) {
          should.not.exist(registeredUser);
        })
        .fail(function (err) {
          should.exist(err);
          err.message.should.equal('Validation failed');
        });
    });

    it ('should return error when email already exist', function () {
      var user = {
        username: 'newuser',
        email: 'user@mail.com',
        password: 'password',
        confirm: 'password'
      }
      return q.nfcall(User.register.bind(User), user)
        .then(function (registeredUser) {
          should.not.exist(registeredUser);
        })
        .fail(function (err) {
          should.exist(err);
          err.message.should.equal('Validation failed');
        });
    });

    it ('should return error when password and confirm is not match', function () {
      var user = {
        username: 'newuser',
        email: 'newuser@mail.com',
        password: 'password',
        confirm: 'notmatch'
      }
      return q.nfcall(User.register.bind(User), user)
        .then(function (registeredUser) {
          should.not.exist(registeredUser);
        })
        .fail(function (err) {
          should.exist(err);
          err.message.should.equal('Validation failed');
        });
    });

  });

  describe('#update', function () {

    var findStub = null;

    before(function () {
      findStub = sinon.stub(User, 'findOne');
      findStub.withArgs({ _id: 'user' }).callsArgWith(1, null, { _id: 'user', username: 'user', password: 'hash', email: 'user@mail.com' });
      findStub.withArgs({ username: 'user' }).callsArgWith(1, null, { _id: 'user', username: 'user', password: 'hash', email: 'user@mail.com' });
      findStub.withArgs({ email: 'user2@mail.com' }).callsArgWith(1, null, { _id: 'user2', username: 'user2', password: 'hash', email: 'user2@mail.com' });
      findStub.callsArg(1);
    });

    after(function () {
      findStub.restore();
    });

    it ('should return error when password and confirm is not match', function () {
      var user = { _id: 'user' };
      var input = {
        email: 'newemail@mail.com',
        password: 'password',
        confirm: 'confirm'
      };

      return q.nfcall(User.update.bind(User), user, input)
        .then(function (updatedUser) {
          should.not.exist(updatedUser);
        })
        .fail(function (err) {
          should.exist(err);
          err.message.should.equal('Validation failed');
        });
    });

    it.only ('should return error when email is conflicted with other', function () {
      var user = { _id: 'user', email: 'user@mail.com' };
      var input = {
        email: 'user2@mail.com',
        password: 'password',
        confirm: 'password'
      };

      return q.nfcall(User.update.bind(User), user, input)
        .then(function (updatedUser) {
          should.not.exist(updatedUser);
        })
        .fail(function (err) {
          should.exist(err);
          err.message.should.equal('Validation failed');
        });
    });

  });

  describe('#authenticate', function () {

    describe('user exist', function () {
      var stub = null;

      before(function () {
        stub = sinon.stub(User, 'findOne').callsArgWith(1, null, {
          username: 'test',
          email: 'sample@mail.com',
          password: scrypt.passwordHashSync('password', 0.1)
        });
      });

      it ('should return user', function (done) {

        User.authenticate('test', 'password', function (error, user) {

          should.not.exist(error);
          should.exist(user);

          done();
        });

      });

      it ('should return wrong password', function (done) {

        User.authenticate('test', 'wrongpass', function (error, user) {
          should.exist(error);
          should.not.exist(user);

          error.message.should.equal('Wrong password');

          done();
        });

      });

      after(function () {
        stub.restore();
      });
    });

    describe('user doesn\'t not exist', function () {
      var stub = null;

      before(function () {
        stub = sinon.stub(User, 'findOne').callsArgWith(1, {}, null);
      });

      it ('should return no user found', function (done) {
        User.authenticate('test', 'password', function (error, user) {
          should.exist(error);
          should.not.exist(user);

          error.message.should.equal('No user found');

          done();
        });

      });

      after(function () {
        stub.restore();
      });
    });

  });

});