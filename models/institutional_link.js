var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var institutional_link = new Schema({
    name: {
    	type: String,
    	unique: true,
    	maxlength: 200
    }
});

module.exports = mongoose.model('InstitutionalLink', institutional_link );