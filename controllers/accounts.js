const _ = require('lodash');
const async = require('async');
const pug = require('pug');
const path = require('path');
const generator = require('generate-password');
const querystring = require('querystring');

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
      const values = {
        institutional_links: req.query.institutional_link_id,
        occupation_areas: req.query.occupation_area_id,
        qualifications: req.query.qualification_id,
      };
      const formGroupValue = {
        institutional_links: req.query.institutional_link_text,
        occupation_areas: req.query.occupation_area_text,
        qualifications: req.query.qualification_text,
      };
      if (err) {
        return res.send(err);
      }
      return res.render('account/signup', {
        error: err,
        data: mergeCheckboxData({
          options: results,
          values,
          formGroupValue,
        }, results),
        title: 'Página de cadastro de usuário - EduMPampa',
      });
    });
  },
  postSignUp(req, res) {
    // TODO: refactor validation
    req.flash('inputs', req.body);
    const query = querystring.stringify({
      qualification_id: req.body.qualification_id,
      occupation_area_id: req.body.occupation_area_id,
      institutional_link_id: req.body.institutional_link_id,
      qualification_text: req.body.qualification_text,
      occupation_area_text: req.body.occupation_area_text,
      institutional_link_text: req.body.institutional_link_text,
    });
    const userData = _.pick(
      req.body,
      'name',
      'email',
      'password',
      'birthday',
      'qualification_id',
      'occupation_area_id',
      'institutional_link_id',
      'institution_name',
      'institution_address',
      'institutional_post_id[]',
      'qualification_text',
      'occupation_area_text',
      'institutional_link_text',
      'institutional_post_text',
    );
    const [day, month, year] = userData.birthday.split('/');

    userData.birthday = new Date(year, month - 1, day);
    userData.institutional_post_id = userData['institutional_post_id[]'] ? userData['institutional_post_id[]'] : null;
    userData.qualification_id = userData.qualification_id ? userData.qualification_id : null;
    userData.occupation_area_id = userData.occupation_area_id ? userData.occupation_area_id : null;
    userData.institutional_link_id = (
      userData.institutional_link_id ? userData.institutional_link_id : null
    );
    if (req.body._id) {
      userData._id = req.body._id;
    }

    if (userData._id) {
      return User.findByIdAndUpdate(userData._id, userData, (err) => {
        if (err) {
          // TODO: edit validation
          return res.send(err);
        }
        req.flash('success_messages', 'Perfil atualizado com sucesso!');
        return res.redirect('/account/profile');
      });
    }
    if (req.body.password !== req.body.password_confirm) {
      const errors = {
        errors: {
          password_confirm: { message: 'As senhas informadas não conferem!' },
        },
      };
      req.flash('inputErrors', JSON.stringify(errors));
      return res.redirect(`/account/signup?${query}`);
    }
    return User.register(userData, (err, user) => {
      console.log(err);
      if (err && (err.code === 11000 || err.code === 11001)) {
        const errors = {
          errors: {
            email: { message: 'Este email já está sendo utilizado!' },
          },
        };
        req.flash('inputErrors', JSON.stringify(errors));
        return res.redirect(`/account/signup?${query}`);
      }
      if (err) {
        req.flash('error_messages', 'Algo deu errado, tente novamente mais tarde');
        return res.redirect(`/account/signup?${query}`);
      }
      const mailOptions = {
        to: user.email,
        subject: 'Seja bem-vindo ao EduMPampa!',
        html: `<b>Olá ${user.name}</b><p>Seja bem-vindo ao EduMPampa</p>`,
      };
      return email.sendMail(mailOptions, (mailErr) => {
        if (mailErr) {
          return res.send(mailErr);
        }
        return req.logIn(user, (loginErr) => {
          if (loginErr) {
            return res.send(loginErr);
          }
          req.flash('success_messages', `Seja bem-vindo ao EduMPampa ${user.name}!`);
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
        return passwordHelper.hash(password, (err, hashedPassword, salt, callback) => {
          authUser.password = hashedPassword;
          authUser.passwordSalt = salt;

          return authUser.save((saveErr) => {
            if (saveErr) {
              return callback(saveErr, null);
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
