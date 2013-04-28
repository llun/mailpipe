var chai = require('chai'),
    should = chai.should(),
    sinon = require('sinon'),
    sinon_chai = require('sinon-chai'),
    _ = require('underscore'),
    nock = require('nock');

chai.use(sinon_chai);

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
        .reply(200, 'Hello, World');

      findUserStub = sinon.stub(User, 'findOne');
      findUserStub.withArgs({ username: 'user1' }).callsArgWith(1, { username: 'user1', email: 'user1@gmail.com' });
      findUserStub.withArgs({ username: 'user2' }).callsArgWith(1, { username: 'user2', email: 'user2@gmail.com' });
      findUserStub.callsArg(1);

      findServiceStub = sinon.stub(Service, 'findOne');
      findServiceStub.withArgs({ name: 'service1' }).callsArgWith(1, { _id: 's1', name: 'service1', target: 'http://llun.in.th/post#1', authentication: 'none' });
      findServiceStub.withArgs({ name: 'service2' }).callsArgWith(1, { _id: 's2', name: 'service2', target: 'http://llun.in.th/post#2', authentication: 'none' });
      findServiceStub.callsArg(1);

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

    it ('should send request to both service', function (done) {

      deliver.send(__dirname + '/sample.mail', 'someone@mail.com', [ 'user1+service1@mailpipe.me', 'user2+service1@mailpipe.me' ],
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

  });

});