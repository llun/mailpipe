var crypto = require('crypto'),
    database = require('./database'),
    mongoose = require('mongoose');

var schema = mongoose.Schema({
  username: { type: String, required: true, index: true },
  email: { type: String, required: true, index: true },
  password: { type: String, required: true,
    set: function (val) {
      var sha = crypto.createHash('sha256');
      sha.update(val);
      return sha.digest('hex');
    }},
  timestamp: { type: Date, default: Date.now }
});

schema.set('toObject', {
  getters: true,
  transform: function (doc, ret, options) {
    delete ret.password;
    delete ret.__v;
    delete ret.id;
  }
});

var User = database.model('User', schema);
User.authenticate = function (username, password, cb) {
  User.findOne({ username: username }, function (err, user) {
    if (user) {
      var sha = crypto.createHash('sha256');
      sha.update(password);
      if (sha.digest('hex') === user.password) {
        cb(null, user);
      }
      else {
        cb({ message: 'Wrong password' });
      }
    }
    else {
      cb({ message: 'No user found' });
    }
  });
}

module.exports = User;