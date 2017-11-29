const mongoose = require('mongoose');

const { Schema } = mongoose;

const institutionalLink = new Schema({
  name: {
    type: String,
    unique: true,
    maxlength: 200,
  },
});

module.exports = mongoose.model('InstitutionalLink', institutionalLink);