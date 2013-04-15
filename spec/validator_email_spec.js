var should = require('chai').should();

var EmailValidator = require('../validator/email');

describe('EmailValidator', function () {

  describe('#validate', function () {

    var validator = new EmailValidator();

    it ('should return true', function (done) {

      validator.validate('natkung@gmail.com', function (error, result) {
        done();
      });

    });

  });

});