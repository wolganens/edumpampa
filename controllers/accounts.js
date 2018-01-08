const _ = require('lodash');
const async = require('async');
const pug = require('pug');
const path = require('path');
const generator = require('generate-password');
const User = require('../models/user');
const InstitutionalLink = require('../models/institutional_link');
const InstitutionalPost = require('../models/institutional_post');
const OccupationArea = require('../models/occupation_area');
const Qualification = require('../models/qualifications');
const passwordHelper = require('../helpers/password');
const email = require('../config/email');
const { mergeCheckboxData } = require('../helpers/utils');

module.exports = {
  getSignIn(req, res) {
    return res.render('account/signin', { title: 'Página de login de usuário - EduMPampa' });
  },
  getSignUp(req, res) {
    async.parallel({
      institutional_links(callback) {
        InstitutionalLink.find(callback);
      },
      institutional_posts(callback) {
        InstitutionalPost.find(callback);
      },
      occupation_areas(callback) {
        OccupationArea.find(callback);
      },
      qualifications(callback) {
        Qualification.find(callback);
      },
    }, (err, results) => {      
      if (err) {
        return res.send(err);
      }
      return res.render('account/signup', {
        data: results,
        title: 'Página de cadastro de usuário - EduMPampa',
      });
    });
  },
  postSignUp(req, res) {
    /*
    * Extrai os dados do formulário de cadastro do usuário
    * para a variavel userData. Além disso, salva os dados enviados
    * na variavel post para em caso de falha de validação o formulário
    * mantenha os dados previamente enviados
    */
    const userData = req.session.post = req.body;
    /*
    * Remove as senhas informadas na requisição para obrigar o usuário a
    * inserí-las novamente na próxima submissão
    */
    delete req.session.post.password;
    delete req.session.post.confirm_password;
    /*
    * Atribui cada parte da data de nascimento submetida às variaveis
    * day, month e year, cria uma nova data(new Date) e atribui ao campo 
    * birthday do usuário
    */
    const [day, month, year] = userData.birthday.split('/');
    userData.birthday = new Date(year, month - 1, day);
    
    /*
    * Caso as senhas informadas não sejam iguais (senha e confirmar senha)
    * Instancia um objeto de erros "semelhante" ao ValidationError do Mongoose
    * e coloca o objeto na sessão para que o erro seja automaticamente evindenciado
    * abaixo do input
    */
    if (userData.password !== req.body.password_confirm) {      
      const errors = {
        password_confirm: { message: 'As senhas informadas não conferem!' },
      };
      req.session.errors = errors;
      return res.redirect('back');
    }
    return User.register(userData, (err, user) => {      
      if (err){ 
        /*
        * Se o mongodb retornar um erro por violação de unicidade, é por que 
        * foi inserido um email que já está sendo utilizado, assim sendo, o 
        * objeto de erro é instanciado e colocado na sessão.
        */
        if (err.code === 11000 || err.code === 11001) {
          const errors = {
              email: { message: 'Este email já está sendo utilizado!' },
          };
          req.session.errors = errors;
        } else {
          /*Coloca na seesão os erros de validação (diferentes do erero acima
          que não é um erro de validação)*/
          req.session.errors = err.errors;
        }
        return res.redirect('back');
      }
      /*
      * Caso o usuário seja cadastrado com sucesso, envia um email de boas vindas
      * para o email inserido
      */
      const mailOptions = {
        to: user.email,
        subject: 'Seja bem-vindo ao EduMPampa!',
        html: pug.renderFile(path.join(__dirname, '..', 'views', 'emails/welcome.pug'), {
          user: user.name,          
        }),
      };
      return email.sendMail(mailOptions, (mailErr) => {
        if (mailErr) {
          return res.send(mailErr);
        }
        return req.logIn(user, (loginErr) => {
          if (loginErr) {
            return res.send(loginErr);
          }          ;
          return res.redirect('/');
        });
      });
    });
  },
  getForgotPw(req, res) {
    return res.render('account/forgot-pw', { title: 'Recuperar senha de acesso - EduMPampa' });
  },
  postForgotPw(req, res, next) {
    async.waterfall([
      (done) => {
        const userEmail = req.body.email;
        return User.findOne({ email: userEmail }, (err, user) => {
          if (!user) {
            req.flash('error_messages', 'Não há nenhum cadastro com este email!');
            return res.redirect('/account/forgot-pw');
          }
          return done(err, user);
        });
      },
      (user, done) => {
        const authUser = user;
        const password = generator.generate({
          length: 8,
          numbers: true,
          symbols: true,
          strict: true,
        });
        return passwordHelper.hash(password, (err, hashedPassword, nSalt) => {
          authUser.password = hashedPassword;
          authUser.passwordSalt = nSalt;
          return authUser.save((saveErr) => {
            if (saveErr) {
              return console.log(saveErr);
            }
            return done(saveErr, authUser, password);
          });
        });
      },
      (user, password, done) => {
        const mailOptions = {
          to: user.email,
          subject: 'Senha de acesso!',
          html: pug.renderFile(path.join(__dirname, '..', 'views', 'emails/password-reset.pug'), {
            name: user.name,
            password,
          }),
        };
        return email.sendMail(mailOptions, (error) => {
          if (error) {
            return console.log(error);
          }
          return done(error, 'Senha enviada para o email informado!');
        });
      },
    ], (err, successMsg) => {
      if (err) {
        return next(err);
      }
      req.flash('success_messages', successMsg);
      return res.redirect('/account/forgot-pw');
    });
  },
  getProfile(req, res) {
    async.parallel({
      institutional_links(callback) {
        InstitutionalLink.find(callback);
      },
      institutional_posts(callback) {
        InstitutionalPost.find(callback);
      },
      occupation_areas(callback) {
        OccupationArea.find(callback);
      },
      qualifications(callback) {
        Qualification.find(callback);
      },
      user(callback) {
        User.findById(req.user._id, callback);
      },
    }, (err, results) => {
      const {
        institutional_link_id,
        occupation_area_id,
        qualification_id,
        qualification_text,
        occupation_area_text,
        institutional_link_text,
        // The data is not coming to req.query yet, but it's ready to receive
      } = Object.keys(req.query).length === 0 ? results.user : req.query;

      const stringify = id => (id && typeof id === 'object' ? id.toString() : id);

      const values = {
        institutional_links: stringify(institutional_link_id),
        occupation_areas: stringify(occupation_area_id),
        qualifications: stringify(qualification_id),
      };

      const formGroupValue = {
        institutional_links: institutional_link_text,
        occupation_areas: occupation_area_text,
        qualifications: qualification_text,
      };

      return res.render('account/signup', {
        error: err,
        data: mergeCheckboxData({ options: results, values, formGroupValue }, results),
        title: 'Minha conta - EduMPampa',
      });
    });
  },
  getChangePw(req, res) {
    return res.render('account/change-pw');
  },
  postChangePw(req, res) {
    return User.findById(req.user._id, (err, user) => {
      if (err) {
        res.send(err);
      }
      return user.changePassword(req.body.old_pw, req.body.password, (error) => {
        if (error) {
          res.send(error);
        }
        req.flash('success_messages', 'Senha alterada com sucesso!');
        return res.redirect('/account/profile');
      });
    });
  },
};
