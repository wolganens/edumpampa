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
const config = require('../config/index');

function getReqParamAsArray(reqparam) {
  if (reqparam) {
    if (Array.isArray(reqparam)) {
      return reqparam;
    }
    return [reqparam];
  }
  return null;
}

module.exports = {
  getCreate(req, res) {
    const permission = ac.can(req.user.role).createOwn('learningObject');
    if (!permission.granted) {
      res.status(403).send('Você não tem permissão!');
      return;
    }
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
        Resources.find({}).sort('name').exec(callback);
      },
      contents(callback) {
        Contents.find({}).sort('name').exec(callback);
      },
      licenses(callback) {
        Licenses.find(callback);
      },
    }, (err, results) => res.render('lo_create', { error: err, data: results, title: 'Cadastro de OA - EduMPampa' }));
  },
  postCreate(req, res) {
    const permission = !req.session.lo ? ac.can(req.user.role).createOwn('learningObject') : req.session.lo.owner.toString() == req.user._id ? ac.can(req.user.role).updateOwn('learningObject') : ac.can(req.user.role).updateAny('learningObject');
    if (!permission.granted) {
      return res.status(403).send('Você não tem permissão!');
    }
    const { body } = req;
    let learningObject = {
      owner: req.user._id,
      title: body.title,
      description: body.description,
      license_owner: body.license_owner,
      authors: body.authors,
      year: body.year,
      teaching_levels: getReqParamAsArray(body['teaching_levels[]']),
      axes: getReqParamAsArray(body['axes[]']),
      accessibility_resources: getReqParamAsArray(body['accessibility_resources[]']),
      content: getReqParamAsArray(body['contents[]']),
      resources: getReqParamAsArray(body['resources[]']),
      license: body.license,
      license_description: body.license_description,
      file: body.file_name ? JSON.parse(body.file_name) : null,
      file_url: body.file_url ? body.file_url : null,
    };
    if (req.user.role == 'ADMIN') {
      learningObject.approved = true;
    }
    learningObject = new LearningObject(learningObject);
    learningObject.save((err) => {
      if (err) {
        body['teaching_levels[]'] = getReqParamAsArray(body['teaching_levels[]'] || []);
        body['axes[]'] = getReqParamAsArray(body['axes[]'] || []);
        body['accessibility_resources[]'] = getReqParamAsArray(body['accessibility_resources[]'] || []);
        body['contents[]'] = getReqParamAsArray(body['contents[]'] || []);
        body['resources[]'] = getReqParamAsArray(body['resources[]'] || []);
        req.flash('inputs', body);
        req.flash('inputErrors', JSON.stringify(err));
        if (body.object_id) {
          return res.redirect(`/learning-object/single/${learningObject._id}`);
        }
        return res.redirect('/learning-object/create');
      }
      let successMsg = '';
      if (body.object_id) {
        successMsg = 'Objeto atualizado com sucesso!';
      } else if (req.user.role == 'ADMIN') {
        successMsg = 'Objeto cadastrado com sucesso!';
      } else {
        successMsg = 'Objeto submetido para aprovação com sucesso!';
        const mailOptions = {
          to: 'edumpampa@gmail.com',
          subject: 'Novo OA submetido para aprovação',
          html:
                  `   <p>O usuário ${req.user.name} submeteu um OA chamado ${learningObject.title} para aprovação: </p>
                      <a href="${config.baseUrl}/admin/learning-object/manage/#${learningObject._id}">Ver OA</a>
                  `,
        };
        email.sendMail(mailOptions, (err) => {
          if (err) {
            return res.send(err);
          }
        });
      }
      delete req.session.lo;
      req.flash('success_messages', successMsg);
      res.redirect(`/learning-object/single/${learningObject._id}`);
    });
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
      if (req.user) {
        const permission = (req.user._id == results.lo.owner.toString()) ? ac.can(req.user.role).updateOwn('learningObject') : ac.can(req.user.role).updateAny('learningObject');

        if (!permission.granted) {
          return res.redirect(`/learning-object/details/${results.lo._id}`);
        }
      } else {
        return res.redirect(`/learning-object/details/${results.lo._id}`);
      }
      req.session.lo = results.lo;
      return res.render('lo_update', { error: err, data: results });
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
        return res.render('lo_details', { error: err, data: results, title: 'Detalhes do Objeto de Aprendizagem - EduMPampa' });
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
    if (req.body.object_id) {
      const permission = req.session.lo.owner.toString() == req.user._id ? ac.can(req.user.role).updateOwn('learningObject') : ac.can(req.user.role).updateAny('learningObject');
      if (!permission.granted) {
        res.status(403).send('Você não tem permissão!');
        return;
      }
      const lo = LearningObject.findById(req.body.object_id, (err, result) => {
        if (err) {
          res.status(500).send({ error: err });
          return;
        }
        result.file = null;
        result.save();
        const filePath = path.join(__dirname, '..', 'public', 'uploads', 'lo', req.user._id + req.body.file_name);
        fs.stat(filePath, (err) => {
          if (!err) {
            fs.unlink(filePath, (err, res) => {
              if (err) {
                res.status(500).send({ error: err });
              }
            });
          }
        });
      });
    } else {
      const filePath = path.join(__dirname, '..', 'public', 'uploads', 'lo', req.user._id + req.body.file_name);
      fs.stat(filePath, (err) => {
        if (!err) {
          fs.unlink(filePath, (err, res) => {
            if (err) {
              res.status(500).send({ error: err });
            }
          });
        }
      });
    }
    res.status(200).send({ success: 'Arquivo removido com sucesso!' });
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
              Definição do termo de busca, através do campo "search_text (GET)"
          */
      const searchText = req.query.search_text || req.query.search_text == '' ? req.query.search_text : req.session.search;
      req.session.search = searchText;
      /*
              Parâmetros adicionais de paginação
          */
      const page = req.query && req.query.page ? req.query.page : 1;
      const skip = (page - 1) * 10;
      const limit = 10;

      /*
              Definição do objeto (documento) utilizado para trazer os registros do banco de dados, no caso uma busca por expressão regular é feita sobre o campo "title" dos objetos de aprendizagem
          */
      const query_object = {
        title: {
          $regex: new RegExp(searchText),
          $options: 'i',
        },
      };

      /*
              Inicia o processo de "montagem" da query de busca, projetando apenas os campos necessários,
              e trazendo apenas objetos já aprovados.
          */
      const cursor = LearningObject.find(
        query_object,
        {
          title: 1,
          createdAt: 1,
          description: 1,
        },
      ).where('approved')
        .equals(true);

      /* Caso o usuário esteja filtrando os resultados, adiciona os filtros na query de busca */
      const selectedFilters = {};
      if ('content' in req.query && req.query.content != '') {
        selectedFilters.content = req.query.content;
        cursor.where('content').equals(req.query.content);
      }
      if ('resource' in req.query && req.query.resource != '') {
        selectedFilters.resource = req.query.resource;
        cursor.where('resources').equals(req.query.resource);
      }

      cursor.count((err, count) => {
        cursor.skip(skip).limit(limit).exec('find', (err, lo) => {
          if (err) {
            return res.send(err);
          }
          /* Adiciona o objeto de aprendizagem nos resultados e renderiza a view */
          results.learning_object = lo;
          return res.render('lo_search_results', {
            data: results,
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
              Variavel responsavel por armazenar os filtros de busca da query
          */
      let and = {
        $and: [],
      };
      let checkedString = '';

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
        checkedString = req.query.checked_string;
        /*
                  Popula os arrays de consulta com os checkbox marcados pelo usuário
              */
        const q_acc_resources = req.query.accessibility_resources ? getReqParamAsArray(req.query.accessibility_resources) : [];
        const q_axes = req.query.axes ? getReqParamAsArray(req.query.axes) : [];
        const q_teaching_levels = req.query.teaching_levels ? getReqParamAsArray(req.query.teaching_levels) : [];
        if (q_acc_resources.length > 0) {
          and.$and.push({
            accessibility_resources: { $all: q_acc_resources },
          });
        }
        if (q_axes.length > 0) {
          and.$and.push({
            axes: { $all: q_axes },
          });
        }
        if (q_teaching_levels.length > 0) {
          and.$and.push({
            teaching_levels: { $all: q_teaching_levels },
          });
        }
        req.session.search = and;
        req.session.checked_string = checked_string;
      } else {
        checkedString = req.session.checked_string;
        and = req.session.search;
      }
      /*
              Inicia o processo de "montagem" da query de busca, projetando apenas os campos necessários,
              e trazendo apenas objetos já aprovados.
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

      /* Caso o usuário esteja filtrando os resultados, adiciona os filtros na query de busca */
      const selected_filters = {};
      if ('content' in req.query && req.query.content != '') {
        selected_filters.content = req.query.content;
        cursor.where('content').equals(req.query.content);
      }
      if ('resource' in req.query && req.query.resource != '') {
        selected_filters.resource = req.query.resource;
        cursor.where('resources').equals(req.query.resource);
      }
      cursor.count((err, count) => {
        cursor.skip(skip).limit(limit).exec('find', (err, lo) => {
          if (err) {
            return res.send(err);
          }
          /* Adiciona o objeto de aprendizagem nos resultados e renderiza a view */
          results.learning_object = lo;
          return res.render('lo_search_results', {
            data: results,
            selected_filters,
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
      const lo_approved = result.approved;
      result.approved = !lo_approved;
      result.save();
      if (result.approved) {
        req.flash('success_messages', 'Objeto aprovado com sucesso!');
      } else {
        req.flash('success_messages', 'Objeto desaprovado com sucesso!');
      }
      res.redirect('/admin/learning-object/manage');
    });
  },
  getRemoveObject(req, res) {
    return LearningObject.findById(req.params.id, { owner: 1, file: 1 }, (err, lo) => {
      const permission = lo.owner.toString() == req.user._id.toString() ? ac.can(req.user.role).deleteOwn('learningObject') : ac.can(req.user.role).deleteAny('learningObject');

      if (!permission.granted) {
        return res.status(403).send('Você não tem permissão!');
      }
      if (lo.file) {
        const filePath = path.join(__dirname, '..', 'public', lo.file.url);
        return fs.stat(filePath, (err, stat) => {
          if (err) {
            return res.send(err);
          }
          return fs.unlink(filePath, (err, unlink_res) => {
            lo.remove({
              single: true,
            });
            req.flash('success_messages', 'Objeto removido com sucesso!');
            return res.redirect('back');
          });
        });
      }
      lo.remove({
        single: true,
      });
      req.flash('success_messages', 'Objeto removido com sucesso!');
      return res.redirect('back');
    });
  },
  /*
      Página de listagem de OA's do usuário autenticado
  */
  getMyLearningObjects(req, res) {
    /* Apenas usuários autenticados podem ver seus OA's(Obviamente) */
    if (!req.user) {
      req.flash('error_messages', 'Página restrita para usuários cadastrados!');
      return res.redirect('/');
    }
    /* Busca na base de dados, OA's cujo dono é o usuário autenticado (req.user) */
    return LearningObject.find(
      {
        owner: req.user._id,
      },
      {
        title: 1,
        approved: 1,
      }, (err, lo) => {
        if (err) {
          return res.send(err);
        }
        return res.render('lo_retrieve', { data: lo, title: 'Meus objetos de aprendizagem' });
      },
    );
  },
  /*
      Baixar arquivo de um objeto de aprendizagem
  */
  getDownloadOaFile(req, res) {
    /* Apenas usuários autenticados podem baixar arquivos */
    if (!req.user) {
      req.flash('error_messages', 'Apenas usuários autenticados podem baixar arquivos');
      return res.redirect('back');
    }
    /* Busca o objeto pelo id passado na URL */
    return LearningObject.findById(req.params.id, {
      title: 1, _id: 0, file: 1, file_url: 1,
    }, (err, lo) => {
      if (err) {
        return res.send(err);
      }
      /* Se o OA tiver um arquivo, retorna o download do mesmo e salva o registro do download */
      if (lo.file) {
        return res.download(path.join(__dirname, '..', 'public', lo.file.url), lo.title, (err, download) => {
          if (err) {
            res.send(err);
          }
          return new Downloads({
            user_id: req.user._id,
            learning_object_id: req.params.id,
          }).save();
        });
        /* Caso o OA não tenha um arquivo, se houver uma URL, redireciona o usuário para a URL */
      } else if (lo.file_url) {
        return new Downloads({
          user_id: req.user._id,
          learning_object_id: req.params.id,
        }).save((err, download_id) => res.redirect(lo.file_url));
        /* Sem URL e sem Arquivo apenas retorna com erro */
      }
      req.flash('error_messages', 'O Objeto de aprendizagem não posui arquivos');
      return res.redirect('back');
    });
  },
};
