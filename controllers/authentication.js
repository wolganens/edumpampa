

const passport = require('passport');
const mongoose = require('mongoose');

/**
 *  Uses Passport's local strategy to sign in a user
 */
exports.signin = function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err || !user) {
      return res.format({
        html() {
          req.flash('error_messages', info.message);
          req.session.historyData = info;
          res.redirect('/account/signin');
        },
        // just in case :)
        text() {
          req.session.historyData = info;
          res.redirect('/account/signin');
        },
        json() {
          res.status(400).json(info);
        },
      });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      res.format({
        html() {
          delete req.session.historyData;
          res.redirect('/');
        },
        // just in case :)
        text() {
          delete req.session.historyData;
          res.redirect('/');
        },
        json() {
          delete req.session.historyData;
          res.status(200).json(user);
        },
      });
    });
  })(req, res, next);
};
exports.signinGoogle = function (req, res, next) {
  console.log('signinGoogle....');
  passport.authenticate('google', {
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  });
};
exports.signinGoogleCb = function (req, res, next) {
  passport.authenticate('google', { failureRedirect: '/account/signin' }),
  function (req, res) {
    res.redirect('/');
  };
};

exports.signout = function (req, res, next) {
  req.logout();
  delete req.session.historyData;
  res.redirect('/');
};
