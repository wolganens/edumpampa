

const express = require('express');
const passport = require('passport');

const authCtrl = require('../controllers/authentication');

const router = express.Router();

router.post('/signin', authCtrl.signin);
router.get(
  '/signin-google',
  passport.authenticate('google', {
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  }),
);
router.get(
  '/oauth2callback', passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/');
  },
);
router.get('/signout', authCtrl.signout);

module.exports = router;
