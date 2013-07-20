var OAuth = require('oauth').OAuth2;

var getInstance = function (service) {
  var instance = new OAuth(service.properties.key, 
    service.properties.secret,
    service.properties.url,
    null,
    '/oauth/token');
  return instance;
}

var Strategy = function (service, content) {

  this.name = 'blog';
  this.process = function (fn) {

    var instance = getInstance(service);
    var url = service.properties.url + '/cards/mail';

    instance._request('POST', url, 
      { 'content-type': 'application/json' }, 
      JSON.stringify(content), 
      service.properties.token,
      function (err, response) {
        if (err) return fn(err);
        return fn(null, true, response);
      });

  }

}

Strategy.fields = {
  url: { type: 'text', required: true },
  key: { type: 'text', required: true },
  secret: { type: 'text', required: true },
  token: { type: 'hidden' }
}

Strategy.after = function (service, req, res) {

  var redirectBack = 'http://' + req.app.locals.domain + '/service/oauth/' + service.id;
  var properties = service.properties;
  res.json({ 
    action: 'redirect', 
    url: properties.url + '/oauth/authorize?response_type=code&client_id=' + properties.key + '&redirect_uri=' + redirectBack });
}

Strategy.authorize = function (service, code, fn) {
  var instance = getInstance(service);
  instance.getOAuthAccessToken(code, { grant_type: 'authorization_code' }, fn);
}

module.exports = Strategy;
