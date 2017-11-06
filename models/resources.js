var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var resources = new Schema({
    name: {
    	type: String,
    	unique: true,
    	maxlength: 200
    }
});

module.exports = mongoose.model('Resources', resources );