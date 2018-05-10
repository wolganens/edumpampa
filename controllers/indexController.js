const async = require('async');

const AccessibilityResources = require('../models/accessibilityresources');
const Axes = require('../models/axes');
const TeachingLevels = require('../models/teachinglevels');
const email = require('../config/email');

module.exports = {
  getIndex(req, res) {
    async.parallel({
      accessibility_resources(callback) {
        AccessibilityResources.find(callback);
      },
      axes(callback) {
        Axes.find(callback);
      },
      teaching_levels(callback) {
        TeachingLevels.find(callback);
      },
    }, (err, results) => res.render('index', {
      title: 'EduMPampa - Repositório de Objetos de Aprendizagem',
      error: err,
      data: results,
    }));
  },
  getContrast(req, res) {
    if (req.cookies.contrast !== '1') {
      res.cookie('contrast', '1', { expires: new Date(Date.now() + 900000), httpOnly: false });
    } else {
      res.cookie('contrast', '0', { expires: new Date(Date.now() + 900000), httpOnly: false });
    }
    console.log(req.cookies);
    return res.redirect("back");
  },
  /*
      Renderiza a página de formulário de contato
  */
  getContact(req, res) {
    return res.render('contact', { title: 'Contato' });
  },
  /*
      Envia a mensagem de contato para o email do administrador
  */
  postContact(req, res) {
    const subjects = ['Problema', 'Sugestão', 'Outro'];
    let hasErrors = false;
    const inputErrors = {
      errors: {},
    };

      /* Validação de campos */
    if (!req.body.name) {
      inputErrors.errors.name = {};
      inputErrors.errors.name.message = 'Seu nome é obrigatório!';
      hasErrors = true;
    }
    if (!req.body.subject) {
      inputErrors.errors.subject = {};
      inputErrors.errors.subject.message = 'Selecione um assunto!';
      hasErrors = true;
    } else if (subjects.indexOf(req.body.subject) === -1) {
      inputErrors.errors.subject = {};
      inputErrors.errors.subject.message = 'Assunto inválido';
      hasErrors = true;
    }
    if (!req.body.message) {
      inputErrors.errors.message = {};
      inputErrors.errors.message.message = 'Insira uma mensagem!';
      hasErrors = true;
    }
    if (!req.body.email) {
      inputErrors.errors.email = {};
      inputErrors.errors.email.message = 'Insira seu email de contato!';
      hasErrors = true;
    }
    if (hasErrors) {
      req.flash('inputErrors', JSON.stringify(inputErrors));
      req.flash('inputs', req.body);
      return res.redirect('/contact');
    }

    const mailOptions = {
      to: 'edumpampa@gmail.com',
      subject: req.body.subject,
      html: `${req.body.message}<p>Email de contato: ${req.body.email}</p>`,
    };
    return email.sendMail(mailOptions, (error) => {
      if (error) {
        return console.log(error);
      }
      req.session.success_message = 'Mensagem enviada com sucesso. Em breve entraremos em contato!';
      return res.redirect('back');
    });
  },
};
