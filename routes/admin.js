'use strict';

var express = require('express');
var router = express.Router();
var adminController = require("../controllers/adminController");
var passport = require('passport');

router.get('/user/manage', adminController.getUserManage);
router.get('/user/authorize/:id', adminController.getUserAuthorize);
router.get('/user/unauthorize/:id', adminController.getUserUnauthorize);
router.get('/learning-object/manage', adminController.getLearningObjectManage);

module.exports = router;