

const express = require('express');
const passport = require('passport');

const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/user/manage', adminController.getUserManage);
router.get('/user/authorize/:id', adminController.getUserAuthorize);
router.get('/user/unauthorize/:id', adminController.getUserUnauthorize);
router.get('/user/remove/:id', adminController.getUserRemove);
router.post('/approve-user-oa', adminController.postAprroveUserOa);
router.post('/disapprove-user-oa', adminController.postDisapproveUserOa);
router.post('/remove-user-oa', adminController.postRemoveUserOa);
router.get('/learning-object/manage', adminController.getLearningObjectManage);
router.get('/reports', adminController.getReports);
router.get('/reports/learning-objects', adminController.getLoReports);
router.get('/reports/learning-objects-results', adminController.getLoReportsResults);

router.get('/reports/users', adminController.getReportsUsers);

module.exports = router;
