var express = require('express');
var router = express.Router();
var learningObjectController = require('../controllers/learningObjectController');
/* GET home page. */
router.get('/create', learningObjectController.getCreate);
router.post('/create', learningObjectController.postCreate);

router.post('/upload-file', learningObjectController.postUploadFile);
router.post('/remove-file', learningObjectController.postRemoveFile);

router.get('/single/:loId', learningObjectController.getLearningObject);

router.get('/approve/:id', learningObjectController.getApproveObject);
router.get('/remove/:id', learningObjectController.getRemoveObject);

router.post('/text-search', learningObjectController.postTextSearch);
router.post('/checkbox-search', learningObjectController.postCheckBoxSearch);
module.exports = router;
