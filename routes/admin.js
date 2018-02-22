const express = require('express');

const adminController = require('../controllers/adminController');

const router = express.Router();

router.use((req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    req.session.error_message = 'Acesso exclusivo para administradores';
    return res.redirect('back');
  }
  return next();
});

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
router.get('/reports/user-learning-objects', adminController.getUserLoReports);
router.get('/reports/learning-objects-results', adminController.getLoReportsResults);

router.get('/reports/users', adminController.getReportsUsers);

module.exports = router;
