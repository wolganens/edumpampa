var AccessibilityResources = require("../models/accessibilityresources");
var Axes = require("../models/axes");
var TeachingLevels = require("../models/teachinglevels");
var async = require('async');
var email = require('../config/email');

exports.getIndex = getIndex;
exports.getContact = getContact;
exports.postContact = postContact;

function getIndex(req, res){    
	async.parallel({
        accessibility_resources: function(callback) {
            AccessibilityResources.find(callback);
        },
        axes: function(callback) {
            Axes.find(callback);
        },
        teaching_levels: function(callback) {
            TeachingLevels.find(callback);
        }        
    }, function(err, results) {
        res.render('index', { title: 'Repositório de Objetos de Aprendizagem', error: err, data: results });
    });
}

/*
    Renderiza a página de formulário de contato
*/
function getContact(req, res) {
    return res.render('index_contact', {title: "Entre em contato - EduMPampa"});
}
/*
    Envia a mensagem de contato para o email do administrador
*/
function postContact(req, res) {
    const subjects = ["Problema", "Sugestão", "Outro"];
    let hasErrors = false;
    let inputErrors = {
        errors: {}
    };

    /*Validação de campos*/
    if (!req.body.name) {
        inputErrors.errors["name"] = {};
        inputErrors.errors["name"]["message"] = "Seu nome é obrigatório!";
        hasErrors = true;
    }
    if (!req.body.subject) {
        inputErrors.errors["subject"] = {};
        inputErrors.errors["subject"]["message"] = "Selecione um assunto!";
        hasErrors = true;
    } else if (subjects.indexOf(req.body.subject) == -1) {
        inputErrors.errors["subject"] = {};
        inputErrors.errors["subject"]["message"] = "Assunto inválido";
        hasErrors = true;
    }
    if (!req.body.message){
        inputErrors.errors["message"] = {};
        inputErrors.errors["message"]["message"] = "Insira uma mensagem!"; 
        hasErrors = true;  
    }
    if (hasErrors) {
        req.flash('inputErrors', JSON.stringify(inputErrors));
        return res.redirect("/contact");
    }

    let mailOptions = {                
        to: 'edumpampa@gmail.com',
        subject: req.body.subject,
        html: req.body.message
    };
    email.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        req.flash("success_messages", "Mensagem de contato enviada com sucesso, em breve entraremos em contato!")
        return res.redirect("back");
    }); 
}