
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.login = function (req, res) {
  res.render('login', { title: 'Login' });
}

exports.register = function (req, res) {
  res.render('register', { title: 'Register' });
}

exports.forget = function (req, res) {
  res.render('forget', { title: 'Forget Password' });
}

exports.forget_result = function (req, res) {
  res.render('forget-result', { title: 'Forget password' });
}

exports.main = function (req, res) {
  res.render('main', { title: 'Main' });
}

exports.profile = function (req, res) {
  res.render('profile', { title: 'User Profile' });
};

exports.add = function (req, res) {
  res.render('new-service', { title: 'New service' });
}