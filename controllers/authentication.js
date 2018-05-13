

const passport = require('passport');

/**
 *  Uses Passport's local strategy to sign in a user
 */
module.exports = {
  signin(req, res, next) {
    return passport.authenticate('local', (authErr, user, info) => {
      if (authErr || !user) {
        req.session.error_message = info.message;
        req.flash('body', req.body);
        return res.redirect('back');
      }
      return req.logIn(user, (err) => {
        if (err) {
          req.session.error_message = err.error;
          return res.redirect('back');
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
