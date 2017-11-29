const mongoose = require('mongoose');

const { Schema } = mongoose;

const downloads = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  learning_object_id: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

module.exports = mongoose.model('Downloads', downloads);
