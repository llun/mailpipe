var q = require('q');

var User = require('../models/user');

var UserRoute = {
  register: function (req, res) {
    User.register(req.body, function (err, user) {
      if (err) {
        req.flash('error', err);
        res.redirect('/register.html');
      }
      else {
        req.flash('info', 'Register success');
        res.redirect('/login.html');
      }
    });
    
  },

  forget: function (req, res) {

  },

  profile: function (req, res) {
    res.render('profile', req.user);
  }
};

(function () {
  module.exports = UserRoute;
})();
