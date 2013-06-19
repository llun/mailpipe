var cluster = require('cluster');
var argv = require('optimist')
    .alias('p', 'port')
    .alias('c', 'cookie')
    .alias('d', 'domain')
    .alias('f', 'fork')
    .argv;

var totalProcess = argv.f || 1;

if (cluster.isMaster) {
  for (var i = 0; i < totalProcess; i++) {
    cluster.fork();
  }

  cluster.on('disconnect', function(worker) {
    console.error('disconnect!');
    cluster.fork();
  });
}
else {
  /**
   * Module dependencies.
   */
  var domain = require('domain');
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
  var cookieSecret = argv.c || 'tUjurat6';
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
    app.set('port', argv.p || process.env.PORT || 3000);
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
          url: process.env.MONGO_URL || 'mongodb://localhost/mailpipe',
          auto_reconnect: true
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

      var d = domain.create();
      d.on('error', function (er) {
        console.error('error', er.stack);
        res.statusCode = 500;
        res.end(err.message + '\n');
        d.dispose();
      });

      d.enter();
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
  app.get   ('/users/register.html', UserRoute.registerPage);
  app.get   ('/users/login.html', UserRoute.loginPage);
  app.get   ('/users/forget.html', UserRoute.forgetPage);
  app.get   ('/users/forget-result.html', UserRoute.forgetResultPage);
  app.get   ('/users/profile.html', security.requiredLogin, UserRoute.profilePage);
  
  app.post  ('/users/login', passport.authenticate('local',
              { successRedirect: '/main.html',
                failureRedirect: '/users/login.html',
                failureFlash: true }));
  app.get   ('/users/logout', UserRoute.logout);
  app.post  ('/users/register', UserRoute.register);
  app.post  ('/users/save', security.requiredLogin, UserRoute.save);
  app.post  ('/users/forget', UserRoute.forget);
  
  // Service action pages and api
  app.get   ('/services/add.html', security.requiredLogin, ServiceRoute.addPage);
  app.get   ('/services/:name/update.html', security.requiredLogin, ServiceRoute.updatePage);
  
  app.get   ('/services', security.requiredLogin, ServiceRoute.list);
  app.post  ('/services', security.requiredLogin, ServiceRoute.add);
  app.put   ('/services/:id', security.requiredLogin, ServiceRoute.update);
  app.delete('/services/:id', security.requiredLogin, ServiceRoute.destroy);
  
  // Messages action pages and api
  app.get   ('/messages', security.requiredLogin, MessageRoute.list);
  
  app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
  });
}
