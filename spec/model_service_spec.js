var chai = require('chai'),
    crypto = require('crypto'),
    should = require('chai').should(),
    sinon = require('sinon'),
    sinon_chai = require('sinon-chai'),
    chai_as_prmised = require('chai-as-promised'),
    q = require('q');

chai.use(sinon_chai);
chai.use(chai_as_prmised);

require('mocha-as-promised')();

var Service = require('../models/service');

describe('Service', function () {

  describe('#save', function () {

    it ('should save successful', function () {
      var service = new Service({
        name: 'sample',
        user: 'user1',
        authentication: {
          type: 'none'
        },
        target: 'http://someservice.com/mail/create'
      });

      var stub = sinon.stub(service.collection, 'insert', function (service, options, cb) {
        console.log (service);
        cb(null, service);
      });

      return q.nfcall(service.save.bind(service))
        .fail(function (err) {
          should.not.exist(err);
        })
        .done(function () {
          stub.restore();
        });

    });

  });


});