var BasicStrategy = require('./basic')
  , BlogStrategy = require('./blog');

var strategies = {
  default: BasicStrategy,
  blog: BlogStrategy
}

module.exports = strategies;
