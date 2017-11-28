const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const axes = new Schema({
  name: String,
});

module.exports = mongoose.model('Axes', axes);
