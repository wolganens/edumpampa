var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var licenses = new Schema({
    name: {
    	type: String,
    	unique: true,
    	maxlength: 80
    },
    deed: {
    	type: String,
    	unique: true,
    	maxlength: 150
    },
    legal: {
    	type: String,
    	unique: true,
    	maxlength: 150
    },
    description: {
    	type: String,
    	unique: true,
    	maxlength: 1000
    },
    image: {
    	type: String,
    	unique: true,
    	maxlength: 200
    },
});

module.exports = mongoose.model('Licenses', licenses );