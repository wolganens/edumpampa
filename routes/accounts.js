var express = require('express');
var router = express.Router();
var accountCtrl = require('../controllers/accounts');

router.get('/forgot-pw', accountCtrl.getForgotPw);
router.get('/profile', accountCtrl.getProfile);
router.post('/forgot-pw', accountCtrl.postForgotPw);
router.get('/signin', accountCtrl.getSignIn);
router.get('/signup', accountCtrl.getSignUp);
router.post('/signup', accountCtrl.postSignUp);

module.exports = router;