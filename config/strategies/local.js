'use strict';

var passport = require('passport');  
var LocalStrategy = require('passport-local').Strategy;  
var mongoose = require('mongoose');  

var User = mongoose.model('User');

module.exports = function() {  
    passport.use('local', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    function(email, password, done) {
        User.authenticate(email, password, function(err, user) {
            if (err) {
                return done(err);
            }

            if (!user) {
                return done(null, false, { message: 'Email ou senha inválidos.' });
            }

            return done(null, user);
        });
    }
    ));
};
