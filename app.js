
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , less_middleware = require('less-middleware')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , fs = require('fs')
  , simplesmtp = require('simplesmtp');

var app = express();

app.configure('development', function(){
  app.use(express.errorHandler());
  app.use(less_middleware({
    src: __dirname + '/public',
    force: true
  }));
});

app.configure('production', function() {
  app.use(less_middleware({src: __dirname + '/public'}));
});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', routes.index);
app.get('/login.html', routes.login);
app.get('/register.html', routes.register);
app.get('/forget.html', routes.forget);
app.get('/forget-result.html', routes.forget_result);
app.get('/profile.html', routes.profile);
app.get('/main.html', routes.main);
app.get('/services/add.html', routes.add);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var smtp = simplesmtp.createServer({
  debug: false,
  SMTPBanner: 'Hello, This is redirector'
});
smtp.listen(process.env.SMTP || 2525, function () {
  console.log ('Redirector server listen on port ' + (process.env.SMTP || 2525));
});
smtp.on('startData', function (connection) {
  console.log ('Message from:', connection.from);
  console.log ('Message to:', connection.to);
  connection.saveStream = fs.createWriteStream("/tmp/message.txt");
});
smtp.on('data', function (connection, chunk) {
  connection.saveStream.write(chunk);
});
smtp.on('dataReady', function (connection, callback) {
  connection.saveStream.end();
  console.log("Incoming message saved to /tmp/message.txt");
  callback(null, 'D1');
});
smtp.on('validateRecipient', function (connection, email, callback) {
  var domain = 'llun.in.th';
  var pattern = new RegExp('@' + domain + '$');
  if (pattern.test(email)) {
    callback(null, 'A2');
  }
  else {
    callback(new Error('Not allow recipient, we redirect to other webservice only, not email'));
  }
});
