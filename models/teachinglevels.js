const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const teaching_levels = new Schema({
  name: String,
});


module.exports = mongoose.model('TeachingLevels', teaching_levels);
