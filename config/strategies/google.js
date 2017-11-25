'use strict';

var passport = require('passport');  
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var mongoose = require('mongoose');  

var User = mongoose.model('User');

module.exports = function() {  
    passport.use(
        new GoogleStrategy(
        {
            clientID:  "303825891357-bn5tssc9q4hncnrtippn1c8i744db31h.apps.googleusercontent.com" ,
            clientSecret:  "QKeCN2408js1eYIDLLoKlg2z" ,
            callbackURL: "http://edumpampa.herokuapp.com/auth/oauth2callback"
        },
        function(accessToken, refreshToken, profile, cb) {
            var userData = {
                name: profile._json.displayName,
                google_id: profile._json.id,
                google: profile._json,                
                email: profile._json.emails[0].value,
            }
            User.findOne({ email: userData.email }, function(err, user) {
                console.log(user);
                if (!user) {
                    User.create(userData, function(err, user) {
                        if (err) {
                            return cb(err, null);
                        }                        
                        return cb(err, user);
                    });
                } else {
                    if (!user.google) {
                        user.google = userData.google;
                        user.google_id = userData.google_id;
                        user.save(function(err, user){
                            if (err) {
                                return cb(err, null);
                            }
                            return cb(err, user);
                        })
                    }
                    return cb(err, user);
                    
                }
            });           
        }

    ));
};
