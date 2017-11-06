var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var teaching_levels = new Schema({
    name: String
});


module.exports = mongoose.model('TeachingLevels', teaching_levels );