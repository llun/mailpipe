var chai = require('chai'),
    should = chai.should(),
    sinon = require('sinon'),
    sinon_chai = require('sinon-chai');

chai.use(sinon_chai);

var User = require('../models/user'),
    Service = require('../models/service'),
    Message = require('../models/message');

describe('Deliver', function () {

  describe('#send', function () {

    var deliver;

    var findUserStub = null;
    var findServiceStub = null;
    var createMessageStub = null;

    before(function () {
      deliver = new Deliver;

      findUserStub = sinon.stub(User, 'findOne');
      findServiceStub = sinon.stub(Service, 'findOne');

      createMessageStub = sinon.stub(Message, function (message, cb) {

      });

    });

    after(function () {
      findUserStub.restore();
      findServiceStub.restore();
    });

    it ('should send request to both service', function (done) {
      deliver.send('/tmp/file.mail', 'someone@mail.com', [ 'user1+service1@mailpipe.me', 'user2+service1@mailpipe.me' ],
        function (err) {

        });
    });

  });

});