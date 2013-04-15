module.exports = {

  requiredLogin: function (req, res, next) {
    if (!req.user) { res.json(403, { error: 'access denied' }) }
    else { next(); }
  }

}