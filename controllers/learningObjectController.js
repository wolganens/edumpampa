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
module.exports.postRemoveFile = postRemoveFile;
module.exports.postCheckBoxSearch = postCheckBoxSearch;
module.exports.postTextSearch = postTextSearch;

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
    console.log(req.session.lo);
    console.log("==============")
    console.log("==============")
    console.log("==============")
    const permission = !req.session.lo ? ac.can(req.user.role).createOwn('learningObject') : req.session.lo.owner.toString() == req.user._id ? ac.can(req.user.role).updateOwn('learningObject') : ac.can(req.user.role).updateAny('learningObject');
    if (!permission.granted) {
        res.status(403).send("Você não tem permissão!")
        return;
    }   
    const body = req.body;    
    if (!body.file_name && body.file_url == '') {        
        req.flash('error_messages', 'Envie um arquivo ou uma URL para o arquivo do objeto!');
        if (body.object_id) {
            res.redirect('/learning-object/single/'+ body.object_id);            
        } else {
            res.redirect('/learning-object/create');            
        }
        return;
    }
    if (body.file_name) {
        var file = JSON.parse(body.file_name)
    }
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
        file:                       file
    }        
        
    if (req.file_url) {
        learningObject.file_url = req.file_url;
    }

    learningObject = new LearningObject(learningObject);
    learningObject.save(function(err, result) {
        if (err) {
            return res.status(500).send(err);
        }
        var success_msg = "Objeto submetido para aprovação com sucesso!";
        if (body.object_id) {
            success_msg = "Objeto atualizado com sucesso!";
        }
        req.flash('success_messages',  success_msg);
        res.redirect('/learning-object/single/' + learningObject._id);
    });
    return;
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
        
        const permission = (req.user._id == results.lo.owner.toString()) ? ac.can(req.user.role).updateOwn('learningObject') : ac.can(req.user.role).updateAny('learningObject');
        
        if (!permission.granted) {
            res.status(403).send("Você não tem permissão!")
            return;
        }
        req.session.lo = results.lo;
        res.render('lo_update', { error: err, data: results });
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
function postTextSearch(req, res) {
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
        // Se a query estiver na sessão pronta para receber filtros, usa ela e não uma nova consulta
        const search_text = body.search_text  ? body.search_text : req.session.search_text;
        var doc_find = {
            title: new RegExp(search_text, 'i')
        };
        var lo_query = LearningObject.find(doc_find).where('approved').equals(true);;
        //Verifica se está sendo aplicado algum filtro
        if (body.filter_flag ) {
            var selected_filters = {};
            if (body.content) {
                selected_filters['content'] = body.content;
                lo_query.where('content').equals(body.content);
            }
            if(body.resource){
                selected_filters['resource'] = body.resource;
                lo_query.where('resources').equals(body.resource);
            }
        }
        req.session.search_text = search_text;
        return lo_query.exec(function(err, lo){
            if(err) {
                return res.send(err);
            }
            // Adiciona o objeto de aprendizagem nos resultados e renderiza a view
            results['learning_object'] = lo;
            return res.render('lo_search_results', {data: results, selected_filters: selected_filters, search_text: search_text});
        });
    })
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
        var or = {};
        if (body.checked_string || body.checked_string == '') {
            console.log("NÃO PEGOU DA SESSÃO")
            const q_acc_resources = body['accessibility_resources[]'] ? getReqParamAsArray(body['accessibility_resources[]']) : [];
            const q_axes = body['axes[]'] ? getReqParamAsArray(body['axes[]']) : [];
            const q_teaching_levels = body['teaching_levels[]'] ? getReqParamAsArray(body['teaching_levels[]']) : [];
            const checked_string = body.checked_string;
            if (body.checked_string == '') {
                or = {}
            } else {
                or = {
                    $or :[
                        {accessibility_resources: {$in: q_acc_resources}},
                        {axes: {$in: q_axes}},
                        {teaching_levels: {$in: q_teaching_levels}},
                    ]
                };
            }
            req.session.query_object = or;
        } else {
            console.log("PEGOU DA SESSÃO!!")
            or = req.session.query_object;
        } 
        var lo_query = LearningObject.find(or).where('approved').equals(true);
        //Verifica se está sendo aplicado algum filtro
        if (body.filter_flag ) {
            var selected_filters = {};
            if (body.content) {
                selected_filters['content'] = body.content;
                lo_query.where('content').equals(body.content);
            }
            if(body.resource){
                selected_filters['resource'] = body.resource;
                lo_query.where('resources').equals(body.resource);
            }
        }            
        return lo_query.exec(function(err, lo){
            if(err) {
                return res.send(err);
            }
            // Adiciona o objeto de aprendizagem nos resultados e renderiza a view
            results['learning_object'] = lo;
            return res.render('lo_search_results', {data: results, selected_filters: selected_filters, checked_string: req.session.checked_string || "\"Nenhuma selação\""});
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