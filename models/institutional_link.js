const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const institutional_link = new Schema({
  name: {
    	type: String,
    	unique: true,
    	maxlength: 200,
  },
});

module.exports = mongoose.model('InstitutionalLink', institutional_link);
