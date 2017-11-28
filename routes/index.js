const express = require('express');

const indexController = require('../controllers/indexController');

const router = express.Router();

router.get('/', indexController.getIndex);
router.get('/contact', indexController.getContact);
router.post('/contact', indexController.postContact);
router.get('/back', (req, res) => res.redirect('back'));
module.exports = router;
