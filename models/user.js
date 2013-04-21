var crypto = require('crypto'),
    database = require('./database'),
    mongoose = require('mongoose'),
    q = require('q');

var schema = mongoose.Schema({
  username: { type: String, required: true, index: true, unique: true, 
    set: function (val) {
      return val.toLowerCase();
    }},
  email: { type: String, required: true, index: true, unique: true, 
    set: function (val) {
      return val.toLowerCase();
    }},
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
    // Move this to schema validator by extract new object which can make it as stub.
    q.all([
      q.nfcall(User.findOne.bind(User), { username: user.username.toLowerCase() }),
      q.nfcall(User.findOne.bind(User), { email: user.email.toLowerCase() })
      ])
      .spread(function (userByUsername, userByEmail) {
        if (userByUsername) {
          return cb ({ message: 'Validation failed',
                       name: 'ValidationError',
                       errors: { username: 
                          { message: 'Validator "Invalid username" failed for path username with value `' + user.username + '`',
                            name: 'ValidatorError',
                            path: 'username',
                            type: 'Duplicate username',
                            value: user.username } } });
        }
        else if (userByEmail) {
          return cb ({ message: 'Validation failed',
                       name: 'ValidationError',
                       errors: { email: 
                          { message: 'Validator "Invalid email" failed for path email with value `' + user.email + '`',
                            name: 'ValidatorError',
                            path: 'email',
                            type: 'Duplicate email',
                            value: user.username } } });
        }
        else {
          return User.create(user, cb);
        }
      });
  }
}

module.exports = User;