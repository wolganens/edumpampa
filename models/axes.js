var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var axes = new Schema({
    name: String
});

module.exports = mongoose.model('Axes', axes );