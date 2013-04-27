var database = require('./database'),
    mongoose = require('mongoose'),
    util = require('util');

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
  authentication: {
    type: { type: String, required: true, 
      validate: [ 
        function (val) {
          return /(none|basic|oauth)/.test(val);
        }, 'Invalid type'],
      set: function (val) {
        return val.toLowerCase();
      }},
    // Basic authentication, will use key as username and pass as password,
    // For oAuth, key is service key and pass is service secret.
    key: { type: String, default: '', validate: [
      function (val) {
        return this.authentication.type !== 'none' ? val.length > 0 : true;
      }, 'required' ] },
    pass: { type: String, default: '', validate: [
      function (val) {
        return this.authentication.type !== 'none' ? val.length > 0 : true;
      }, 'required' ] }
  },
  target: { type: String, required: true, validate: [
    function (val) {
      return /^(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@\?\^=%&:\/~\+#]*[\w\-\@?^=%&\/~\+#])?$/.test(val);
    }, 'Invalid URL'] },
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
  Service.findOne({ name: input.name }, function (err, service) {
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
      target: service.target,
      name: service.name,
      authentication: service.authentication,
      enable: service.enable
    }
  }
  Service.findOneAndUpdate({ _id: id }, filterFields, cb);
}

Service.isValidAddress = function (address, cb) {

}

module.exports = Service;