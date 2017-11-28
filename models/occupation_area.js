const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const occupation_area = new Schema({
  name: {
    	type: String,
    	unique: true,
    	maxlength: 200,
  },
});

module.exports = mongoose.model('OccupationArea', occupation_area);
