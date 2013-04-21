var chai = require('chai'),
    crypto = require('crypto'),
    should = require('chai').should(),
    sinon = require('sinon'),
    sinon_chai = require('sinon-chai'),
    q = require('q');

chai.use(sinon_chai);

require('mocha-as-promised')();

var User = require('../models/user');

describe('User', function () {

  describe('#save', function () {

    it ('should hash password before save', function (done) {

      var user = new User({
        username: 'test',
        email: 'sample@mail.com',
        password: 'password'
      });

      var stub = sinon.stub(user.collection, 'insert', function (user, options, callback) {
        user.password.should.not.equal('password');
        stub.restore();

        done();
      });

      user.save();
    });

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

  describe('#authenticate', function () {

    describe('user exist', function () {
      var stub = null;

      before(function () {
        stub = sinon.stub(User, 'findOne').callsArgWith(1, null, {
          username: 'test',
          email: 'sample@mail.com',
          password: crypto.createHash('sha256').update('password').digest('hex')
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