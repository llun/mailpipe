var chai = require('chai'),
    should = chai.should(),
    sinon = require('sinon'),
    sinon_chai = require('sinon-chai'),
    chai_as_promised = require('chai-as-promised'),
    _ = require('underscore'),
    nock = require('nock'),
    q = require('q');

chai.use(sinon_chai);
chai.use(chai_as_promised);

require("mocha-as-promised")();

var User = require('../models/user'),
    Service = require('../models/service'),
    Message = require('../models/message');

var Deliver = require('../deliver');

describe('Deliver', function () {

  describe('#send', function () {

    var deliver;

    var findUserStub = null;
    var findServiceStub = null;
    var createMessageStub = null;

    var scope = null;

    before(function () {
      deliver = new Deliver;

      scope = nock('http://llun.in.th')
        .post('/post')
        .reply(200, { success: true })
        .post('/action')
        .reply(404, 'not found');

      findUserStub = sinon.stub(User, 'findOne');
      findUserStub.withArgs({ username: 'user1' }).callsArgWith(1, null, { _id: 'u1', username: 'user1', email: 'user1@gmail.com' });
      findUserStub.withArgs({ username: 'user2' }).callsArgWith(1, null, { _id: 'u2', username: 'user2', email: 'user2@gmail.com' });
      findUserStub.callsArg(1, null, null);

      findServiceStub = sinon.stub(Service, 'findOne');
      findServiceStub.withArgs({ name: 'service1', user: 'u1' }).callsArgWith(1, null, { _id: 's1', name: 'service1', user: 'u1', target: 'http://llun.in.th/post', authentication: { type: 'none' } });
      findServiceStub.withArgs({ name: 'service2', user: 'u1' }).callsArgWith(1, null, { _id: 's2', name: 'service2', user: 'u1', target: 'http://llun.in.th/post', authentication: { type: 'none' } });
      findServiceStub.withArgs({ name: 'service1', user: 'u2' }).callsArgWith(1, null, { _id: 's3', name: 'service1', user: 'u2', target: 'http://llun.in.th/post', authentication: { type: 'none' } });
      findServiceStub.withArgs({ name: 'service2', user: 'u2' }).callsArgWith(1, null, { _id: 's4', name: 'service2', user: 'u2', target: 'http://llun.in.th/action', authentication: { type: 'none' } });
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

      nock.restore();
    });

    it.only ('should send request to both users', function () {
      return q.nfcall(deliver.send.bind(deliver), __dirname + '/sample.mail', 'someone@mail.com', [ 'user1+service1@mailpipe.me', 'user2+service1@mailpipe.me' ])
        .then(function (messages) {
          should.exist(messages);
          message.should.have.length(2);

          _.each(messages, function (message) {
            message.status.should.equal(Message.STATUS.SENT);
            message.from.should.equal('someone@mail.com');
          });

          message[0].to.should.equal('s1');
          message[1].to.should.equal('s3');
        });
    });

    it ('should send request to both services', function (done) {

      deliver.send(__dirname + '/sample.mail', 'someone@mail.com', [ 'user1+service1@mailpipe.me', 'user1+service2@mailpipe.me'],
        function (err, messages) {
          should.exist(messages);
          message.should.have.length(2);

          _.each(messages, function (message) {
            message.status.should.equal(Message.STATUS.SENT);
            message.from.should.equal('someone@mail.com');
          });

          message[0].to.should.equal('s1');
          message[1].to.should.equal('s2');

          done();
        });

    });

    it ('should return error for unknown service', function (done) {

      deliver.send(__dirname + '/sample.mail', 'someone@mail.com', [ 'user1+service3@mailpipe.me' ],
        function (err, messages) {
          should.exist(err);
          should.not.exist(messages);

          done();
        });

    });

    it ('should return error for service return 404', function (done) {

      deliver.send(__dirname + '/sample.mail', 'someone@mail.com', [ 'user2+service2@mailpipe.me' ],
        function (err, messages) {
          should.exist(err);
          should.not.exist(messages);

          done();
        });

    });

    it ('should return error and messages in case some messages is delivered', function (done) {

      deliver.send(__dirname + '/sample.mail', 'someone@mail.com', [ 'user1+service3@mailpipe.me', 'user1+service1@mailpipe.me', 'user1+service2@mailpipe.me' ],
        function (err, messages) {
          should.exist(err);
          should.exist(messages);

          messages.should.have.length(2);

          done();
        });

    });

  });

});