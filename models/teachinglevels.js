const mongoose = require('mongoose');

const { Schema } = mongoose;

const teachingLevels = new Schema({
  name: String,
});


module.exports = mongoose.model('TeachingLevels', teachingLevels);
