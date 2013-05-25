var scrypt = require('scrypt'),
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
  password: { type: String, required: true },
  forget: { type: String },
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
      scrypt.verifyHash(user.password, password, function (err, result) {
        if (err) { return cb({ message: 'Wrong password' }); }
        return cb(null, user);
      });
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
        q.nfcall(User.findOne.bind(User), { email: user.email.toLowerCase() }),
        q.nfcall(scrypt.passwordHash.bind(scrypt), user.password, 0.1)
      ])
      .spread(function (userByUsername, userByEmail, hashPassword) {
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
          user.password = hashPassword;
          return User.create(user, cb);
        }
      });
  }
}

User.update = function (user, input, cb) {
  var storedUser = null;
  if (input.password !== input.confirm) {
    return cb ({ message: 'Validation failed',
                 name: 'ValidationError',
                 errors: { confirm: 
                   { message: 'Validator "Invalid confirm password" failed for path confirm with value `' + user.confirm + '`',
                     name: 'ValidatorError',
                     path: 'confirm',
                     type: 'Invalid confirm password',
                     value: user.confirm } } });
  }
  else {
    q.all([
      q.nfcall(User.findOne.bind(User), { _id: user._id }),
      q.nfcall(User.findOne.bind(User), { email: input.email.toLowerCase() })
      ])
      .spread(function (currentUser, conflictEmail, passwordHash) {
        if (conflictEmail && conflictEmail.email !== currentUser.email) {
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
          storedUser = currentUser;
          storedUser.email = input.email;
          if (input.password.length > 0) {
            scrypt.passwordHash(input.password, 0.1, function (err, hashPassword) {
              storedUser.password = hashPassword;
              return storedUser.save(cb);
            });
          }
          else {
            return storedUser.save(cb);
          }
        }
      });
  }
}

User.forget = function (email, cb) {

  User.findOne({ email: email }, function (err, user) {
    user.forget = User._randomString(10); 
    console.log(user.forget);
    user.save (function (err) {
      cb(err, user);
    });

  });

}

User.redeem = function (email, forgetcode, cb) {

  User.findOne({ email: email}, function (err, user) {
    if (user.forget === forgetcode) {
      user.forget = null;
      scrypt.passwordHash(User._randomString(10), 0.1, function (err, hash) {
        user.password = hash;
        cb(err, user);
      });
    }
  });

}

User._randomString = function (length) {
  var bits = length * 6;
  var chars, rand, i, ret;
  
  chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'; 
  ret = '';
  
  // in v8, Math.random() yields 32 pseudo-random bits (in spidermonkey it gives 53)
  while (bits > 0) {
    // 32-bit integer
    rand = Math.floor(Math.random() * 0x100000000); 
    // base 64 means 6 bits per character, so we use the top 30 bits from rand to give 30/6=5 characters.
    for (i = 26; i > 0 && bits > 0; i -= 6, bits -= 6) {
      ret += chars[0x3F & rand >>> i];
    }
  }
  
  return ret;
}

module.exports = User;
