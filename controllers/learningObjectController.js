'use strict';

/**
 *  Module dependencies
 */
var passport = require('passport');
var mongoose = require('mongoose');
var async = require('async');
var AccessibilityResources = require("../models/accessibilityresources");
var Axes = require("../models/axes");
var TeachingLevels = require("../models/teachinglevels");
var LearningObject = require("../models/learningobject");
var Contents = require("../models/contents");
var Resources = require("../models/resources");
var Licenses = require("../models/licenses");
var path = require('path');
var fs = require('fs-extra');
var ac = require("../config/roles").grants

module.exports.getCreate = getCreate;
module.exports.postCreate = postCreate;
module.exports.postUploadFile = postUploadFile;
module.exports.getLearningObject = getLearningObject;
module.exports.getLearningObjectDetails = getLearningObjectDetails;
module.exports.postRemoveFile = postRemoveFile;
module.exports.postCheckBoxSearch = postCheckBoxSearch;
module.exports.getTextSearch = getTextSearch;

module.exports.getApproveObject = getApproveObject;
module.exports.getRemoveObject = getRemoveObject;

function getCreate(req, res) {
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
            Resources.find(callback);
        },
        contents: function(callback) {
            Contents.find(callback);
        },
        licenses: function(callback) {
            Licenses.find(callback);
        },
    }, function(err, results) {
        res.render('lo_create', { error: err, data: results });
        return;
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
function postCreate(req, res) {
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
        var success_msg = "Objeto submetido para aprovação com sucesso!";
        if (body.object_id) {
            success_msg = "Objeto atualizado com sucesso!";
        }
        delete req.session.lo;
        req.flash('success_messages',  success_msg);
        res.redirect('/learning-object/single/' + learningObject._id);
    });
}
function getLearningObject(req, res) {
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
        console.log(results.lo);
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
function getLearningObjectDetails(req, res) {
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
        
    }, function(err, results) {
        var lo = LearningObject.findById(loId)
        .populate('teaching_levels')
        .populate('axes')
        .populate('accessibility_resources')
        .populate('license')        
        .exec(function(err, result){
            console.log(result)
            results['lo'] = result;            
            return res.render('lo_details', { error: err, data: results });
        });
    });
    return;
}
function postUploadFile(req, res) {
    const file = req.files.file;

    var file_attrs = {};
    const storage_name = req.user._id + file.name;
    if (req.files && file) {
        file_attrs.name = file.name;
        file_attrs.mimetype = file.mimetype;
        file_attrs.size = req.headers['content-length'];
        file_attrs.url = path.join('/uploads', 'lo', storage_name);

        const file_path = path.join(__appRoot, 'public', 'uploads', 'lo', storage_name);

        fs.writeFileSync(file_path, file.data);    

        res.status(200).send({ file: file_attrs });
    } else {
        res.status(500).send({error: "Arquivo não especificado"})
    }
    return;
    
}
function postRemoveFile(req, res) {    
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
            const file_path = path.join(__appRoot, 'public', 'uploads', 'lo', req.user._id + req.body.file_name);
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
        const file_path = path.join(__appRoot, 'public', 'uploads', 'lo', req.user._id + req.body.file_name);
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
function getTextSearch(req, res) {
    const body = req.body;
    async.parallel({
        resources: function(callback) {
            Resources.find(callback);
        },
        contents: function(callback) {
            Contents.find(callback);
        }
    }, function(err, results) {
        if (err) {
            return res.send(err);
        }        
        /*
            Definição do termo de busca. Pode vir da requisição GET através do campo "search_text"
            ou da sessão caso o usuário já tenha feito uma busca e esteja aplicando filtros
        */
        const search_text = (req.query.search_text || req.query.search_text == '')  ? req.query.search_text : req.session.search_text;
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
        /* Salva o termo de busca na sessão para uso posterior */
        req.session.search_text = search_text;

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
                    currentPage: page
                });
            });
        });        
    });
}
function postCheckBoxSearch(req, res) {    
    const body = req.body;
    async.parallel({
        resources: function(callback) {
            Resources.find(callback);
        },
        contents: function(callback) {
            Contents.find(callback);
        }
    }, function(err, results) {
        var and = {};
        if (body.checked_string || body.checked_string == '') {
            console.log("NÃO PEGOU DA SESSÃO")
            const q_acc_resources = body['accessibility_resources[]'] ? getReqParamAsArray(body['accessibility_resources[]']) : [];
            const q_axes = body['axes[]'] ? getReqParamAsArray(body['axes[]']) : [];
            const q_teaching_levels = body['teaching_levels[]'] ? getReqParamAsArray(body['teaching_levels[]']) : [];
            const checked_string = body.checked_string;
            if (body.checked_string == '') {
                and = {}
            } else {
                and = {
                    $and :[
                        {accessibility_resources: {$in: q_acc_resources}},
                        {axes: {$in: q_axes}},
                        {teaching_levels: {$in: q_teaching_levels}},
                    ]
                };
            }
            req.session.query_object = and;
        } else {
            console.log("PEGOU DA SESSÃO!!")
            and = req.session.query_object;
        } 
        var cursor = LearningObject.find(and).where('approved').equals(true);
        //Verifica se está sendo aplicado algum filtro
        if (body.filter_flag ) {
            var selected_filters = {};
            if (body.content) {
                selected_filters['content'] = body.content;
                cursor.where('content').equals(body.content);
            }
            if(body.resource){
                selected_filters['resource'] = body.resource;
                cursor.where('resources').equals(body.resource);
            }
        }            
        return cursor.exec(function(err, lo){
            if(err) {
                return res.send(err);
            }
            // Adiciona o objeto de aprendizagem nos resultados e renderiza a view
            results['learning_object'] = lo;
            return res.render('lo_search_results', {data: results, selected_filters: selected_filters, checked_string: body.checked_string || req.session.checked_string || "\"Nenhuma selação\""});
        });
    });
}
function getApproveObject(req, res) {
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
function getRemoveObject(req, res) {
    async.parallel([
        function(callback) {
          LearningObject.findById(req.params.id, callback)
        }        
    ],      
    function(err, result){
        const permission = result[0].owner == req.user._id ? ac.can(req.user.role).deleteOwn('learningObject') : ac.can(req.user.role).deleteAny('learningObject');
        if (!permission.granted) {
            res.status(403).send("Você não tem permissão!")
            return;
        }
        console.log(result);
        const file_path = path.join(__appRoot, 'public', result[0].file.url);
        fs.stat(file_path, function(err, stat) {
            if(!err) {
                fs.unlink(file_path, function(err, unlink_res) {                    
                    result[0].remove({
                        single: true 
                    })
                    req.flash('success_messages', "Objeto removido com sucesso!");
                    res.redirect('/learning-object/manage')
                });
            } else {
                result[0].remove({
                    single: true
                })
                req.flash('success_messages', "Objeto removido com sucesso!");
                res.redirect('/learning-object/manage')
            }
        })
    });
    /*LearningObject.findById(req.params.id, function(err, result) {
        if (err) {
            res.send(err);
        }
    });*/
}