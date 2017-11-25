var express = require('express');

var indexController = require('../controllers/indexController');

var router = express.Router();

router.get('/', indexController.getIndex);
router.get('/contact', indexController.getContact);
router.post('/contact', indexController.postContact);
router.get('/back', function(req, res){	
	return res.redirect('back');
})
module.exports = router;
