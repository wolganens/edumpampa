

const passport = require('passport');
const { OAuth2Strategy } = require('passport-google-oauth');
const mongoose = require('mongoose');

const User = mongoose.model('User');

module.exports = () => passport.use(new OAuth2Strategy(
  {
    clientID: '303825891357-bn5tssc9q4hncnrtippn1c8i744db31h.apps.googleusercontent.com',
    clientSecret: 'QKeCN2408js1eYIDLLoKlg2z',
    callbackURL: 'http://edumpampa.herokuapp.com/auth/oauth2callback',
  },
  ((accessToken, refreshToken, profile, cb) => {
    const jsonProfile = profile._json;
    const userData = {
      name: jsonProfile.displayName,
      google_id: jsonProfile.id,
      google: jsonProfile,
      email: jsonProfile.emails[0].value,
    };
    return User.findOne({ email: userData.email }, (err, user) => {
      const findUser = user;
      if (!findUser) {
        return User.create(userData, (createErr, createdUser) => {
          if (createErr) {
            return cb(createErr, null);
          }
          return cb(createErr, createdUser);
        });
      }
      if (!findUser.google) {
        findUser.google = userData.google;
        findUser.google_id = userData.google_id;
        return findUser.save((saveErr, savedUser) => {
          if (saveErr) {
            return cb(saveErr, null);
          }
          return cb(saveErr, savedUser);
        });
      }
      return cb(err, user);
    });
  }),
));
