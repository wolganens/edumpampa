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

router.get('/learning-object/manage', adminController.getLearningObjectManage);
router.post('/learning-object/set-approve', adminController.postLearningObjectSetApproveStatus);
router.post('/learning-object/remove', adminController.postLearningObjectRemove);

module.exports = router;
