var mongoose = require('mongoose');

var databaseURL = process.env.MONGO_URL || 'mongodb://localhost/mailpipe'
var database = mongoose.connect(databaseURL, {
    db: { native_parser: true },
    server: { keepAlive: 1 }
  });

module.exports = database;
