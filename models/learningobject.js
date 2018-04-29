const mongoose = require('mongoose');

const { Schema } = mongoose;

const learningObjectSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  title: {
    type: String,
    maxlength: 255,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  authors: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    max: [new Date().getFullYear(), 'O ano de autoria não pode ser maior que o ano atual!'],
    required: true,
  },
  teaching_levels: [{ type: Schema.Types.ObjectId, ref: 'TeachingLevels' }],
  axes: [{ type: Schema.Types.ObjectId, ref: 'Axes' }],
  accessibility_resources: [{ type: Schema.Types.ObjectId, ref: 'AccessibilityResources' }],
  content: [{ type: Schema.Types.ObjectId, ref: 'Contents' }],
  resources: [{ type: Schema.Types.ObjectId, ref: 'Resources' }],
  license: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Licenses',
  },
  license_description: {
    type: String,
    required: false,
  },
  license_owner: {
    type: String,
    required: true,
  },
  file: {
    type: Object,
    required: [function required() {
      return !this.file_url;
    }, 'Envie um arquivo ou insira uma URL(para arquivos com mais de 20mb)'],
  },
  'file.name': {
    type: String,
  },
  'file.size': {
    type: Number,
  },
  'file.mimetype': {
    type: String,
  },
  'file.url': {
    type: String,
  },
  file_url: {
    type: String,
    required: [function required() {
      return !this.file;
    }, 'Envie um arquivo ou insira uma URL(para arquivos com mais de 20mb)'],
  },
  approved: {
    type: Boolean,
    required: true,
    default: false,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});
learningObjectSchema.virtual('htmlSituation').get(function htmlSituation() {
  if (this.approved) {
    return '<div class="badge alert-success">Habilitado</div>';
  }
  return '<div class="badge alert-danger">Desabilitado</div>';
});

module.exports = mongoose.model('LearningObject', learningObjectSchema);
