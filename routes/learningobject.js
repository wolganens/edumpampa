const express = require('express');
const learningObjectController = require('../controllers/learningObjectController');
const router = express.Router();
const { authMiddleware } = require('../helpers/custom_middlewares');

router.get('/create', authMiddleware, learningObjectController.getCreate);
router.post('/create', authMiddleware, learningObjectController.postCreate);
router.post('/update', authMiddleware, learningObjectController.postUpdate);

router.post('/upload-file', authMiddleware, learningObjectController.postUploadFile);
router.post('/remove-file', authMiddleware, learningObjectController.postRemoveFile);

router.get('/single/:loId', learningObjectController.getLearningObject);
router.get('/details/:loId', learningObjectController.getLearningObjectDetails);
router.get('/retrieve', authMiddleware, learningObjectController.getMyLearningObjects);

router.get('/approve/:id', authMiddleware, learningObjectController.getApproveObject);
router.get('/remove/:id', authMiddleware, learningObjectController.getRemoveObject);

router.get('/text-search/:search_text?', learningObjectController.getTextSearch);
router.get('/checkbox-search', learningObjectController.postCheckBoxSearch);

router.get('/download/:id', authMiddleware, learningObjectController.getDownloadOaFile);

module.exports = router;
