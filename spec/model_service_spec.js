var chai = require('chai'),
    crypto = require('crypto'),
    should = require('chai').should(),
    sinon = require('sinon'),
    sinon_chai = require('sinon-chai'),
    chai_as_promised = require('chai-as-promised'),
    q = require('q');

chai.use(sinon_chai);
chai.use(chai_as_promised);

var Service = require('../models/service');

describe('Service', function () {

  describe('#save', function () {

    it ('should save successful', function (done) {
      var service = new Service({
        name: 'sample',
        user: 'user1',
        authentication: {
          type: 'none'
        },
        target: 'http://someservice.com/mail/create'
      });

      var stub = sinon.stub(service.collection, 'insert', function (service, options, cb) {
        cb(null, service);
      });

      service.save(function (err) {
        stub.restore();

        should.not.exist(err);
        service.enable.should.be.true;
        
        done();
      });

    });

    it ('should error with required key and pass when authentication is not none', function (done) {
      var service = new Service({
        name: 'sample',
        user: 'user1',
        authentication: {
          type: 'basic'
        },
        target: 'http://someservice.com/mail/create'
      });

      var stub = sinon.stub(service.collection, 'insert', function (service, options, cb) {
        cb(null, service);
      });

      service.save(function (err) {
        stub.restore();
        should.exist(err);

        done();
      });

    });

    it ('should error with invalid url for invalid http service input', function (done) {
      var service = new Service({
        name: 'sample',
        user: 'user1',
        authentication: {
          type: 'none'
        },
        target: 'http/someservice.com/mail/create'
      });

      var stub = sinon.stub(service.collection, 'insert', function (service, options, cb) {
        cb(null, service);
      });

      service.save(function (err) {
        stub.restore();

        should.exist(err);
        done();
      });
    });

    it ('should lowercase service name', function (done) {
      var service = new Service({
        name: 'SAMPLE',
        user: 'user1',
        authentication: {
          type: 'basic'
        },
        target: 'http://someservice.com/mail/create'
      });

      var stub = sinon.stub(service.collection, 'insert', function (service, options, cb) {
        cb(null, service);
      });

      service.save(function (err) {
        service.name.should.equal('sample');

        stub.restore();
        done();
      });
    });

  });

  describe('#update', function () {

    it ('should not update permanent fields', function (done) {
      var stub = sinon.stub(Service, 'findOneAndUpdate').callsArg(2);

      Service.update('service1', 
        {
          _id: 'service1',
          __v: 0,
          name: 'new_name',
          user: {
            username: 'user1',
            email: 'user1@email.com',
            password: 'password',
            _id: 'user1',
            __v: 0,
            timestamp: '2013-04-22T13:15:21.563Z'
          },
          enable: true,
          authentication: { type: 'basic', key: 'key', pass: 'value'},
          target: 'http://service.com/target',
          timestamp: '2013-04-22T13:15:21.563Z'
        }, function (err, service) {
          var secondArgument = stub.args[0][1];
          secondArgument.should.deep.equal({
            $set: {
              name: 'new_name',
              enable: true,
              target: 'http://service.com/target',
              authentication: { type: 'basic', key: 'key', pass: 'value'}
            }
          });

          stub.restore();
          done();
        });
    });

  });


});