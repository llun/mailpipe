// Main Application pages
module.exports = {

  index: function (req, res) {
    if (req.user) res.redirect('/main.html');
    else res.redirect('http://mailpipe.kickoffpages.com/');
  },

  main: function (req, res) {
    res.render('main');
  }
  
}
