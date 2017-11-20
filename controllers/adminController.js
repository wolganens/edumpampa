'use strict';


var LearningObject = require("../models/learningobject");
var User = require("../models/user");
var ac = require("../config/roles").grants
var InstitutionalLink = require('../models/institutional_link');
var OccupationArea = require('../models/occupation_area');
var Qualification = require('../models/qualifications');
var async = require('async');

module.exports.getUserManage = getUserManage;
module.exports.getLearningObjectManage = getLearningObjectManage;
module.exports.getUserAuthorize = getUserAuthorize;
module.exports.getUserUnauthorize = getUserUnauthorize;
module.exports.getReports = getReports;
module.exports.getReportsUsers = getReportsUsers;

function getUserManage(req, res) {
    const permission = ac.can(req.user.role).updateAny('user');
    if (!permission.granted) {
        res.status(403).send("Você não tem permissão!");
        return;
    }
    User.find(function(err, result) {
        if(err){
            res.send(err);
            return;
        }
        res.render('user_manage', {data: result, title: "Gerenciar usuários - EduMPampa"});
    })
}
function getUserAuthorize(req, res) {
    const permission = ac.can(req.user.role).updateAny('user');
    if (!permission.granted) {
        res.status(403).send("Você não tem permissão!");
        return;
    }
    User.findByIdAndUpdate(req.params.id, { $set: { role: 'AUTHORIZED' }},function (err, tank) {
        if (err) {
            res.send(err);
            return;
        }
        req.flash('success_messages', "Usuário autorizado com sucesso!");
        res.redirect('/admin/user/manage');
    });
}
function getUserUnauthorize(req, res) {
    const permission = ac.can(req.user.role).updateAny('user');
    if (!permission.granted) {
        res.status(403).send("Você não tem permissão!");
        return;
    }
    User.findByIdAndUpdate(req.params.id, { $set: { role: 'COMMON' }},function (err, tank) {
        if (err) {
            res.send(err);
            return;
        }
        req.flash('success_messages', "Usuário desautorizado com sucesso!");
        res.redirect('/admin/user/manage');
    });
}
function getLearningObjectManage(req, res) {
    const permission = ac.can(req.user.role).updateAny('learningObject');
    if (!permission.granted) {
        res.status(403).send("Você não tem permissão!");
        return;
    }
    LearningObject.find(function(err, result) {
        if (err) {
            res.send(err);
        }
        res.render('lo_manage', {data: result, title:"Gerenciar OA's - EduMPampa"});
    });
}
/*
    Página de relatórios
*/
function getReports(req, res) {
    async.parallel({
        institutional_links: function(callback) {
            InstitutionalLink.find(callback);
        },        
        occupation_areas: function(callback) {
            OccupationArea.find(callback);
        },
        qualifications: function(callback) {
            Qualification.find(callback);
        }        
    }, function(err, results) {
        res.render('admin_reports', {data: results, title: "Relatórios - EduMPampa"});
    });
}
/*
    Relatórios de usuários com base na área de atuação, formação e vínculo instituicional 
*/
function getReportsUsers(req, res) {
    let user_query_document = {};
    
    if (req.query.qualification_id) {
        user_query_document.qualification_id = req.query.qualification_id;
    } else if (req.query.qualification_text) {
        user_query_document.qualification_text = req.query.qualification_text;
    }

    if (req.query.occupation_area_id) {
        user_query_document.occupation_area_id = req.query.occupation_area_id;
    } else if (req.query.occupation_area_text) {
        user_query_document.occupation_area_text = req.query.occupation_area_text;
    }

    if (req.query.institutional_link_id) {
        user_query_document.institutional_link_id = req.query.institutional_link_id;
    } else if (req.query.institutional_link_text) {
        user_query_document.institutional_link_text = req.query.institutional_link_text;
    }
    return User.count(user_query_document, function(err, count) {
        return User.find(user_query_document, function(err, users){
            return res.render('admin_reports_users_results', {count: count, users: users, title: "Resultado do Relatório - EduMPampa"})
        });
    });
}