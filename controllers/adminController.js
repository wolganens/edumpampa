'use strict';


var LearningObject = require("../models/learningobject");
var User = require("../models/user");
var ac = require("../config/roles").grants

module.exports.getUserManage = getUserManage;
module.exports.getLearningObjectManage = getLearningObjectManage;
module.exports.getUserAuthorize = getUserAuthorize;
module.exports.getUserUnauthorize = getUserUnauthorize;

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