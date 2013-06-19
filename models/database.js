var mongoose = require('mongoose');

var databaseURL = process.env.MONGO_URL || 'mongodb://localhost/mailpipe'

// Below options is for Azure issue, http://stackoverflow.com/questions/13980236/does-mongodb-have-reconnect-issues-or-am-i-doing-it-wrong
var database = mongoose.connect(databaseURL, {
    server: { 
      auto_reconnect: true,
      poolSize: 10,
      socketOptions: {
        keepAlive: 1 
      }
    },
    db: {
      numberOfRetries: 10,
      retryMiliSeconds: 1000
    }
  });

module.exports = database;
