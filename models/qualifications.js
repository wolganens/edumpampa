const mongoose = require('mongoose');

const { Schema } = mongoose;

const qualification = new Schema({
  name: {
    type: String,
    unique: true,
    maxlength: 200,
  },
});

module.exports = mongoose.model('Qualification', qualification);
