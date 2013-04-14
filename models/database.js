var mongoose = require('mongoose');

var databaseURL = process.env.MONGO_URL || 'mongodb://localhost/mailpipe'
var database = mongoose.createConnection(databaseURL);

module.exports = database;