const mongoose = require('mongoose');

const { Schema } = mongoose;

const accessibilityResources = new Schema({
  name: {
    type: String,
    unique: true,
    maxlength: 200,
  },
});

module.exports = mongoose.model('AccessibilityResources', accessibilityResources);
