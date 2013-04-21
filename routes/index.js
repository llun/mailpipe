module.exports = {
  // Mocking pages
  index: function (req, res) {

    res.render('index');
  },
  forget: function (req, res) {
    res.render('forget');
  },
  forget_result: function (req, res) {
    res.render('forget-result');
  },
  main: function (req, res) {
    res.render('main');
  },
  profile: function (req, res) {
    res.render('profile');
  },
  add: function (req, res) {
    res.render('new-service');
  },
  update: function (req, res) {
    res.render('update-service');
  },

  // User gateway pages
  login: function (req, res) {
    res.render('login');
  },
  logout: function (req, res) {
    req.logout();
    res.redirect('/');
  },
  register: function (req, res) {
    res.render('register');
  },
  forget: function (req, res) {
    res.render('forget');
  },
}
