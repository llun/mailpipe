
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , less_middleware = require('less-middleware')
  , http = require('http')
  , moment = require('moment')
  , path = require('path')
  , fs = require('fs')
  , crypto = require('crypto')
  , simplesmtp = require('simplesmtp')
  , _ = require('underscore');
    
_.str = require('underscore.string');

var security = require('./security');

var Deliver = require('./deliver');
var Service = require('./models/service'),
    User = require('./models/user');

var UserRoute = require('./routes/user'),
    ServiceRoute = require('./routes/service');

var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

var flash = require('connect-flash');
var MongoStore = require('connect-mongo')(express);

var app = express();

// passport and security session
var cookieSecret = 'tUjurat6';
passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  },
  function(username, password, done) {
    User.authenticate(username, password, function (err, user) {
      return done(null, user, err);
    });
  }
));

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

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
app.configure(function () {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  app.use(express.cookieParser(cookieSecret));
  if (process.env.MONGO_URL) {
    app.use(express.session({
      secret: cookieSecret,
      store: new MongoStore({
        url: process.env.MONGO_URL || 'mongodb://localhost/mailpipe'
      })
    }));
  }
  else {
    app.use(express.session());
  }

  app.use(express.csrf());
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(function (req, res, next) {
    res.locals.token = req.session._csrf;
    res.locals.user = req.user;
    res.locals.flash = req.flash();
    next();
  });
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));  
});

app.locals.title = 'MailPipe';
app.locals.moment = moment;
app.locals._ = _;

// Welcome page
app.get('/', routes.index);

// Authorize page
app.get('/profile.html', security.requiredLogin, routes.profile);
app.get('/main.html', security.requiredLogin, routes.main);

// User actions
app.post('/users/register', UserRoute.register);

// Service actions
app.get   ('/services/add.html', security.requiredLogin, ServiceRoute.addPage);
app.get   ('/services/:name/update.html', security.requiredLogin, ServiceRoute.updatePage);

app.get   ('/services', security.requiredLogin, ServiceRoute.list);
app.post  ('/services', security.requiredLogin, ServiceRoute.add);
app.put   ('/services/:id', security.requiredLogin, ServiceRoute.update);
app.delete('/services/:id', security.requiredLogin, ServiceRoute.destroy);

// Gateway page
app.get('/register.html', routes.register);
app.get('/forget.html', routes.forget);
app.get('/forget-result.html', routes.forget_result);
app.get('/login.html', routes.login);
app.post('/users/login', passport.authenticate('local',
  { successRedirect: '/main.html',
    failureRedirect: '/login.html',
    failureFlash: true }));
app.get('/users/logout', routes.logout);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var deliver = new Deliver;
var smtp = simplesmtp.createServer({
  debug: false,
  SMTPBanner: 'Hello, This is redirector'
});
smtp.listen(process.env.SMTP || 2525, function () {
  console.log ('Redirector server listen on port ' + (process.env.SMTP || 2525));
});
smtp.on('startData', function (connection) {
  var tmpDirectory = process.env.TMP_DIR || '/tmp';
  var hash = crypto.createHash('sha1');
  hash.update(connection.from + new Date().getTime());
  connection.filename = hash.digest('hex') + '.mail';
  connection.saveStream = fs.createWriteStream(path.join(tmpDirectory, connection.filename));
});
smtp.on('data', function (connection, chunk) {
  connection.saveStream.write(chunk);
});
smtp.on('dataReady', function (connection, callback) {
  connection.saveStream.end();
  deliver.send(connection.filename, connection.from, connection.to);
  callback(null, 'MP3');
});
smtp.on('validateRecipient', function (connection, email, callback) {
  var domain = process.env.DOMAIN || 'mailpipe.me';
  Service.isValidAddress(email, domain, function (err) {
    if (err) {
      callback(err);
    }
    else {
      callback(null, 'MP2');
    }
  });
});
