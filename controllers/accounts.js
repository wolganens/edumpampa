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
const { strDateToObject } = require('../helpers/utils');

module.exports = {
  getSignIn(req, res) {
    /*
    * Exibe a página de login (autenticação de conta) de usuários
    */
    return res.render('account/signin', { title: 'Login' });
  },
  getSignUp(req, res) {
    /*
    * Exibe a página de cadastro de usuários (criação de contas)
    */
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
      /*
      * Busca na base de dados informações necessárias para o cadastro de um usuário:
      * Formação, Áreas de atuação, etc. Os resultados ficam armazenados na variavel result.
      * Ex: results.qualifications, results.occupation_areas
      */
      if (err) {
        return res.send(err);
      }
      return res.render('account/signup', {
        data: results,
        title: 'Cadastro',
      });
    });
  },
  postSignUp(req, res) {
    req.flash('body', req.body);
    /*
    * Extrai os dados do formulário de cadastro do usuário
    * para a variavel userData. Além disso, salva os dados enviados
    * na variavel post para em caso de falha de validação o formulário
    * mantenha os dados previamente enviados
    */
    const userData = req.body;
    /*
    * Caso as senhas informadas não sejam iguais (senha e confirmar senha)
    * Instancia um objeto de erros "semelhante" ao ValidationError do Mongoose
    * e coloca o objeto na sessão para que o erro seja automaticamente evindenciado
    * abaixo do input
    */
    if (userData.password !== userData.password_confirm) {
      const errors = {
        password_confirm: { message: 'As senhas informadas não conferem!' },
      };
      req.session.errors = errors;
      return res.redirect('back');
    }
    /*
    * Converte a string de data em um objeto Date
    */
    userData.birthday = strDateToObject(userData.birthday);
    return User.register(userData, (err, user) => {
      if (err) {
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
          /*
          * Coloca na seesão os erros de validação (diferentes do erero acima
          * que não é um erro de validação)
          */
          req.session.errors = err.errors;
        }
        return res.redirect('back');
      }
      /*
      * Caso o usuário seja cadastrado com sucesso, envia um email de boas vindas
      * para o email inserido
      */
      const renderedEmail = pug.renderFile(path.join(__dirname, '..', 'views', 'emails/welcome.pug'), {
        user: user.name,
      });
      console.log(renderedEmail);

      const mailOptions = {
        to: user.email,
        subject: 'Seja bem-vindo ao EduMPampa!',
        html: renderedEmail,
      };
      return email.sendMail(mailOptions, (mailErr) => {
        if (mailErr) {
          return res.send(mailErr);
        }
        /*
        * Se o email de boas vindas for enviado com sucesso, loga o usuário
        * recem cadastrado e redireciona para a página inicial
        */
        return req.logIn(user, (loginErr) => {
          if (loginErr) {
            return res.send(loginErr);
          }
          req.session.success_message = `Olá ${user.name}, seja bem-vindo ao EduMPampa!`;
          return res.redirect('/');
        });
      });
    });
  },
  postUpdate(req, res) {
    /*
    * Busca a model do usuário autenticado
    */
    return User.findById(req.user._id, (findErr, user) => {      
      if (findErr) {
        return res.send(findErr);
      }
      /*
      * Atualiza os valores dos campos do modelo, atribuindo aos mesmos
      * os valores enviados no formulário
      */
      const userData = user;
      userData.name = req.body.name;
      userData.birthday = strDateToObject(req.body['birthday']);
      userData.qualification_id = req.body.qualification_id || null;
      userData.qualification_text = req.body.qualification_text || null;
      userData.occupation_area_id = req.body.occupation_area_id || null;
      userData.occupation_area_text = req.body.occupation_area_text || null;
      userData.institutional_link_id = req.body.institutional_link_id || null;
      userData.institutional_link_text = req.body.institutional_link_text || null;
      userData.institutional_post_id = req.body.institutional_post_id || null;
      userData.institutional_post_text = req.body.institutional_post_text || null;
      userData.institution_name = req.body.institution_name || null;
      userData.institution_address = req.body.institution_address || null;
      /*
      * Atualiza o modelo, exibindo a mensagem de sucesso ou os erros
      */
      return userData.save((saveErr) => {
        console.log(saveErr);
        if (saveErr) {
          return res.send(saveErr);
        }
        req.session.success_message = 'Perfil atualizado com sucesso!';
        return res.redirect('back');
      });
    });
  },
  getForgotPw(req, res) {
    return res.render('account/forgot-pw', { title: 'Recuperar senha de acesso - EduMPampa' });
  },
  postForgotPw(req, res, next) {
    /*
    * Executa 3 operações em cascata: Encontra o usuário pelo email,
    * gera uma senha nova e altera o documento do usuário e por fim
    * envia um email com a senha nova.
    */
    async.waterfall([
      (done) => {
        const userEmail = req.body.email;
        /*
        * Tenta encontrar um Usuário cadastrado com o email informado na página
        * de redefinição de senha
        */
        return User.findOne({ email: userEmail }, (err, user) => {
          if (!user) {
            /*
            * Caso não encontre nenhum usuário, exibe a mensagem de erro abaixo
            */
            req.session.error_message = 'Não há nenhum cadastro com este email!';
            return res.redirect('back');
          }
          return done(err, user);
        });
      },
      (user, done) => {
        /*
        * Gera uma nova senha para o usuário através do pacote generate-password
        */
        const authUser = user;
        const password = generator.generate({
          length: 8,
          numbers: true,
          symbols: true,
          strict: true,
        });
        /*
        * Faz o hash da nova senha recem gerada, altera a senha no documento
        * do usuário e salva o mesmo
        */
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
        /*
        * Envia o email de alteração de senha para o usuário
        */
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
      req.session.success_message = successMsg;
      return res.redirect('back');
    });
  },
  getProfile(req, res) {
    /*
    * Exibe a página de perfil do usuário (informações de cadastro)
    */
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
    }, (err, results) => res.render('account/profile', {
      error: err,
      data: results,
      title: 'Minha conta - EduMPampa',
    }));
  },
  getChangePw(req, res) {
    /*
    * Exibe a página de alteração de senha
    */
    return res.render('account/change-pw');
  },
  postChangePw(req, res) {
    /*
    * Verifica se a senha e confirmação são iguais
    */
    if (req.body.password !== req.body.confirm_password) {
      const errors = {
        confirm_password: { message: 'As senhas informadas não conferem!' },
      };
      req.session.errors = errors;
      return res.redirect('back');
    }
    /*
    * Encontra o modelo do usuário autenticado e altera a senha de acesso
    */
    return User.findById(req.user._id, (err, user) => {
      if (err) {
        res.send(err);
      }
      return user.changePassword(req.body.old_pw, req.body.password, (error) => {
        if (error) {
          res.send(error);
        }
        req.session.success_message = 'Senha alterada com sucesso!';
        return res.redirect('back');
      });
    });
  },
};
