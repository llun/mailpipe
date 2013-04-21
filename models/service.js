var database = require('./database'),
    mongoose = require('mongoose');

var schema = mongoose.Schema({
  name: { type: String, required: true, index: true },
  // User object id
  user: { type: String, required: true },
  authentication: {
    type: { type: String, required: true, validate: [ 
      function (val) {
        return /(none|basic|oauth)/.test(val);
      }, 'Invalid type'] },
    // Basic authentication, will use key as username and pass as password,
    // For oAuth, key is service key and pass is service secret.
    key: { type: String, validate: [
      function (val) {

      }, 'required' ] },
    pass: { type: String }
  },
  target: { type: String, required: true },
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
module.exports = Service;