var chai = require('chai'),
    should = chai.should()
    sinon = require('sinon'),
    sinon_chai = require('sinon-chai'),
    chai_as_promised = require('chai-as-promised'),
    _ = require('underscore');

chai.use(sinon_chai);
chai.use(chai_as_promised);

require('mocha-as-promised')();

var Service = require('../models/service'),
    User = require('../models/user');

var ServiceRoute = require('../routes/service');

describe.skip('Service', function () {

  describe('#list', function () {

    it ('should return all services with user object', function (done) {
      var serviceAllStub = sinon.stub(Service, 'all').callsArgWith(1, null, [{
        name: 'Service1',
        target: 'http://somewhere.else/create/item',
        user: 'user1',
        timestamp: new Date(),
        enable: true,
        toJSON: function () {
          return _.omit(this, 'toJSON');
        }
      }]);
      var userStub = sinon.stub(User, 'findOne').callsArgWith(1, null, {
        _id: 'user1',
        username: 'user',
        email: 'user@mail.com',
        timestamp: new Date()
      });

      var req = {};
      var res = {
        json: function (output) {
          should.exist(output);
          output.should.have.length(1);

          output[0].user.should.be.an('object')
          output[0].user._id.should.equal('user1');

          done();
        }
      };

      ServiceRoute.list(req, res)
    });

  });

});
