const express = require('express');

const learningObjectController = require('../controllers/learningObjectController');

const router = express.Router();

router.get('/create', learningObjectController.getCreate);
router.post('/create', learningObjectController.postCreate);
router.post('/update', learningObjectController.postUpdate);

router.post('/upload-file', learningObjectController.postUploadFile);
router.post('/remove-file', learningObjectController.postRemoveFile);

router.get('/single/:loId', learningObjectController.getLearningObject);
router.get('/details/:loId', learningObjectController.getLearningObjectDetails);
router.get('/retrieve', learningObjectController.getMyLearningObjects);

router.get('/approve/:id', learningObjectController.getApproveObject);
router.get('/remove/:id', learningObjectController.getRemoveObject);

router.get('/text-search/:search_text?', learningObjectController.getTextSearch);
router.get('/checkbox-search', learningObjectController.postCheckBoxSearch);

router.get('/download/:id', learningObjectController.getDownloadOaFile);

module.exports = router;
