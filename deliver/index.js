var Deliver = function () {

  this.send = function (file, from, rcpts, cb) {
    cb();
  }

}

var _instance = new Deliver;
Deliver.instance = function () {
  return _instance;
}

module.exports = Deliver;