var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var learning_object_schema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        required: true
    },
    title: {
    	type: String,
    	maxlength: 255,
    	required: true,
    },
    description: {
    	type: String,
    	required: true
    },
    authors: {
    	type: String,
    	required: true
    },
    year: {
    	type: Number,
    	max: new Date().getFullYear(),
    	required: true
    },
    teaching_levels: {
    	type: [Schema.Types.ObjectId]
    },
    axes: {
    	type: [Schema.Types.ObjectId]
    },
    accessibility_resources: {
    	type: [Schema.Types.ObjectId]
    },
    content: {
    	type: [Schema.Types.ObjectId]
    },
    resources: {
    	type: [Schema.Types.ObjectId]
    },
    license: {
    	type: Schema.Types.ObjectId,
    	required: true
    },
    license_description: {
        type: String,
        required: false
    },
    license_owner: {
    	type: String,
    	required: true,
    },
    file: {
    	type: Object,
    	required: false
    },
    'file.name': {
        type: String
    },
    'file.size': {
        type: Number,
    },
    'file.mimetype': {
        type: String
    },
    'file.url': {
        type: String
    },
    file_url: {
    	type: String,
    	required: false
    },
    approved: {
        type: Boolean,
        required: true,
        default: false
    },
    createdAt: {
        type: Date,
        default: new Date()
    }
});

learning_object_schema.virtual('htmlSituation').get(function(){
    if (this.approved) {
        return '<div class="badge alert-success">Aprovado</div>'
    } else {
        return '<div class="badge alert-danger">Desaprovado</div>'
    }
})

module.exports = mongoose.model('LearningObject', learning_object_schema );