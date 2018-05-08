const express = require('express');
const learningObjectController = require('../controllers/learningObjectController');
const router = express.Router();
const { authMiddleware } = require('../helpers/custom_middlewares');

/*Create*/
router.get('/create-first-step', authMiddleware, learningObjectController.getCreateFirstStep);
router.get('/create-second-step/:_id', authMiddleware, learningObjectController.getCreateSecondStep);
router.get('/create-third-step/:_id', authMiddleware, learningObjectController.getCreateThirdStep);

router.post('/create-first-step', authMiddleware, learningObjectController.postCreateFirstStep);
router.post('/create-second-step', authMiddleware, learningObjectController.postCreateSecondStep);
router.post('/create-third-step', authMiddleware, learningObjectController.postCreateThirdStep);

/*Update*/
router.get('/single/:loId', learningObjectController.getLearningObject);
router.post('/update', authMiddleware, learningObjectController.postUpdate);
router.post('/upload-file', authMiddleware, learningObjectController.postUploadFile);
router.post('/remove-file', authMiddleware, learningObjectController.postRemoveFile);
/*Update (Admin)*/
router.get('/approve/:id', authMiddleware, learningObjectController.getApproveObject);
router.get('/remove/:id', authMiddleware, learningObjectController.getRemoveObject);

/*Retrieve*/
router.get('/details/:loId', learningObjectController.getLearningObjectDetails);
router.get('/retrieve', authMiddleware, learningObjectController.getMyLearningObjects);
router.get('/text-search/:search_text?', learningObjectController.getTextSearch);
router.get('/checkbox-search', learningObjectController.postCheckBoxSearch);
router.get('/download/:id', authMiddleware, learningObjectController.getDownloadOaFile);

module.exports = router;
