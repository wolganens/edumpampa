var express = require('express');
var router = express.Router();
var accountCtrl = require('../controllers/accounts');

router.post('/change-pw', accountCtrl.postChangePw);
router.get('/change-pw', accountCtrl.getChangePw);

router.get('/forgot-pw', accountCtrl.getForgotPw);
router.post('/forgot-pw', accountCtrl.postForgotPw);
router.get('/signin', accountCtrl.getSignIn);
router.get('/signup', accountCtrl.getSignUp);
router.post('/signup', accountCtrl.postSignUp);
router.get('/profile', accountCtrl.getProfile);

module.exports = router;