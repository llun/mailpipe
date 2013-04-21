var q = require('q');

var User = require('../models/user');

var UserRoute = {
  register: function (req, res) {
    User.register(req.body, function (err, user) {
      if (err) {
        var errors = [];
        for (var key in err.errors) {
          errors.push(err.errors[key].type);
        }
        req.flash('error', errors);
        res.redirect('/register.html');
      }
      else {
        req.flash('info', 'Register success');
        res.redirect('/login.html');
      }
    });
    
  },

  forget: function (req, res) {

  }
};

(function () {
  module.exports = UserRoute;
})();
