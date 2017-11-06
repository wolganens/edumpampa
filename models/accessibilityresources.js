var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var accessibility_resources = new Schema({
    name: {
    	type: String,
    	unique: true,
    	maxlength: 200
    }
});

module.exports = mongoose.model('AccessibilityResources', accessibility_resources );