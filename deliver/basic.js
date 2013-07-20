var rest = require('restler')
  , _s = require('underscore.string');

var Strategy = function (service, content) {

  this.name = 'http';
  this.process = function (fn) {
    var properties = {};
    if (service.properties.authenticate) {
      properties.username = service.properties.username;
      properties.password = service.properties.password;
    }

    rest.postJson(service.properties.target, content, properties)
      .on('success', function (data) {
        fn(null, true, data);
      })
      .on('fail', function (data, response) {
        var fail = new Error('Service response: ' + response.statusCode);
        fn(fail);
      })
      .on('error', function (err) {
        fn(err);
      });
  }
}

Strategy.fields = {
  username: { type: 'text', required: true },
  password: { type: 'password', required: true },
  target: { type: 'text', required: true } 
}

module.exports = Strategy;
