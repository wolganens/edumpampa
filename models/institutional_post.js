var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var institutional_post = new Schema({
    name: {
    	type: String,
    	unique: true,
    	maxlength: 200
    }
});

module.exports = mongoose.model('InstitutionalPost', institutional_post );