const express = require('express');

const adminController = require('../controllers/adminController');
const {authMiddleware} = require('../helpers/custom_middlewares')

const router = express.Router();
/*
router.use((req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    req.session.error_message = 'Acesso exclusivo para administradores';
    return res.redirect('back');
  }
  return next();
});*/
router.use(authMiddleware);
router.get('/user/manage', adminController.getUserManage);
router.get('/user/authorize/:id', adminController.getUserAuthorize);
router.get('/user/unauthorize/:id', adminController.getUserUnauthorize);
router.post('/user/massAuthorize/', adminController.getMassUserAuthorize);
router.post('/user/massUnauthorize/', adminController.getMassUserUnauthorize);
router.post('/user/massRemove/', adminController.getMassUserRemove);
router.get('/user/remove/:id', adminController.getUserRemove);

router.get('/learning-object/manage', adminController.getLearningObjectManage);
router.post('/learning-object/set-approve', adminController.postLearningObjectSetApproveStatus);
router.post('/learning-object/remove', adminController.postLearningObjectRemove);

router.get('/learning-object/attributes', adminController.getAttributes);
router.post('/learning-object/postUpdateAttribute', adminController.postUpdateAttribute);
router.post('/learning-object/postCreateAttribute', adminController.postCreateAttribute);
router.get('/learning-object/getRemoveAttribute', adminController.getRemoveAttribute);

module.exports = router;
