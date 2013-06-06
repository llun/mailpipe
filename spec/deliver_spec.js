var chai = require('chai'),
    should = chai.should(),
    sinon = require('sinon'),
    sinon_chai = require('sinon-chai'),
    chai_as_promised = require('chai-as-promised'),
    _ = require('underscore'),
    nock = require('nock'),
    q = require('q'),
    rest = require('restler');

chai.use(sinon_chai);
chai.use(chai_as_promised);

require("mocha-as-promised")();

var User = require('../models/user'),
    Service = require('../models/service'),
    Message = require('../models/message');

var Deliver = require('../deliver');

describe('Deliver', function () {

  //Set max emitter to unlimited
  rest.Request.prototype.setMaxListeners(0);

  describe('#send', function () {

    var deliver;

    var findUserStub = null;
    var findServiceStub = null;
    var createMessageStub = null;

    var scope = null;

    before(function () {
      deliver = new Deliver;

      findUserStub = sinon.stub(User, 'findOne');
      findUserStub.withArgs({ username: 'user1' }).callsArgWith(1, null, { _id: 'u1', username: 'user1', email: 'user1@gmail.com' });
      findUserStub.withArgs({ username: 'user2' }).callsArgWith(1, null, { _id: 'u2', username: 'user2', email: 'user2@gmail.com' });
      findUserStub.callsArg(1, null, null);

      findServiceStub = sinon.stub(Service, 'findOne');
      findServiceStub.withArgs({ name: 'service1', user: 'u1', enable: true }).callsArgWith(1, null, { _id: 's1', name: 'service1', user: 'u1', target: 'http://llun.in.th/post#1', authentication: { type: 'none' }, enable: true });
      findServiceStub.withArgs({ name: 'service2', user: 'u1', enable: true }).callsArgWith(1, null, { _id: 's2', name: 'service2', user: 'u1', target: 'http://llun.in.th/post#2', authentication: { type: 'none' }, enable: true });
      findServiceStub.withArgs({ name: 'service1', user: 'u2', enable: true }).callsArgWith(1, null, { _id: 's3', name: 'service1', user: 'u2', target: 'http://llun.in.th/post#3', authentication: { type: 'none' }, enable: true });
      findServiceStub.withArgs({ name: 'service2', user: 'u2', enable: true }).callsArgWith(1, null, { _id: 's4', name: 'service2', user: 'u2', target: 'http://llun.in.th/action', authentication: { type: 'none' }, enable: true });
      findServiceStub.callsArg(1, null, null);

      createMessageStub = sinon.stub(Message, 'create', function (message, cb) {
        var cloneMessage = _.clone(message);
        cloneMessage._id = 'message1';

        cb(null, _.clone(cloneMessage));
      });

    });

    after(function () {
      findUserStub.restore();
      findServiceStub.restore();
    });

    beforeEach(function () {
      scope = nock('http://llun.in.th');
      scope.post('/post#1').reply(200, { success: true, data: 'post1' });
      scope.post('/post#2').reply(200, { success: true, data: 'post2' });
      scope.post('/post#3').reply(200, { success: true, data: 'post3' });
      scope.post('/post#4').reply(200, { success: true, data: 'post4' })
      scope.post('/action').reply(404, 'not found');
    });

    it ('should send request to both users', function () {
      return q.nfcall(deliver.send.bind(deliver), __dirname + '/sample.mail', 'someone@mail.com', [ 'user1+service1@mailpipe.me', 'user2+service1@mailpipe.me' ])
        .then(function (messages) {
          should.exist(messages);
          messages.should.have.length(2);

          _.each(messages, function (message) {
            message.status.should.equal(Message.STATUS.SENT);
            message.from.should.equal('someone@mail.com');
          });

          messages[0].to.should.equal('s1');
          messages[1].to.should.equal('s3');
        });
    });

    it ('should send request to both services', function () {
      return q.nfcall(deliver.send.bind(deliver), __dirname + '/sample.mail', 'someone@mail.com', [ 'user1+service1@mailpipe.me', 'user1+service2@mailpipe.me'])
        .then(function (messages) {
          should.exist(messages);
          messages.should.have.length(2);

          _.each(messages, function (message) {
            message.status.should.equal(Message.STATUS.SENT);
            message.from.should.equal('someone@mail.com');
          });

          messages[0].to.should.equal('s1');
          messages[1].to.should.equal('s2');
        });
    });

    it ('should return error for unknown service', function () {
      return q.nfcall(deliver.send.bind(deliver), __dirname + '/sample.mail', 'someone@mail.com', [ 'user1+service3@mailpipe.me' ])
        .fail(function (err) {
          should.exist(err);
          err.message.should.equal('Service not found');
        });
    });

    it ('should return error for service return 404', function () {
      return q.nfcall(deliver.send.bind(deliver), __dirname + '/sample.mail', 'someone@mail.com', [ 'user2+service2@mailpipe.me' ])
        .then(function (messages) {
          should.exist(messages);
          messages.should.have.length(1);

          messages[0].status.should.equal(Message.STATUS.FAIL);
          should.exist(messages[0].error);
        });
    });

    it ('should return only success message', function () {
      return q.nfcall(deliver.send.bind(deliver), __dirname + '/sample.mail', 'someone@mail.com', [ 'user1+service3@mailpipe.me', 'user1+service1@mailpipe.me', 'user1+service2@mailpipe.me' ])
        .then(function (messages) {
          should.exist(messages);
          messages.should.have.length(2);
        });
    });

  });

});
