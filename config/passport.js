const passport = require('passport');
const mongoose = require('mongoose');

const localStrategy = require('./strategies/local');
const googleStrategy = require('./strategies/google');

const User = mongoose.model('User');

module.exports = function configPassport() {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, done);
  });

  // load strategies
  localStrategy();
  googleStrategy();
};
