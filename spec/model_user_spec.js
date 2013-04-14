var crypto = require('crypto'),
    should = require('chai').should(),
    sinon = require('sinon');

var User = require('../models/user');

describe('User', function () {

  describe('#save', function () {

    it ('should hash password before save', function (done) {

      var user = new User({
        email: 'sample@mail.com',
        password: 'password'
      });

      var stub = sinon.stub(user.collection, 'insert', function (user) {

        user.password.should.not.equal('password');
        stub.restore();

        done();
      });

      user.save();

    });

  });

  describe('#toObject', function () {

    it ('should remove password from output', function () {
      var user = new User({
        email: 'sample@mail.com',
        password: 'password'
      });

      var object = user.toObject();
      should.not.exist(object.password);
    });

    it ('should have timestamp', function () {
      var user = new User({
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
          email: 'sample@mail.com',
          password: crypto.createHash('sha256').update('password').digest('hex')
        });
      });

      it ('should return user', function (done) {

        User.authenticate('sample@mail.com', 'password', function (error, user) {

          should.not.exist(error);
          should.exist(user);

          done();
        });

      });

      it ('should return wrong password', function (done) {

        User.authenticate('sample@mail.com', 'wrongpass', function (error, user) {
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
        User.authenticate('sample@mail.com', 'password', function (error, user) {
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