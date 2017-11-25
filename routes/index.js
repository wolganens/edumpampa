var express = require('express');
var router = express.Router();
var indexController = require('../controllers/indexController');
/* GET home page. */
router.get('/', indexController.getIndex);
router.get('/contact', indexController.getContact);
router.post('/contact', indexController.postContact);
router.get('/back', function(req, res){	
	return res.redirect('back');
})
module.exports = router;
