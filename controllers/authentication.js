

const passport = require('passport');

/**
 *  Uses Passport's local strategy to sign in a user
 */
module.exports = {
  signin(req, res, next) {
    return passport.authenticate('local', (authErr, user, info) => {
      console.log('user');
      console.log(user);
      console.log('autherror');
      console.log(authErr);
      console.log(info);
      if (authErr || !user) {
        return res.format({
          html() {
            req.flash('error_messages', info.message);
            req.session.historyData = info;
            return res.redirect('/account/signin');
          },
          // just in case :)
          text() {
            req.session.historyData = info;
            return res.redirect('/account/signin');
          },
          json() {
            return res.status(400).json(info);
          },
        });
      }
      return req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.format({
          html() {
            delete req.session.historyData;
            return res.redirect('/');
          },
          // just in case :)
          text() {
            delete req.session.historyData;
            return res.redirect('/');
          },
          json() {
            delete req.session.historyData;
            return res.status(200).json(user);
          },
        });
      });
    })(req, res, next);
  },
  signinGoogle() {
    console.log('signinGoogle....');
    return passport.authenticate('google', {
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
    });
  },
  signinGoogleCb() {
    return passport.authenticate('google', { failureRedirect: '/account/signin' }, (res) => {
      res.redirect('/');
    });
  },
  signout(req, res) {
    req.logout();
    delete req.session.historyData;
    return res.redirect('/');
  },
};
