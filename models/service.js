var database = require('./database'),
    mongoose = require('mongoose'),
    _s = require('underscore.string'),
    q = require('q');

var User = require('./user');

var schema = mongoose.Schema({
  name: { type: String, required: true, index: true, 
    set: function (val) {
      return val.toLowerCase();
    },
    validate: function (val) {
      return /[a-zA-Z]+\w+/.test(val);
    }},
  // User object id
  user: { type: String, required: true },
  type: { type: String, required: true },
  properties: { type: mongoose.Schema.Types.Mixed },
  counter: {
    success: { type: Number, required: true, default: 0 },
    fail: { type: Number, required: true, default: 0 }
  },
  enable: { type: Boolean, default: true, required: true },
  timestamp: { type: Date, default: Date.now }
});

schema.set('toObject', {
  getters: true,
  transform: function (doc, ret, options) {
    delete ret.__v;
    delete ret.id;
  }
});

var Service = database.model('Service', schema);
Service.add = function (user, input, cb) {
  input.user = user._id.toString();
  Service.findOne({ user: input.user, name: input.name }, function (err, service) {
    if (service) {
      return cb ({ message: 'Validation failed',
                   name: 'ValidationError',
                   errors: { name: 
                      { message: 'Validator "Invalid name" failed for path email with value `' + service.name + '`',
                        name: 'ValidatorError',
                        path: 'name',
                        type: 'Duplicate service name',
                        value: service.name } } });
    }
    else {
      Service.create(input, cb);
    }
  });
}

Service.all = function (user, cb) {
  Service.find({ user: user._id.toString() }).exec(cb);
}

Service.update = function (id, service, cb) {
  var filterFields = {
    $set: {
      name: service.name,
      type: service.type,
      properties: service.properties,
      enable: service.enable
    }
  }
  Service.findOneAndUpdate({ _id: id }, filterFields, cb);
}

Service.isValidAddress = function (address, domain, cb) {
  var pattern = new RegExp('^[\\w]+\\+[\\w]+@' + domain + '$', 'i');
  if (!pattern.test(address)) { return cb(new Error('Invalid e-mail address')); }

  var fragments = _s.strLeft(address, '@').split('+');
  var user = fragments[0];
  var service = fragments[1];

  q.nfcall(User.findOne.bind(User), { username: user })
    .then(function (user) {
      if (user) { return q.nfcall(Service.findOne.bind(Service), { name: service }); }
      return cb(new Error('User not found'));
    })
    .then(function (service) {
      if (service) { return cb(); }
      else { return cb(new Error('Service not found')); }
    })
    .fail(function (err) {
      return cb(err);
    })
    .done();
}

module.exports = Service;
