'use strict';


var async = require('async');

var LearningObject = require("../models/learningobject");
var User = require("../models/user");
var ac = require("../config/roles");
var InstitutionalLink = require('../models/institutional_link');
var OccupationArea = require('../models/occupation_area');
var Qualification = require('../models/qualifications');
var AccessibilityResources = require("../models/accessibilityresources");
var Axes = require("../models/axes");
var TeachingLevels = require("../models/teachinglevels");
var LearningObject = require("../models/learningobject");
var Contents = require("../models/contents");
var Resources = require("../models/resources");

function getReqParamAsArray(reqparam) {
    if (reqparam) {
        if (Array.isArray(reqparam)) {
            return reqparam;
        } else {
            return [reqparam];
        }
    } else {
        return null;
    }
}

exports.getUserManage = function(req, res) {
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
exports.getUserAuthorize = function(req, res) {
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
exports.getUserUnauthorize = function(req, res) {
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
exports.getLearningObjectManage = function(req, res) {
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
exports.getReports = function(req, res) {
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
exports.getReportsUsers = function(req, res) {
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
exports.getUserRemove = function(req, res) {
    const permission = ac.can(req.user.role).deleteAny('user');
    if (!permission.granted) {
        return res.status(403).send("Você não tem permissão!");
    }
    return LearningObject.remove({owner: req.params.id}, function (err_lo, removed){
        if (err_lo){
            return res.send(err_lo);
        }
        return User.findByIdAndRemove(req.params.id, function(err_user, removed_user){
            if (err_user) {
                return res.send(err_user);
            }
            req.flash("success_messages", "Usuário removido com sucesso!");
            return res.redirect("/admin/user/manage");
        });
    });
}
/*
    Relatório de Objetos de aprendizagem
    */
exports.getLoReports = function(req, res) {
    const permission = ac.can(req.user.role).updateAny('learningObject');
    if (!permission.granted) {
        res.status(403).send("Você não tem permissão!");
        return;
    }
    async.parallel({
        accessibility_resources: function(callback) {
            AccessibilityResources.find(callback);
        },
        axes: function(callback) {
            Axes.find(callback);
        },
        teaching_levels: function(callback) {
            TeachingLevels.find(callback);
        },
        resources: function(callback) {
            Resources.find({}).sort('name').exec(callback);
        },
        contents: function(callback) {
            Contents.find({}).sort('name').exec(callback);
        },
    }, function(err, results) {
        if (err) {
            return res.send(err);
        }
        res.render('admin_reports_oa', { title: 'Relatórios OA - EduMPampa', data: results });
    });
}

exports.getLoReportsResults = function(req, res) {
    /*
        Variavel responsavel por armazenar os filtros de busca da query
    */
    let and = {
        "$and": []
    };
    /*
        Popula os arrays de consulta com os checkbox marcados pelo usuário
    */
    const q_acc_resources = req.query.accessibility_resources ? getReqParamAsArray(req.query.accessibility_resources) : [];
    const q_axes = req.query.axes ? getReqParamAsArray(req.query.axes) : [];
    const q_teaching_levels = req.query.teaching_levels ? getReqParamAsArray(req.query.teaching_levels) : [];
    const q_resources = req.query.resources ? getReqParamAsArray(req.query.resources) : [];
    const q_contents = req.query.contents ? getReqParamAsArray(req.query.contents) : [];
    if (q_acc_resources.length > 0) {
        and["$and"].push(
            {
                accessibility_resources: {$all: q_acc_resources}
            }
        );
    }
    if (q_axes.length > 0) {
        and["$and"].push(
            {
                axes: {$all: q_axes}
            }
        );
    }
    if (q_teaching_levels.length > 0) {
        and["$and"].push(
            {
                teaching_levels: {$all: q_teaching_levels}
            }
        );
    }
    if (q_contents.length > 0) {
        and["$and"].push(
            {
                content: {$all: q_contents}
            }
        );
    }
    if (q_resources.length > 0) {
        and["$and"].push(
            {
                resources: {$all: q_resources}
            }
        );
    }
    console.log(JSON.stringify(and) );
    LearningObject.aggregate([       
        {
            "$match": and
        },
        {
            $project: {title: "$title"}
        }
    ], function(err, result) {
        if (err) {
            return res.send(err);
        }
        return res.send(result);
    });
}
