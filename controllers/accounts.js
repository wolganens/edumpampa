'use strict';

var _ = require('lodash');
var mongoose = require('mongoose');
var async = require('async');
const pug = require('pug');
var path = require('path');
var generator = require('generate-password');

var User = require('../models/user');
var InstitutionalLink = require('../models/institutional_link');
var InstitutionalPost = require('../models/institutional_post');
var OccupationArea = require('../models/occupation_area');
var Qualification = require('../models/qualifications');
var passwordHelper = require('../helpers/password');
var email = require('../config/email');

exports.getSignIn = function(req, res) {
    res.render('signin', {title: "Página de login de usuário - EduMPampa" });
}
exports.getSignUp = function(req,res) {
    async.parallel({
        institutional_links: function(callback) {
            InstitutionalLink.find(callback);
        },
        institutional_posts: function(callback) {
            InstitutionalPost.find(callback);
        },        
        occupation_areas: function(callback) {
            OccupationArea.find(callback);
        },
        qualifications: function(callback) {
            Qualification.find(callback);
        }        
    }, function(err, results) {
        res.render('signup', { error: err, data: results, title: "Página de cadastro de usuário - EduMPampa" });
        return;
    });
}
exports.postSignUp = function(req, res, next) {
    // TODO: refactor validation
    req.flash('inputs', req.body);
    var userData = _.pick(req.body, 'name', 'email', 'password', 'birthday', 'qualification_id', 'occupation_area_id', 'institutional_link_id', 'institution_name', 'institution_address', 'institutional_post_id[]', 'qualification_text', 'occupation_area_text', 'institutional_link_text', 'institutional_post_text');
    const [day, month, year] = userData.birthday.split("/")
    userData.birthday = new Date(year, month - 1, day);
    userData['institutional_post_id'] = userData['institutional_post_id[]'] ? userData['institutional_post_id[]'] : null;
    userData['qualification_id'] = userData['qualification_id'] ? userData['qualification_id'] : null;
    userData['occupation_area_id'] = userData['occupation_area_id'] ? userData['occupation_area_id'] : null;
    userData['institutional_link_id'] = userData['institutional_link_id'] ? userData['institutional_link_id'] : null;    
    if (userData._id) {
        console.log('tem id no form')
        userData['_id'] = req.body._id;
        User.findByIdAndUpdate(userData._id, userData, function(err, result) {
            if(err){
                return res.send(err);
            }
            req.flash('success_messages', "Perfil atualizado com sucesso!");
            return res.redirect('/account/profile');
        })
    } else {    
        if (req.body.password !== req.body.password_confirm) {
            var errors = {
                errors: {
                    "password_confirm": {"message": "As senhas informadas não conferem!"}
                }
            }
            req.flash('inputErrors', JSON.stringify(errors));
            return res.redirect('signup');
        }
        User.register(userData, function(err, user) {
            console.log(err);
            if (err && (11000 === err.code || 11001 === err.code)) {
                var errors = {
                    errors: {
                        "email": {"message": "Este email já está sendo utilizado!"}
                    }
                }
                req.flash('inputErrors', JSON.stringify(errors));
                return res.redirect('signup');
            }

            if (err) {
                req.flash('error_messages', 'Algo deu errado, tente novamente mais tarde');
                return res.redirect('/account/signup');
            }            
            let mailOptions = {                
                to: user.email,
                subject: 'Seja bem-vindo ao EduMPampa!',
                html: '<b>Olá ' + user.name + '</b><p>Seja bem-vindo ao EduMPampa</p>'
            };
            email.sendMail(mailOptions, function (err, info){
                if (err) {
                    return res.send(err);
                }                
            });

            req.logIn(user, function(err) {
                req.flash('success_messages', 'Seja bem-vindo ao EduMPampa '+ user.name +'!')
                res.redirect('/');
            });
        });
    }
};
exports.getForgotPw = function(req, res) {
    res.render('user_forgot_pw', {title: "Recuperar senha de acesso - EduMPampa"});
}
exports.postForgotPw = function(req, res) {
    async.waterfall([
        function(done) {
            User.findOne({ email: req.body.email }, function(err, user) {
                if (!user) {
                    req.flash('error_messages', 'Não há nenhum cadastro com este email!');
                    return res.redirect('/account/forgot-pw');
                }                    
                done(err, user);                
            });            
        },
        function(user, done) {
            var password = generator.generate({
                length: 8,
                numbers: true,
                symbols: true,
                strict: true
            });
            passwordHelper.hash(password, function(err, hashedPassword, salt, callback) {
                user.password = hashedPassword;
                user.passwordSalt = salt;

                user.save(function(err, saved) {
                    if (err) {
                        return callback(err, null);
                    }
                    done(err, user, password);
                });
            });
        },
        function(user, password, done) {                        
            let mailOptions = {                
                to: user.email,
                subject: 'Senha de acesso!',
                html: pug.renderFile(path.join(__appRoot, 'views', 'email_forgot_pw.pug'), {
                    name: user.name,
                    password: password
                })
            };
            email.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }
                done(error, "Senha enviada para o email informado!")                
            });     
        }
    ], function(err, success_msg) {
        if (err) {
            return next(err);
        }
        req.flash("success_messages", success_msg);
        res.redirect('/account/forgot-pw');
    });    
}
exports.getProfile = function(req, res) {
    async.parallel({
        institutional_links: function(callback) {
            InstitutionalLink.find(callback);
        },
        institutional_posts: function(callback) {
            InstitutionalPost.find(callback);
        },
        occupation_areas: function(callback) {
            OccupationArea.find(callback);
        },
        qualifications: function(callback) {
            Qualification.find(callback);
        },
        user:function(callback) {
            User.findById(req.user._id, callback)
        }
    }, function(err, results) {
        console.log(results.user)
        return res.render('signup', { error: err, data: results, title: "Minha conta - EduMPampa" });        
    });    
}
exports.getChangePw = function(req, res) {
    return res.render('user_change_pw');
}
exports.postChangePw = function(req, res) {
    return User.findById(req.user._id, function(err, user){
        if (err) {
            res.send(err);
        }
        return user.changePassword(req.body.old_pw, req.body.password, function(error, result){
            if (error) {
                res.send(error);
            }
            req.flash('success_messages', "Senha alterada com sucesso!");
            return res.redirect('/account/profile');
        })
    })    
}
