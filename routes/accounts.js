const express = require('express');

const accountCtrl = require('../controllers/accounts');

const router = express.Router();

router.post('/change-pw', accountCtrl.postChangePw);
router.get('/change-pw', accountCtrl.getChangePw);

router.get('/forgot-pw', accountCtrl.getForgotPw);
router.post('/forgot-pw', accountCtrl.postForgotPw);
router.get('/signin', accountCtrl.getSignIn);
router.get('/signup', accountCtrl.getSignUp);
router.post('/signup', accountCtrl.postSignUp);
router.get('/profile', accountCtrl.getProfile);
router.post('/update', accountCtrl.postUpdate);

module.exports = router;
