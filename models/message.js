var database = require('./database'),
    mongoose = require('mongoose');

var schema = mongoose.Schema({
  from: { type: String, required: true, index: true },
  to: { type: String, required: true, index: true},
  content: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now }
});

schema.set('toObject', {
  getters: true,
  transform: function (doc, ret, options) {
    delete ret.content;
    delete ret.__v;
    delete ret.id;
  }
});

var Message = database.model('Message', schema);
module.exports = Message;
