var chai = require('chai'),
    crypto = require('crypto'),
    should = require('chai').should(),
    sinon = require('sinon'),
    sinon_chai = require('sinon-chai'),
    chai_as_promised = require('chai-as-promised'),
    q = require('q');

chai.use(sinon_chai);
chai.use(chai_as_promised);

require('mocha-as-promised')();

var Service = require('../models/service'),
    User = require('../models/user');

describe('Service', function () {

  describe('#save', function () {

    it ('should save successful', function (done) {
      var service = new Service({
        name: 'sample',
        user: 'user1',
        properties: {
          username: 'username',
          password: 'password',
          target: 'http://someservice.com/mail/create'
        },
        type: 'default'
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

    it ('should save url with port successful', function (done) {
      var service = new Service({
        name: 'sample',
        user: 'user1',
        type: 'default',
        properties: {
          target: 'http://localhost:3000/mail/create'
        }
      });

      var stub = sinon.stub(service.collection, 'insert', function (service, options, cb) {
        cb(null, service);
      });

      service.save(function (err) {
        stub.restore();

        should.not.exist(err);
        done();
      });
    });

    it ('should lowercase service name', function (done) {
      var service = new Service({
        name: 'SAMPLE',
        user: 'user1',
        type: 'default',
        properties: {
          target: 'http://someservice.com/mail/create'
        }
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
          type: 'default',
          properties: {
            target: 'http://service.com/target'
          },
          timestamp: '2013-04-22T13:15:21.563Z'
        }, function (err, service) {
          var secondArgument = stub.args[0][1];
          secondArgument.should.deep.equal({
            $set: {
              name: 'new_name',
              type: 'default',
              properties: { target: 'http://service.com/target' },
              enable: true
            }
          });

          stub.restore();
          done();
        });
    });

  });

  describe('#isValidAddress', function () {

    var userStub = null;
    var serviceStub = null;

    before(function () {
      userStub = sinon.stub(User, 'findOne');
      userStub.withArgs({ username: 'user' }).callsArgWith(1, null, { _id: 'user', username: 'user' });
      userStub.callsArg(1);

      serviceStub = sinon.stub(Service, 'findOne');
      serviceStub.withArgs({ name: 'service' }).callsArgWith(1, null, { _id: 'service', name: 'service' });
      serviceStub.callsArg(1);
    });

    after(function() {
      userStub.restore();
      serviceStub.restore();
    });


    it ('should return true for address that has user and service in database', function (done) {
      return q.nfcall(Service.isValidAddress.bind(Service), 'user+service@mailpipe.me', 'mailpipe.me')
        .should.be.fulfilled;
    });

    it ('should return false for address that doesn\'t have plus sign', function () {
      return q.nfcall(Service.isValidAddress.bind(Service), 'noplussign@mailpipe.me', 'mailpipe.me')
        .should.be.rejected.with(Error, 'Invalid e-mail address');
    });

    it ('should return false for address that does\'t have user in database', function () {
      return q.nfcall(Service.isValidAddress.bind(Service), 'nouser+service@mailpipe.me', 'mailpipe.me')
        .should.be.rejected.with(Error, 'User not found');
    });

    it ('should return false for address that doesn\'t have service in database', function () {
      return q.nfcall(Service.isValidAddress.bind(Service), 'user+noservice@mailpipe.me', 'mailpipe.me')
        .should.be.rejected.with(Error, 'Service not found');
    });

  });

});
