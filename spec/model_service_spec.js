var chai = require('chai'),
    crypto = require('crypto'),
    should = require('chai').should(),
    sinon = require('sinon'),
    sinon_chai = require('sinon-chai'),
    chai_as_prmised = require('chai-as-promised'),
    q = require('q');

chai.use(sinon_chai);
chai.use(chai_as_prmised);

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


});