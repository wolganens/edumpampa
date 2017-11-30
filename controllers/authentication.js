

const passport = require('passport');

/**
 *  Uses Passport's local strategy to sign in a user
 */
module.exports = {
  signin(req, res, next) {
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
  },
  signinGoogle() {
    console.log('signinGoogle....');
    passport.authenticate('google', {
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
    });
  },
  signinGoogleCb() {
    passport.authenticate('google', { failureRedirect: '/account/signin' }, (res) => {
      res.redirect('/');
    });
  },
  signout(req, res) {
    req.logout();
    delete req.session.historyData;
    res.redirect('/');
  },
};
