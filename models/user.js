var crypto = require('crypto'),
    database = require('./database'),
    mongoose = require('mongoose');

var schema = mongoose.Schema({
  username: { type: String, required: true, index: true, unique: true },
  email: { type: String, required: true, index: true, unique: true },
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

schema.path('username').validate(function (val) {
  return /^[a-zA-Z]+\w*$/.test(val);
}, 'Invalid username');
schema.path('email').validate(function (val) {
  return /^[a-zA-Z]+[\+\w]*@\w+[\.\w]*\.\w+$/.test(val);
}, 'Invalid email');

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

User.register = function (user, cb) {
  if (user.password !== user.confirm) {
    cb ({ message: 'Validation failed',
          name: 'ValidationError',
          errors: { confirm: 
            { message: 'Validator "Invalid confirm password" failed for path confirm with value `' + user.confirm + '`',
              name: 'ValidatorError',
              path: 'confirm',
              type: 'Invalid confirm password',
              value: user.confirm } } })
  }
  else {
    User.create(user, cb);
  }
}

module.exports = User;