var q = require('q');

var User = require('../models/user');

var UserRoute = {
  register: function (req, res) {
    var email = req.body.email;

    var password = req.body.password;
    var confirm = req.body.confirm;

    // Validate email and password

    return q.nfcall(User.create.bind(User), [ { email:  } ])

    res.send('Hello, World');
  },

  forget: function (req, res) {

  }
};

(function () {
  module.exports = UserRoute;
})();
