'use strict';

var passport = require('passport');
var mongoose = require('mongoose');
var async = require('async');
var path = require('path');
var fs = require('fs-extra');

var AccessibilityResources = require("../models/accessibilityresources");
var Axes = require("../models/axes");
var TeachingLevels = require("../models/teachinglevels");
var LearningObject = require("../models/learningobject");
var Downloads = require("../models/downloads");
var Contents = require("../models/contents");
var Resources = require("../models/resources");
var Licenses = require("../models/licenses");
var ac = require("../config/roles");
var email = require("../config/email");
var config = require("../config/index");

exports.getCreate = function(req, res) {
    const permission = ac.can(req.user.role).createOwn('learningObject');
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
        licenses: function(callback) {
            Licenses.find(callback);
        },
    }, function(err, results) {
        return res.render('lo_create', { error: err, data: results,title: "Cadastro de OA - EduMPampa" });        
    });
}
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
exports.postCreate = function (req, res) {
    const permission = !req.session.lo ? ac.can(req.user.role).createOwn('learningObject') : req.session.lo.owner.toString() == req.user._id ? ac.can(req.user.role).updateOwn('learningObject') : ac.can(req.user.role).updateAny('learningObject');
    if (!permission.granted) {
        return res.status(403).send("Você não tem permissão!")        
    }   
    const body = req.body;                        
    var learningObject = {
        owner:                      req.user._id,
        title:                      body.title,
        description:                body.description,
        license_owner:              body.license_owner,
        authors:                    body.authors,
        year:                       body.year,
        teaching_levels:            getReqParamAsArray(body['teaching_levels[]']),
        axes:                       getReqParamAsArray(body['axes[]']),
        accessibility_resources:    getReqParamAsArray(body['accessibility_resources[]']),
        content:                    getReqParamAsArray(body["contents[]"]),
        resources:                  getReqParamAsArray(body["resources[]"]),
        license:                    body.license,
        license_description:        body.license_description,
        file:                       body.file_name ? JSON.parse(body.file_name) : null,
        file_url:                   body.file_url ? body.file_url : null
    }        
    if (req.user.role == 'ADMIN') {
        learningObject.approved = true;
    }
    learningObject = new LearningObject(learningObject);
    learningObject.save(function(err, result) {
        if (err) {
            body['teaching_levels[]'] = getReqParamAsArray(body['teaching_levels[]'] || []);
            body['axes[]'] = getReqParamAsArray(body['axes[]'] || []);
            body['accessibility_resources[]'] = getReqParamAsArray(body['accessibility_resources[]'] || []);
            body['contents[]'] = getReqParamAsArray(body['contents[]'] || []);
            body['resources[]'] = getReqParamAsArray(body['resources[]'] || []);
            req.flash('inputs', body)
            req.flash('inputErrors', JSON.stringify(err))
            if (body.object_id) {
                return res.redirect('/learning-object/single/' + learningObject._id);
            } else {
                return res.redirect('/learning-object/create');
            }
        }
        var success_msg = "";
        if (body.object_id) {
            success_msg = "Objeto atualizado com sucesso!";
        } else if (req.user.role == 'ADMIN') {
            success_msg = "Objeto cadastrado com sucesso!";
        } else {
            success_msg = "Objeto submetido para aprovação com sucesso!";
            let mailOptions = {                
                to: "edumpampa@gmail.com",
                subject: "Novo OA submetido para aprovação",
                html: 
                `   <p>O usuário ${req.user.name} submeteu um OA chamado ${learningObject.title} para aprovação: </p>
                    <a href="${config.baseUrl}/admin/learning-object/manage/#${learningObject._id}">Ver OA</a>
                `
            };
            email.sendMail(mailOptions, function (err, info){
                if (err) {
                    return res.send(err);
                }                
            });
        }
        delete req.session.lo;
        req.flash('success_messages',  success_msg);
        res.redirect('/learning-object/single/' + learningObject._id);
    });
}
exports.getLearningObject = function(req, res) {
    let loId = req.params.loId;
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
            Resources.find(callback);
        },
        contents: function(callback) {
            Contents.find(callback);
        },
        licenses: function(callback) {
            Licenses.find(callback);
        },
        lo: function(callback) {
            LearningObject.findById(loId, callback);
        }
    }, function(err, results) {
        if (err) {
            return res.send(err);
        }
        if (req.user) {
            const permission = (req.user._id == results.lo.owner.toString()) ? ac.can(req.user.role).updateOwn('learningObject') : ac.can(req.user.role).updateAny('learningObject');
            
            if (!permission.granted) {            
                return res.redirect('/learning-object/details/'+results.lo._id);            
            } 
        } else {
            return res.redirect('/learning-object/details/'+results.lo._id);
        }
        req.session.lo = results.lo;
        return res.render('lo_update', { error: err, data: results });
    });
    return;
}
exports.getLearningObjectDetails = function (req, res) {
    let loId = req.params.loId;
    let results = {};    
    return LearningObject.findById(loId)
    .populate('teaching_levels')
    .populate('axes')
    .populate('accessibility_resources')
    .populate('license')        
    .exec(function(err, result){            
        results['lo'] = result;            
        return res.render('lo_details', { error: err, data: results, title: "Detalhes do Objeto de Aprendizagem - EduMPampa" });
    });    
}
exports.postUploadFile = function (req, res) {
    const file = req.files.file;

    var file_attrs = {};
    const storage_name = req.user._id + file.name;
    if (req.files && file) {
        file_attrs.name = file.name;
        file_attrs.mimetype = file.mimetype;
        file_attrs.size = req.headers['content-length'];
        file_attrs.url = path.join('/uploads', 'lo', storage_name);

        const file_path = path.join(__dirname, '..', 'public', 'uploads', 'lo', storage_name);

        fs.writeFileSync(file_path, file.data);    

        res.status(200).send({ file: file_attrs });
    } else {
        res.status(500).send({error: "Arquivo não especificado"})
    }
    return;
    
}
exports.postRemoveFile = function(req, res) {
    if (req.body.object_id) {
        const permission = req.session.lo.owner.toString() == req.user._id ? ac.can(req.user.role).updateOwn('learningObject') : ac.can(req.user.role).updateAny('learningObject');
        if (!permission.granted) {
            res.status(403).send("Você não tem permissão!")
            return;
        }   
        var lo = LearningObject.findById(req.body.object_id, function(err, result) {
            if(err) {
                res.status(500).send({error: err});
                return;
            }            
            result.file = null;
            result.save()
            const file_path = path.join(__dirname, '..', 'public', 'uploads', 'lo', req.user._id + req.body.file_name);
            fs.stat(file_path, function(err, stat) {
                if(!err) {
                    fs.unlink(file_path, function(err, res) {
                        if (err) {
                            res.status(500).send({error: err});
                        }                    
                    });
                }
            })        
        });
    } else {
        const file_path = path.join(__dirname, '..', 'public', 'uploads', 'lo', req.user._id + req.body.file_name);
        fs.stat(file_path, function(err, stat) {
            if(!err) {
                fs.unlink(file_path, function(err, res) {
                    if (err) {
                        res.status(500).send({error: err});
                    }                    
                });
            }
        })  
    }
    res.status(200).send({ success: "Arquivo removido com sucesso!" });
}
exports.getTextSearch = function(req, res) {
    const body = req.body;
    async.parallel({
        resources: function(callback) {
            Resources.find({}).sort('name').exec(callback);
        },
        contents: function(callback) {
            Contents.find({}).sort('name').exec(callback);
        }
    }, function(err, results) {
        if (err) {
            return res.send(err);
        }        
        /*
            Definição do termo de busca, através do campo "search_text (GET)"            
        */
        const search_text = req.query.search_text || req.query.search_text == '' ? req.query.search_text : req.session.search;
        req.session.search = search_text;
        /*
            Parâmetros adicionais de paginação
        */
        const page = req.query && req.query.page ? req.query.page : 1;
        const skip = (page - 1) * 10;
        const limit = 10;        

        /*
            Definição do objeto (documento) utilizado para trazer os registros do banco de dados, no caso uma busca por expressão regular é feita sobre o campo "title" dos objetos de aprendizagem
        */
        var query_object = {
            title: {
                "$regex": new RegExp(search_text), 
                "$options": "i"
            }
        };

        /*
            Inicia o processo de "montagem" da query de busca, projetando apenas os campos necessários,
            e trazendo apenas objetos já aprovados.
        */
        var cursor = LearningObject.find(query_object, 
            {
                "title": 1,
                "createdAt": 1,
                "description": 1
            }
        ).where('approved')        
        .equals(true);

        /* Caso o usuário esteja filtrando os resultados, adiciona os filtros na query de busca */        
        var selected_filters = {};
        if ("content" in req.query && req.query.content != '') {
            selected_filters['content'] = req.query.content;
            cursor.where('content').equals(req.query.content);
        }
        if ("resource" in req.query && req.query.resource != '') {
            selected_filters['resource'] = req.query.resource;
            cursor.where('resources').equals(req.query.resource);
        }        

        cursor.count(function(err, count) {            
            cursor.skip(skip).limit(limit).exec('find', function(err, lo) {
                if(err) {
                    return res.send(err);
                }
                /* Adiciona o objeto de aprendizagem nos resultados e renderiza a view */
                results['learning_object'] = lo;                
                return res.render('lo_search_results', {
                    data: results,
                    selected_filters: selected_filters,
                    search_text: search_text,
                    count: count,
                    pages: Math.ceil(count / 10),
                    currentPage: page,
                    queryUrl: req.originalUrl,
                    title: "Busca de objetos - EduMPampa"
                });
            });
        });        
    });
}
exports.postCheckBoxSearch = function(req, res) {
    const body = req.body;
    async.parallel({
        resources: function(callback) {
            Resources.find({}).sort('name').exec(callback);
        },
        contents: function(callback) {
            Contents.find({}).sort('name').exec(callback);
        }
    }, function(err, results) {
        /*
            Variavel responsavel por armazenar os filtros de busca da query
        */
        let and = {
            "$and": []
        };
        let checked_string = '';

        /*
            Parâmetros adicionais de paginação
        */
        const page = req.query && req.query.page ? req.query.page : 1;
        const skip = (page - 1) * 10;
        const limit = 10;
        

        /*
            Caso tenha sido selecionado algum checkbox para busca, constroi o and
        */
        if (req.query.checked_string) {            
            checked_string = req.query.checked_string;
            /*
                Popula os arrays de consulta com os checkbox marcados pelo usuário
            */
            const q_acc_resources = req.query.accessibility_resources ? getReqParamAsArray(req.query.accessibility_resources) : [];
            const q_axes = req.query.axes ? getReqParamAsArray(req.query.axes) : [];
            const q_teaching_levels = req.query.teaching_levels ? getReqParamAsArray(req.query.teaching_levels) : [];
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
            req.session.search = and;  
            req.session.checked_string = checked_string;
        } else {
            checked_string = req.session.checked_string;
            and = req.session.search;
        } 
        /*
            Inicia o processo de "montagem" da query de busca, projetando apenas os campos necessários,
            e trazendo apenas objetos já aprovados.
        */
        var cursor = LearningObject.find(and, 
            {
                "title": 1,
                "createdAt": 1,
                "description": 1
            }
        ).where('approved')        
        .equals(true);
        
        /* Caso o usuário esteja filtrando os resultados, adiciona os filtros na query de busca */        
        var selected_filters = {};
        if ("content" in req.query && req.query.content != '') {
            selected_filters['content'] = req.query.content;
            cursor.where('content').equals(req.query.content);
        }
        if ("resource" in req.query && req.query.resource != '') {
            selected_filters['resource'] = req.query.resource;
            cursor.where('resources').equals(req.query.resource);
        }
        cursor.count(function(err, count) {            
            cursor.skip(skip).limit(limit).exec('find', function(err, lo) {
                if(err) {
                    return res.send(err);
                }
                /* Adiciona o objeto de aprendizagem nos resultados e renderiza a view */
                results['learning_object'] = lo;                    
                return res.render('lo_search_results', {
                    data: results,
                    selected_filters: selected_filters,
                    checked_string: checked_string || "\"Nenhuma seleção\"",
                    count: count,
                    pages: Math.ceil(count / 10),
                    currentPage: page,
                    queryUrl: req.originalUrl
                });
            });
        });        
    });
}
exports.getApproveObject = function(req, res) {
    const permission = ac.can(req.user.role).updateAny('learningObject');
    if (!permission.granted) {
        res.status(403).send("Você não tem permissão!");
        return;
    }
    LearningObject.findById(req.params.id, function(err, result){
        if(err){
            res.send(err);
        }
        var lo_approved = result.approved;
        result.approved = !lo_approved;
        result.save();
        if(result.approved) {
            req.flash('success_messages', "Objeto aprovado com sucesso!");
        } else {
            req.flash('success_messages', "Objeto desaprovado com sucesso!");
        }
        res.redirect('/admin/learning-object/manage');
    })
}
exports.getRemoveObject = function (req, res) {
    return LearningObject.findById(req.params.id, {owner: 1, file: 1}, function (err, lo) {
        const permission = lo.owner.toString() == req.user._id.toString() ? ac.can(req.user.role).deleteOwn('learningObject') : ac.can(req.user.role).deleteAny('learningObject');
        
        if (!permission.granted) {
            return res.status(403).send("Você não tem permissão!")            
        }
        if (lo.file) {            
            const file_path = path.join(__dirname, '..', 'public', lo.file.url);
            return fs.stat(file_path, function(err, stat) {
                if (err) {
                    return res.send(err);
                }                
                return fs.unlink(file_path, function(err, unlink_res) {
                    lo.remove({
                        single: true 
                    })
                    req.flash('success_messages', "Objeto removido com sucesso!");
                    return res.redirect('back')
                });
            })
        }
        lo.remove({
            single: true
        })
        req.flash('success_messages', "Objeto removido com sucesso!");
        return res.redirect('back')
    });    
}
/*
    Página de listagem de OA's do usuário autenticado
*/
exports.getMyLearningObjects = function(req, res) {
    /*Apenas usuários autenticados podem ver seus OA's(Obviamente)*/
    if (!req.user) {
        req.flash("error_messages", "Página restrita para usuários cadastrados!");
        return res.redirect('/');
    }
    /*Busca na base de dados, OA's cujo dono é o usuário autenticado (req.user)*/
    return LearningObject.find(
        {
            owner: req.user._id
        }, 
        {
            "title": 1,
            "approved": 1
        }, function(err, lo) {
            if (err) {
                return res.send(err);
            }
            return res.render('lo_retrieve', {data: lo, title:"Meus objetos de aprendizagem"});
        }
    )
}
/*
    Baixar arquivo de um objeto de aprendizagem
*/
exports.getDownloadOaFile = function(req, res) {
    /*Apenas usuários autenticados podem baixar arquivos*/    
    if (! req.user ) {
        req.flash("error_messages", "Apenas usuários autenticados podem baixar arquivos");
        return res.redirect("back");
    }
    /*Busca o objeto pelo id passado na URL*/
    return LearningObject.findById(req.params.id, {title: 1, _id: 0, file: 1, file_url: 1}, function(err, lo){
        if (err) {
            return res.send(err);
        }
        /*Se o OA tiver um arquivo, retorna o download do mesmo e salva o registro do download*/
        if (lo.file) {
            return res.download(path.join(__dirname, '..', 'public', lo.file.url), lo.title, function(err, download){
                if (err) {
                    res.send(err);
                }
                return new Downloads({
                    user_id: req.user._id,
                    learning_object_id: req.params.id
                }).save();
            });
        /*Caso o OA não tenha um arquivo, se houver uma URL, redireciona o usuário para a URL*/            
        } else if (lo.file_url) {
            return new Downloads({
                user_id: req.user._id,
                learning_object_id: req.params.id
            }).save(function(err, download_id) {
                return res.redirect(lo.file_url);
            });
        /*Sem URL e sem Arquivo apenas retorna com erro*/
        } else {
            req.flash("error_messages", "O Objeto de aprendizagem não posui arquivos");
            return res.redirect("back");
        }
    });    
}
