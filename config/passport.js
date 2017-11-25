'use strict';

var passport = require('passport');  
var mongoose = require('mongoose');  

var localStrategy = require('./strategies/local');
var googleStrategy = require('./strategies/google')

var User = mongoose.model('User');

module.exports = function(app) {  
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		User.findById(id, done);
	});

	// load strategies
	localStrategy();
	googleStrategy();
};
