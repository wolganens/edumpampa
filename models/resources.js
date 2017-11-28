const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const resources = new Schema({
  name: {
    	type: String,
    	unique: true,
    	maxlength: 200,
  },
});

module.exports = mongoose.model('Resources', resources);
