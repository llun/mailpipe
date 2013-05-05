
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
  , _ = require('underscore');
    
_.str = require('underscore.string');

var security = require('./security');

var Deliver = require('./deliver');
var Service = require('./models/service'),
    User = require('./models/user');

var UserRoute = require('./routes/user'),
    ServiceRoute = require('./routes/service'),
    MessageRoute = require('./routes/message');

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

// Application pages
app.get   ('/', routes.index);
app.get   ('/main.html', security.requiredLogin, routes.main);

// User action pages and api
app.get   ('/register.html', UserRoute.registerPage);
app.get   ('/login.html', UserRoute.loginPage);
app.get   ('/forget.html', UserRoute.forgetPage);
app.get   ('/forget-result.html', UserRoute.forgetResultPage);
app.get   ('/profile.html', security.requiredLogin, UserRoute.profilePage);

app.post  ('/users/login', passport.authenticate('local',
            { successRedirect: '/main.html',
              failureRedirect: '/login.html',
              failureFlash: true }));
app.get   ('/users/logout', UserRoute.logout);
app.post  ('/users/register', UserRoute.register);
app.post  ('/users/save', security.requiredLogin, UserRoute.save);

// Service action pages and api
app.get   ('/services/add.html', security.requiredLogin, ServiceRoute.addPage);
app.get   ('/services/:name/update.html', security.requiredLogin, ServiceRoute.updatePage);

app.get   ('/services', security.requiredLogin, ServiceRoute.list);
app.post  ('/services', security.requiredLogin, ServiceRoute.add);
app.put   ('/services/:id', security.requiredLogin, ServiceRoute.update);
app.delete('/services/:id', security.requiredLogin, ServiceRoute.destroy);

// Messages action pages and api
app.get   ('/messages', security.requiredLogin, MessageRoute.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var deliver = new Deliver(process.env.SMTP, process.env.DOMAIN, process.env.TMP_DIR);
deliver.start();
