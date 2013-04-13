
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.login = function (req, res) {
  res.render('login', { title: 'Login' });
}

exports.main = function (req, res) {
  res.render('main', { title: 'Main' });
}

exports.add = function (req, res) {
  res.render('new-service', { title: 'New service' });
}