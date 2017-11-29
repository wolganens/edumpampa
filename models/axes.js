const mongoose = require('mongoose');

const { Schema } = mongoose;

const axes = new Schema({
  name: String,
});

module.exports = mongoose.model('Axes', axes);
