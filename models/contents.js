const mongoose = require('mongoose');

const { Schema } = mongoose;

const contents = new Schema({
  name: {
    type: String,
    unique: true,
    maxlength: 200,
  },
});

module.exports = mongoose.model('Contents', contents);
