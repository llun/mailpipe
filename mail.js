var cluster = require('cluster'),
		simplesmtp = require('simplesmtp'),
    newrelic = require('newrelic');

var Deliver = require('./deliver');
var argv = require('optimist')
    .alias('p', 'port')
    .alias('d', 'domain')
    .alias('f', 'fork')
    .argv;

var deliver = new Deliver(argv.p || process.env.SMTP || 2525, 
  argv.f || 1,
	argv.d || process.env.DOMAIN || 'mailpipe.me', 
	process.env.TMP_DIR || '/tmp');
deliver.start();
