var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var downloads = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    learning_object_id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    createdAt: {
        type: Date,
        default: new Date()
    }
});

module.exports = mongoose.model('Downloads', downloads );