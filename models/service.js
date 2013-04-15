var database = require('./database'),
    mongoose = require('mongoose');

var schema = mongoose.Schema({
  name: { type: String, required: true, index: true },
  // This should link to user
  owner: { type: String, required: true },
  authentication: { type: String, required: true },
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