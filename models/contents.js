var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var contents = new Schema({
    name: {
    	type: String,
    	unique: true,
    	maxlength: 200
    }
});

module.exports = mongoose.model('Contents', contents );