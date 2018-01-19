const async = require('async');

const User = require('../models/user');
const ac = require('../config/roles');
const InstitutionalLink = require('../models/institutional_link');
const OccupationArea = require('../models/occupation_area');
const Qualification = require('../models/qualifications');
const AccessibilityResources = require('../models/accessibilityresources');
const Axes = require('../models/axes');
const TeachingLevels = require('../models/teachinglevels');
const LearningObject = require('../models/learningobject');
const Contents = require('../models/contents');
const Resources = require('../models/resources');
const { sortDocsInArray } = require('../helpers/utils.js');

module.exports = {
  /*
  * Exibe a página de gerenciamento de usuários
  */
  getUserManage(req, res) {
    /*
    * Verifica se o usuário autenticado tem permissão para editar qualquer usuário
    */
    const permission = ac.can(req.user.role).updateAny('user');
    if (!permission.granted) {
      return res.status(403).send('Você não tem permissão!');      
    }
    /*
    * Opções de ordenação de resultados (data)
    */
    const sortOptions = [
      {value: '' , text: 'Ordenar resultados' },
      {value: 'name' , text: 'Nome' },
      {value: 'newer' , text: 'Mais novo'},
      {value: 'older' , text: 'Mais antigos'},
    ]
    /*
    * Opções de filtros por situação do OA
    */
    const situationOptions = [
      {value: '' , text: 'Selecionar situação'},
      {value: 'aut' , text: 'Autorizados'},
      {value: 'des' , text: 'Desautorizados'},
    ]
    /*
    * Inicia a consulta procurando por todos os usuários, sem restrições
    */
    const users = User.find();
    /*
    * Se houver algum filtro por situação, aplica na consulta
    */
    if (req.query.situation) {
      if (req.query.situation === 'aut') {
        users.where('role').equals('AUTHORIZED');
      } else if (req.query.situation === 'des') {
        users.where('role').equals('COMMON');
      }
    }
    /*
    * Se houver algum filtro por nome de usuário, aplica na consulta
    */
    if (req.query.name) {
      users.where('name').equals(new RegExp(req.query.name, 'i'));
    }
    /*
    * Se houver alguma ordem de data definida, aplica a ordem na consulta
    */
    const { sort } = req.query;
    if (sort) {
      if (sort === 'newer') {
        users.sort({ createdAt: -1 });
      } else if (sort === 'older') {
        users.sort({ createdAt: 1 });
      }
    }
    /*
    * Executa a consulta na base de dados
    */
    return users.exec((err, result) => {
      let data = result;
      if (err) {
        return res.send(err);
      }
      /*
      * Caso não tenha sido especificada uma ordenação ou seja especificada ordenação
      por nome de usuário, aplica a função para ordenar;
      */
      if (!sort || sort === 'name') {
        data = sortDocsInArray(data, 'name');
      }
      /*
      * Mantém o formulário preenchindo com as informações vindas da requisição
      */
      req.session.post = req.query;
      
      return res.render('admin/user/manage', {
        sortOptions,
        situationOptions,
        data,
        title: 'Gerenciar usuários - EduMPampa',
      });
    });
  },
  getUserAuthorize(req, res) {
    /*
    * Verifica se o usuário autenticado tem permissão para editar qualquer usuário
    */
    const permission = ac.can(req.user.role).updateAny('user');
    if (!permission.granted) {
      return res.status(403).send('Você não tem permissão!');      
    }
    /*
    * Encontra o usuário e atualiza seu papel para 'AUTHORIZED'
    */
    return User.findByIdAndUpdate(req.params.id, { $set: { role: 'AUTHORIZED' } }, (err) => {
      if (err) {
        return res.send(err);        
      }
      req.session.success_message = 'Usuário autorizado com sucesso!';      
      return res.redirect('back');
    });
  },
  getUserUnauthorize(req, res) {
    /*
    * Verifica se o usuário autenticado tem permissão para editar qualquer usuário (admin)
    */
    const permission = ac.can(req.user.role).updateAny('user');
    if (!permission.granted) {
      return res.status(403).send('Você não tem permissão!');      
    }
    /*
    * Encontra o usuário e atualiza seu papel para 'COMMON'
    */
    return User.findByIdAndUpdate(req.params.id, { $set: { role: 'COMMON' } }, (err) => {
      if (err) {
        return res.send(err);        
      }
      req.session.success_message = 'Usuário desautorizado com sucesso!';      
      return res.redirect('back');
    });
  },
  getLearningObjectManage(req, res) {
    /*
    * Verifica se o usuário autenticado tem permissão para editar qualquer OA (admin)
    */
    const permission = ac.can(req.user.role).updateAny('learningObject');
    if (!permission.granted) {
      return res.status(403).send('Você não tem permissão!');      
    }
    /*
    * Inicia a cosulta trazendo todos os OA da base de dados
    */
    const query = LearningObject.find();
    /*
    * Se na requisição existir um filtor pela situação do OA, aplica o filtro na consulta
    */
    if (req.query.situation) {
      if (req.query.situation === 'hab') {
        query.where('approved').equals(true);
      } else if (req.query.situation === 'des') {
        query.where('approved').equals(false);
      }
    }
    /*
    * Se houver um filtro pelo título, aplica na consulta uma busca por expressão regular
    */
    if (req.query.title) {
      query.where('title').equals(new RegExp(req.query.title, 'i'));
    }
    /*
    * Ordena os documentos caso seja especificada uma ordem na consulta
    */
    const { sort } = req.query;
    if (sort) {
      if (sort === 'newer') {
        query.sort({ createdAt: -1 });
      } else if (sort === 'older') {
        query.sort({ createdAt: 1 });
      }
    }
    /*
    * Executa a consulta, buscando os dados na base de dados e armazenando na variavel result
    */
    return query.exec((err, result) => {
      let data = result;
      if (err) {
        return res.send(err);
      }
      if (!sort || sort === 'name') {
        data = sortDocsInArray(data, 'title');
      }
      req.flash('inputs', req.query);
      return res.render('admin/learning-object/manage', {
        sort, data, title: "Gerenciar OA's - EduMPampa", situation: req.query.situation || '', oatitle: req.query.title || '',
      });
    });
  },
  /*
      Página de relatórios
  */
  getReports(req, res) {
    async.parallel({
      institutional_links(callback) {
        InstitutionalLink.find(callback);
      },
      occupation_areas(callback) {
        OccupationArea.find(callback);
      },
      qualifications(callback) {
        Qualification.find(callback);
      },
    }, (err, results) => {
      res.render('admin/reports/index', {
        data: mergeCheckboxData({ options: results }, results),
        title: 'Relatórios - EduMPampa',
        activetab: 'Usuários',
      });
    });
  },
  /*
      Relatórios de usuários com base na área de atuação, formação e vínculo instituicional
  */
  getReportsUsers(req, res) {
    const userQueryDocument = {};

    if (req.query.qualification_id) {
      userQueryDocument.qualification_id = req.query.qualification_id;
    } else if (req.query.qualification_text) {
      userQueryDocument.qualification_text = req.query.qualification_text;
    }

    if (req.query.occupation_area_id) {
      userQueryDocument.occupation_area_id = req.query.occupation_area_id;
    } else if (req.query.occupation_area_text) {
      userQueryDocument.occupation_area_text = req.query.occupation_area_text;
    }

    if (req.query.institutional_link_id) {
      userQueryDocument.institutional_link_id = req.query.institutional_link_id;
    } else if (req.query.institutional_link_text) {
      userQueryDocument.institutional_link_text = req.query.institutional_link_text;
    }
    return User.count(userQueryDocument, (countErr, count) => {
      if (countErr) {
        return res.send(countErr);
      }
      return User.find(userQueryDocument, (err, users) => {
        if (err) {
          return res.send(err);
        }
        return res.render('admin/reports/users', {
          count,
          users,
          title: 'Resultado do Relatório - EduMPampa',
          activetab: 'Usuários',
        });
      });
    });
  },
  getUserRemove(req, res) {
    const permission = ac.can(req.user.role).deleteAny('user');
    if (!permission.granted) {
      return res.status(403).send('Você não tem permissão!');
    }
    return LearningObject.remove({ owner: req.params.id }, (errLO) => {
      if (errLO) {
        return res.send(errLO);
      }
      return User.findByIdAndRemove(req.params.id, (errUser) => {
        if (errUser) {
          return res.send(errUser);
        }
        req.flash('success_messages', 'Usuário removido com sucesso!');
        return res.redirect('/admin/user/manage');
      });
    });
  },
  /*
      Relatório de Objetos de aprendizagem
      */
  getLoReports(req, res) {
    const permission = ac.can(req.user.role).updateAny('learningObject');
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
    }, (err, results) => {
      if (err) {
        return res.send(err);
      }
      return res.render('admin/reports/learning-objects', {
        title: 'Relatórios OA - EduMPampa',
        data: mergeCheckboxData({ options: results }, results),
        activetab: 'OA\'s',
      });
    });
  },
  getLoReportsResults(req, res) {
    /*
          Variavel responsavel por armazenar os filtros de busca da query
      */
    const and = {
      $and: [],
    };
    /*
          Popula os arrays de consulta com os checkbox marcados pelo usuário
      */
    let qAccResources = [];
    if (req.query.accessibility_resources) {
      qAccResources = getReqParamAsArray(req.query.accessibility_resources);
    }
    let qAxes = [];
    if (req.query.axes) {
      qAxes = getReqParamAsArray(req.query.axes);
    }
    let qTeachingLevels = [];
    if (req.query.teaching_levels) {
      qTeachingLevels = getReqParamAsArray(req.query.teaching_levels);
    }
    let qResources = [];
    if (req.query.resources) {
      qResources = getReqParamAsArray(req.query.resources);
    }
    let qContents = [];
    if (req.query.contents) {
      qContents = getReqParamAsArray(req.query.contents);
    }
    if (qAccResources.length > 0) {
      and.$and.push({
        accessibility_resources: { $all: qAccResources },
      });
    }
    if (qAxes.length > 0) {
      and.$and.push({
        axes: { $all: qAxes },
      });
    }
    if (qTeachingLevels.length > 0) {
      and.$and.push({
        teaching_levels: { $all: qTeachingLevels },
      });
    }
    if (qContents.length > 0) {
      and.$and.push({
        content: { $all: qContents },
      });
    }
    if (qResources.length > 0) {
      and.$and.push({
        resources: { $all: qResources },
      });
    }
    console.log(JSON.stringify(and));
    LearningObject.aggregate([
      {
        $match: and,
      },
      {
        $project: { title: '$title' },
      },
    ], (err, result) => {
      if (err) {
        return res.send(err);
      }
      return res.send(result);
    });
    // Quando for renderizar a View, inserir também no objeto
    // para ativar a tab:
    // { activetab: 'OA\'s por usuário' }
  },
  getUserLoReports(req, res) {
    req.flash('success_messages', "Página em construção!");
    return res.redirect('back');
  },
  postAprroveUserOa(req, res) {
    const permission = ac.can(req.user.role).updateAny('learningObject');
    if (!permission.granted) {
      return res.status(403).send('Você não tem permissão!');
    }
    return LearningObject.updateMany(
      {
        owner: {
          $in: req.body['user_ids[]'],
        },
      },
      {
        $set: {
          approved: true,
        },
      }, (err, result) => {
        if (err) {
          return res.send(err);
        }
        return res.send(result);
      },
    );
  },
  postDisapproveUserOa(req, res) {
    const permission = ac.can(req.user.role).updateAny('learningObject');
    if (!permission.granted) {
      return res.status(403).send('Você não tem permissão!');
    }
    return LearningObject.updateMany(
      {
        owner: {
          $in: req.body['user_ids[]'],
        },
      },
      {
        $set: {
          approved: false,
        },
      }, (err, result) => {
        if (err) {
          return res.send(err);
        }
        return res.send(result);
      },
    );
  },
  postRemoveUserOa(req, res) {
    const permission = ac.can(req.user.role).deleteAny('user');
    if (!permission.granted) {
      return res.status(403).send('Você não tem permissão!');
    }
    return LearningObject.deleteMany({
      owner: {
        $in: req.body['user_ids[]'],
      },
    }, (err, result) => {
      if (err) {
        return res.send(err);
      }
      return res.send(result);
    });
  },
};
