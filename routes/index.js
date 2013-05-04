module.exports = {
  // Mocking pages
  index: function (req, res) {
    if (req.user) res.redirect('/main.html');
    else res.redirect('http://mailpipe.kickoffpages.com/');
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
