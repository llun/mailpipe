module.exports = {
  // Mocking pages
  index: function (req, res) {
    console.log ('hey');
    res.render('index', { title: 'Express' });
  },
  forget: function (req, res) {
    res.render('forget', { title: 'Forget Password' });
  },
  forget_result: function (req, res) {
    res.render('forget-result', { title: 'Forget password' });
  },
  main: function (req, res) {
    res.render('main', { title: 'Main' });
  },
  profile: function (req, res) {
    res.render('profile', { title: 'User Profile' });
  },
  add: function (req, res) {
    res.render('new-service', { title: 'New service' });
  },
  update: function (req, res) {
    res.render('update-service', { title: 'Update service' });
  },

  // User gateway pages
  login: function (req, res) {
    res.render('login', { title: 'Login' });
  },
  logout: function (req, res) {
    req.logout();
    res.redirect('/');
  },
  register: function (req, res) {
    res.render('register', { title: 'Register' });
  },
  forget: function (req, res) {
    res.render('forget', { title: 'Forget Password' });
  },
}
