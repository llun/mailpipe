var Strategy = function () {

  this.name = 'blog';
  this.process = function (fn) {
  }

}

Strategy.fields = {
  key: { type: 'text', required: true },
  secret: { type: 'text', required: true },
  token: { type: 'hidden' }
}

Strategy.validate = function (properties, fn) {
  fn();
}

module.exports = Strategy;
