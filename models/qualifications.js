var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var qualification = new Schema({
    name: {
    	type: String,
    	unique: true,
    	maxlength: 200
    }
});

module.exports = mongoose.model('Qualification', qualification );