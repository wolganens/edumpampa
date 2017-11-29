const mongoose = require('mongoose');

const { Schema } = mongoose;

const institutional_post = new Schema({
  name: {
    	type: String,
    	unique: true,
    	maxlength: 200,
  },
});

module.exports = mongoose.model('InstitutionalPost', institutional_post);
