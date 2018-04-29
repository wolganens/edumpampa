const async = require('async');
const path = require('path');
const fs = require('fs-extra');
const AccessibilityResources = require('../models/accessibilityresources');
const Axes = require('../models/axes');
const TeachingLevels = require('../models/teachinglevels');
const LearningObject = require('../models/learningobject');
const Downloads = require('../models/downloads');
const Contents = require('../models/contents');
const Resources = require('../models/resources');
const Licenses = require('../models/licenses');
const ac = require('../config/roles');
const email = require('../config/email');
const pug = require('pug');
const config = require('../config/index');

module.exports = {
  getCreate(req, res) {
    const permission = ac.can(req.user.role).createOwn('learningObject');
    if (!permission.granted) {
      return res.status(403).send('Você não tem permissão!');
    }
    return async.parallel({
      accessibility_resources(callback) {
        AccessibilityResources.find(callback);
      },
      axes(callback) {
        Axes.find(callback);
      },
      teaching_levels(callback) {
        TeachingLevels.find(callback);
      },
      resources(callback) {
        Resources.find({}).sort('name').exec(callback);
      },
      content(callback) {
        Contents.find({}).sort('name').exec(callback);
      },
      licenses(callback) {
        Licenses.find(callback);
      },
    }, (err, results) => {
      res.render('learning-object/create', {
        error: err,
        data: results,
        title: 'Cadastro de OA - EduMPampa',
      });
    });
  },
  postCreate(req, res) {
    const permission = ac.can(req.user.role).createOwn('learningObject');
    if (!permission.granted) {
      return res.status(403).send('Você não tem permissão!');
    }
    const lo = req.body;
    lo.owner = req.user._id;

    if (lo.file_name) {
      lo.file = JSON.parse(lo.file_name);
    } else {
      lo.file_url = lo.file_url;
    }

    let successMsg;
    if (req.user.role === 'ADMIN') {
      lo.approved = true;
      successMsg = ' aprovado ';
    } else {
      successMsg = ' submetido para aprovação ';
    }

    const learningObject = new LearningObject(lo);
    return learningObject.save((err) => {
      if (err) {
        req.session.errors = err.errors;
        /*
        * Mantem o corpo do POST até a próxima requisição
        */
        req.flash('body', req.body);
        return res.redirect('back');
      }
      successMsg = `Objeto ${successMsg} com sucesso!`;
      const mailOptions = {
        to: 'edumpampa@gmail.com',
        subject: 'Novo OA submetido para aprovação',
        html: pug.renderFile(path.join(__dirname, '..', 'views', 'emails/submited-oa.pug'), {
          user: req.user.name,
          title: learningObject.title,
          lo_id: learningObject._id,
          url: config.baseUrl,
        }),
      };
      return email.sendMail(mailOptions, (mailErr) => {
        if (mailErr) {
          return res.send(mailErr);
        }
        req.session.success_message = successMsg;
        return res.redirect(`/learning-object/single/${learningObject._id}`);
      });
    });
  },
  postUpdate(req, res) {
    /*
    * Verifica se o usuário autenticado tem permissão para editar o
    * objeto de aprendizagem
    */
    if (req.user) {
      return LearningObject.findById(req.body.object_id, (err, lo) => {
        const loData = lo;
        let permission;
        /*
        * Verifica se o usuário autenticado é "dono"(owner) do OA
        */
        if (req.user._id.toString() === loData.owner.toString()) {
          permission = ac.can(req.user.role).updateOwn('learningObject');
        } else {
          /*
          * Se o usuário autenticado não for dono do OA, então verifica se quem está
          * tentando acessar o OA tem permissão para alterar qualquer OA
          */
          permission = ac.can(req.user.role).updateAny('learningObject');
        }
        if (!permission.granted) {
          return res.status(403).send('Você não tem permissão');
        }
        /*
        * Atualiza os campos do OA pelos que vieram na requsição e depois salva o OA
        */
        Object.keys(req.body).forEach((field) => {
          if (field !== '_id') {
            loData[field] = req.body[field];
          }
        });
        /*Desautoriza o objeto devido a sua atualização*/
        loData.approved = false;
        return loData.save((saveErr) => {
          if (saveErr) {
            req.session.error_message = saveErr;
            /*
            * Mantem o corpo do POST até a próxima requisição
            */
            req.flash('body', req.body);
          }
          req.session.success_message = 'Objeto atualizado com sucesso! <br/> <strong>Obs: O objeto será avaliado antes de sua publicação.</strong>';
          return res.redirect('back');
        });
      });
    }
    return res.redirect('/accounts/signin');
  },
  getLearningObject(req, res) {
    const { loId } = req.params;
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
      resources(callback) {
        Resources.find(callback);
      },
      contents(callback) {
        Contents.find(callback);
      },
      licenses(callback) {
        Licenses.find(callback);
      },
      lo(callback) {
        LearningObject.findById(loId, callback);
      },
    }, (err, results) => {
      if (err) {
        return res.send(err);
      }
      /*
      * Verifica se o usuário autenticado tem permissão para editar o
      * objeto de aprendizagem
      */
      if (req.user) {
        let permission;
        /*
        * Verifica se o usuário autenticado é "dono"(owner) do OA
        */
        if (req.user._id.toString() === results.lo.owner.toString()) {
          permission = ac.can(req.user.role).updateOwn('learningObject');
        } else {
          /*
          * Se o usuário autenticado não for dono do OA, então verifica se quem está
          * tentando acessar o OA tem permissão para alterar qualquer OA
          */
          permission = ac.can(req.user.role).updateAny('learningObject');
        }
        /*
        * Se o usuário não tem permissão para editar o OA, então ele é redirecionado
        * para a página de detalhes do OA
        */
        if (!permission.granted) {
          return res.redirect(`/learning-object/details/${results.lo._id}`);
        }
        /*
        * Caso o usuário tenha permissão para editar o OA, o formulário de edição
        * do OA é renderizado com as informações do OA em data.lo
        */
        return res.render('learning-object/single', {
          data: results,
          title: 'Atualização de OA - EduMPampa',
        });
      }
      /*
      * Se o usuário não está autenticado, então é redirecionado para
      * a página de detalhes do OA
      */
      return res.redirect(`/learning-object/details/${results.lo._id}`);
    });
  },
  getLearningObjectDetails(req, res) {
    const { loId } = req.params;
    const results = {};
    return LearningObject.findById(loId)
      .populate('teaching_levels')
      .populate('axes')
      .populate('accessibility_resources')
      .populate('license')
      .exec((err, result) => {
        results.lo = result;
        return res.render('learning-object/details', { error: err, data: results, title: 'Detalhes do Objeto de Aprendizagem - EduMPampa' });
      });
  },
  postUploadFile(req, res) {
    const { file } = req.files;
    const fileAttrs = {};
    const storageName = req.user._id + file.name;
    if (req.files && file) {
      fileAttrs.name = file.name;
      fileAttrs.mimetype = file.mimetype;
      fileAttrs.size = req.headers['content-length'];
      fileAttrs.url = path.join('/uploads', 'lo', storageName);
      const filePath = path.join(__dirname, '..', 'public', 'uploads', 'lo', storageName);
      fs.writeFileSync(filePath, file.data);
      res.status(200).send({ file: fileAttrs });
    } else {
      res.status(500).send({ error: 'Arquivo não especificado' });
    }
  },
  postRemoveFile(req, res) {
    const filePath = path.join(__dirname, '..', 'public', 'uploads', 'lo', req.user._id + req.body.file_name);
    if (req.body.object_id) {
      const permission = req.session.lo.owner.toString() === req.user._id.toString() ? ac.can(req.user.role).updateOwn('learningObject') : ac.can(req.user.role).updateAny('learningObject');
      if (!permission.granted) {
        return res.status(403).send('Você não tem permissão!');
      }
      return LearningObject.findById(req.body.object_id, (findErr, result) => {
        if (findErr) {
          return res.status(500).send({ error: findErr });
        }
        const lo = result;
        lo.file = null;
        return lo.save((err) => {
          if (err) {
            console.log(err);
          }
          return fs.stat(filePath, (statErr) => {
            if (statErr) {
              console.log(`Falha ao remover arquivo: ${JSON.stringify(statErr)}`);
              return res.status(200).send({ success: 'Arquivo removido com sucesso!' });
            }
            return fs.unlink(filePath, (unlinkErr) => {
              if (unlinkErr) {
                return res.status(500).send({ error: unlinkErr });
              }
              return res.status(200).send({ success: 'Arquivo removido com sucesso!' });
            });
          });
        });
      });
    }
    return fs.stat(filePath, (statErr) => {
      if (statErr) {
        return res.send(statErr);
      }
      return fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          return res.status(500).send({ error: unlinkErr });
        }
        return res.status(200).send({ success: 'Arquivo removido com sucesso!' });
      });
    });
  },
  getTextSearch(req, res) {
    async.parallel({
      resources(callback) {
        Resources.find({}).sort('name').exec(callback);
      },
      contents(callback) {
        Contents.find({}).sort('name').exec(callback);
      },
    }, (err, results) => {
      if (err) {
        return res.send(err);
      }
      /*
      * Definição do termo de busca, através do campo "search_text (GET)"
      */
      const searchText = req.query.search_text || req.query.search_text === '' ? req.query.search_text : req.session.search;
      req.session.search = searchText;
      /*
      * Parâmetros adicionais de paginação
      */
      const page = req.query && req.query.page ? req.query.page : 1;
      const skip = (page - 1) * 10;
      const limit = 10;
      /*
      * Definição do objeto (documento) utilizado para trazer os registros
      * do banco de dados, no caso uma busca por expressão regular é feita
      * sobre o campo "title" dos objetos de aprendizagem
      */
      const queryObject = {
        title: {
          $regex: new RegExp(searchText),
          $options: 'i',
        },
      };
      /*
      * Inicia o processo de "montagem" da query de busca, projetando apenas os campos necessários,
      * e trazendo apenas objetos já aprovados.
      */
      const cursor = LearningObject.find(
        queryObject,
        {
          title: 1,
          createdAt: 1,
          description: 1,
        },
      ).where('approved')
        .equals(true);
      /*
      * Caso o usuário esteja filtrando os resultados, adiciona os filtros na query de busca
      */
      const selectedFilters = {};
      if ('content' in req.query && req.query.content !== '') {
        selectedFilters.content = req.query.content;
        cursor.where('content').equals(req.query.content);
      }
      if ('resource' in req.query && req.query.resource !== '') {
        selectedFilters.resource = req.query.resource;
        cursor.where('resources').equals(req.query.resource);
      }
      return cursor.count((countErr, count) => {
        if (countErr) {
          return res.send(countErr);
        }
        return cursor.skip(skip).limit(limit).exec('find', (findErr, lo) => {
          if (findErr) {
            return res.send(findErr);
          }
          /*
          * Adiciona o objeto de aprendizagem nos resultados e renderiza a view
          */
          const data = results;
          data.learningObject = lo;
          return res.render('learning-object/search', {
            data,
            selectedFilters,
            searchText,
            count,
            pages: Math.ceil(count / 10),
            currentPage: page,
            queryUrl: req.originalUrl,
            title: 'Busca de objetos - EduMPampa',
          });
        });
      });
    });
  },
  postCheckBoxSearch(req, res) {
    async.parallel({
      resources(callback) {
        Resources.find({}).sort('name').exec(callback);
      },
      contents(callback) {
        Contents.find({}).sort('name').exec(callback);
      },
    }, (err, results) => {
      /*
      * Variavel responsavel por armazenar os filtros de busca da query
      */
      let and = {
        $and: [],
      };
      let checkedString = '';
      /*
      * Parâmetros adicionais de paginação
      */
      const page = req.query && req.query.page ? req.query.page : 1;
      const skip = (page - 1) * 10;
      const limit = 10;
      /*
      * Caso tenha sido selecionado algum checkbox para busca, constroi o and
      */
      if (req.query.checked_string || req.query.checked_string === '') {
        /*
        * Cria o objeto de consulta $and à partir dos checkbox (field)
        * que vieram da requisição
        */
        Object.keys(req.query).forEach((field) => {
          if (field !== 'checked_string') {
            and.$and.push({
              [field]: { $all: req.query[field] },
            });
          }
        });
        /*
        * Se não foi selecionado nenhum checkbox, remove o $and pois este não
        * pode ser um array vazio, assim retorna todos os OA
        */
        if (and.$and.length === 0) {
          delete and.$and;
        }
        checkedString = req.query.checked_string;
        req.session.search = and;
        req.session.checkedString = checkedString;
      } else {
        ({ checkedString } = req.session);
        and = req.session.search;
      }

      /*
      * Inicia o processo de "montagem" da query de busca, projetando
      * apenas os campos necessários, e trazendo apenas objetos já aprovados.
      */
      const cursor = LearningObject.find(
        and,
        {
          title: 1,
          createdAt: 1,
          description: 1,
        },
      ).where('approved')
        .equals(true);
      /*
      * Caso o usuário esteja filtrando os resultados, adiciona os filtros na query de busca
      */
      const selectedFilters = {};
      if ('content' in req.query && req.query.content !== '') {
        selectedFilters.content = req.query.content;
        cursor.where('content').equals(req.query.content);
      }
      if ('resource' in req.query && req.query.resource !== '') {
        selectedFilters.resource = req.query.resource;
        cursor.where('resources').equals(req.query.resource);
      }
      return cursor.count((countErr, count) => {
        if (countErr) {
          return res.send(countErr);
        }
        return cursor.skip(skip).limit(limit).exec('find', (findErr, lo) => {
          if (findErr) {
            return res.send(findErr);
          }
          /*
          * Adiciona o objeto de aprendizagem nos resultados e renderiza a view
          */
          const data = results;
          data.learningObject = lo;
          return res.render('learning-object/search', {
            data,
            selectedFilters,
            checkedString: checkedString || '"Nenhuma seleção"',
            count,
            pages: Math.ceil(count / 10),
            currentPage: page,
            queryUrl: req.originalUrl,
          });
        });
      });
    });
  },
  getApproveObject(req, res) {
    const permission = ac.can(req.user.role).updateAny('learningObject');
    if (!permission.granted) {
      res.status(403).send('Você não tem permissão!');
      return;
    }
    LearningObject.findById(req.params.id, (err, result) => {
      if (err) {
        res.send(err);
      }
      const lo = result;
      lo.approved = !lo.approved;
      lo.save();
      if (lo.approved) {
        req.session.success_message = 'Objeto aprovado com sucesso!';
      } else {
        req.session.success_message = 'Objeto desaprovado com sucesso!';
      }
      return res.redirect('/admin/learning-object/manage');
    });
  },
  getRemoveObject(req, res) {
    return LearningObject.findById(req.params.id, { owner: 1, file: 1 }, (findErr, lo) => {
      if (findErr) {
        req.session.error_message = findErr;
        return res.redirect('back');
      }
      if (lo.file && Object.keys(lo.file).length === 0 && lo.file.constructor === Object) {
        let findedPath = true;
        try {
          const filePath = path.join(__dirname, '..', 'public', lo.file.url);
        } catch(e) {
          findedPath = false;
          console.log(e)
        }
        if (findedPath) {
          return fs.stat(filePath, (statErr, stat) => {
            if (statErr) {
              console.log(statErr);
            } else {
              console.log(`O diretório existe: ${stat}`);
              return fs.unlink(filePath, (err, unlinkRes) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log(`Arquivo removido: ${unlinkRes}`);
                }
              });
            }
            lo.remove({
              single: true,
            });
            req.session.success_message = 'Objeto removido com sucesso!';
            return res.redirect('back');
          });
        }
      }
      lo.remove({
        single: true,
      });
      req.session.success_message = 'Objeto removido com sucesso!';
      return res.redirect('back');
    });
  },
  /*
  * Página de listagem de OA's do usuário autenticado
  */
  getMyLearningObjects(req, res) {
    /*
    * Apenas usuários autenticados podem ver seus OA's(Obviamente)
    */
    if (!req.user) {
      req.session.error_message = 'Página restrita para usuários cadastrados!';
      return res.redirect('/');
    }
    /*
    * Busca na base de dados, OA's cujo dono é o usuário autenticado (req.user)
    */
    return LearningObject.find(
      {
        owner: req.user._id,
      },
      {
        title: 1,
        approved: 1,
      },
      {
        sort: {
          createdAt: -1,
        },
      }, (err, lo) => {
        if (err) {
          return res.send(err);
        }
        return res.render('learning-object/retrieve', { data: lo, title: 'Meus objetos de aprendizagem' });
      },
    );
  },
  /*
  * Baixar arquivo de um objeto de aprendizagem
  */
  getDownloadOaFile(req, res) {
    /*
    * Apenas usuários autenticados podem baixar arquivos
    */
    if (!req.user) {
      req.session.error_message = 'Apenas usuários autenticados podem baixar arquivos';
      return res.redirect('back');
    }
    /*
    * Busca o objeto pelo id passado na URL
    */
    return LearningObject.findById(req.params.id, {
      title: 1, _id: 0, file: 1, file_url: 1,
    }, (findErr, lo) => {
      if (findErr) {
        return res.send(findErr);
      }
      /*
      * Se o OA tiver um arquivo, retorna o download do mesmo e salva o registro do download
      */
      if (lo.file) {
        return res.download(path.join(__dirname, '..', 'public', lo.file.url), lo.title, (downloadErr) => {
          if (downloadErr) {
            res.send(downloadErr);
          }
          return new Downloads({
            user_id: req.user._id,
            learning_object_id: req.params.id,
          }).save();
        });
        /*
        * Caso o OA não tenha um arquivo, se houver uma URL, redireciona o usuário para a URL
        */
      } else if (lo.file_url) {
        return new Downloads({
          user_id: req.user._id,
          learning_object_id: req.params.id,
        }).save((saveDownloadErr) => {
          if (saveDownloadErr) {
            return res.send(saveDownloadErr);
          }
          return res.redirect(lo.file_url);
        });
      }
      /*
      * Sem URL e sem Arquivo apenas retorna com erro
      */
      req.session.error_message = 'O Objeto de aprendizagem não possui arquivos';
      return res.redirect('back');
    });
  },
};
