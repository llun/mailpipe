var q = require('q');

var User = require('../models/user');

var UserRoute = {

  // Page methods
  registerPage: function (req, res) {
    res.render('register');
  },

  loginPage: function (req, res) {
    res.render('login');
  },

  profilePage: function (req, res) {
    res.render('profile', req.user);
  },

  forgetPage: function (req, res) {
    res.render('forget');
  },

  forgetResultPage: function (req, res) {
    res.render('forget-result');
  },

  // Action methods
  register: function (req, res) {
    User.register(req.body, function (err, user) {
      if (err) {
        req.flash('error', err);
        res.redirect('/users/register.html');
      }
      else {
        req.flash('info', 'Register success');
        res.redirect('/users/login.html');
      }
    });
    
  },

  logout: function (req, res) {
    req.logout();
    req.flash('info', 'Logout success');
    res.redirect('/users/login.html');
  },

  save: function (req, res) {
    var user = req.user;
    User.update(user, req.body, function (err) {
      if (err) {
        req.flash('error', err);
      }
      else {
        req.flash('info', 'Update success');
      }
      res.redirect('/users/profile.html');
    });
  },

  forget: function (req, res) {
    var email = req.body.email;
    User.forget(email, function (err, user) {
      if (err) {
        req.flash('error', err.message);
        res.redirect('/users/forget.html');
      }
      else {
        res.redirect('/users/forget-result.html'); 
      }
    });
  }
  
};

(function () {
  module.exports = UserRoute;
})();
