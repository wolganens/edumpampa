var AccessibilityResources = require("../models/accessibilityresources");
var Axes = require("../models/axes");
var TeachingLevels = require("../models/teachinglevels");

var async = require('async');

exports.index = function(req, res){    
	async.parallel({
        accessibility_resources: function(callback) {
            AccessibilityResources.find(callback);
        },
        axes: function(callback) {
            Axes.find(callback);
        },
        teaching_levels: function(callback) {
            TeachingLevels.find(callback);
        }        
    }, function(err, results) {
        res.render('index', { title: 'Repositório de Objetos de Aprendizagem', error: err, data: results });
    });
}