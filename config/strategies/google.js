

const passport = require('passport');
const { OAuth2Strategy } = require('passport-google-oauth');
const mongoose = require('mongoose');

const User = mongoose.model('User');

module.exports = function googleStrategy() {
  passport.use(new OAuth2Strategy(
    {
      clientID: '303825891357-bn5tssc9q4hncnrtippn1c8i744db31h.apps.googleusercontent.com',
      clientSecret: 'QKeCN2408js1eYIDLLoKlg2z',
      callbackURL: 'http://edumpampa.herokuapp.com/auth/oauth2callback',
    },
    ((accessToken, refreshToken, profile, cb) => {
      const userData = {
        name: profile._json.displayName,
        google_id: profile._json.id,
        google: profile._json,
        email: profile._json.emails[0].value,
      };
      User.findOne({ email: userData.email }, (err, user) => {
        console.log(user);
        if (!user) {
          User.create(userData, (err, user) => {
            if (err) {
              return cb(err, null);
            }
            return cb(err, user);
          });
        } else {
          if (!user.google) {
            user.google = userData.google;
            user.google_id = userData.google_id;
            user.save((err, user) => {
              if (err) {
                return cb(err, null);
              }
              return cb(err, user);
            });
          }
          return cb(err, user);
        }
      });
    }),

  ));
};
