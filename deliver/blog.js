var OAuth = require('oauth').OAuth2;

var getInstance = function (service) {
  var instance = new OAuth(service.properties.key, 
    service.properties.secret,
    service.properties.url,
    null,
    '/oauth/token');
  return instance;
}

var Strategy = function () {

  this.name = 'blog';
  this.process = function (fn) {
  }

}

Strategy.fields = {
  url: { type: 'text', required: true },
  key: { type: 'text', required: true },
  secret: { type: 'text', required: true },
  token: { type: 'hidden' }
}

Strategy.after = function (service, req, res) {

  var redirectBack = 'http://' + req.app.locals.domain + '/oauth/blog';
  var properties = service.properties;
  res.json({ 
    action: 'redirect', 
    url: properties.url + '/oauth/authorize?response_type=code&client_id=' + properties.key + '&redirect_uri=' + redirectBack });
}

module.exports = Strategy;
