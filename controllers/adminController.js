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
const { sortDocsInArray, mergeCheckboxData } = require('../helpers/utils.js');

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
  getUserManage(req, res) {
    const permission = ac.can(req.user.role).updateAny('user');
    if (!permission.granted) {
      res.status(403).send('Você não tem permissão!');
      return;
    }
    const query = User.find();
    if (req.query.situation) {
      if (req.query.situation === 'aut') {
        query.where('role').equals('AUTHORIZED');
      } else if (req.query.situation === 'des') {
        query.where('role').equals('COMMON');
      }
    }
    if (req.query.name) {
      query.where('name').equals(new RegExp(req.query.name, 'i'));
    }
    const { sort } = req.query;
    if (sort) {
      if (sort === 'newer') {
        query.sort({ createdAt: -1 });
      } else if (sort === 'older') {
        query.sort({ createdAt: 1 });
      }
    }
    query.exec((err, result) => {
      let data = result;
      if (err) {
        res.send(err);
      }
      if (!sort || sort === 'name') {
        data = sortDocsInArray(data, 'name');
      }
      req.flash('inputs', req.query);
      return res.render('admin/user/manage', {
        sort, data, title: 'Gerenciar usuários - EduMPampa', situation: req.query.situation || '', name: req.query.name || '',
      });
    });
  },
  getUserAuthorize(req, res) {
    const permission = ac.can(req.user.role).updateAny('user');
    if (!permission.granted) {
      res.status(403).send('Você não tem permissão!');
      return;
    }
    User.findByIdAndUpdate(req.params.id, { $set: { role: 'AUTHORIZED' } }, (err) => {
      if (err) {
        res.send(err);
        return;
      }
      req.flash('success_messages', 'Usuário autorizado com sucesso!');
      res.redirect('/admin/user/manage');
    });
  },
  getUserUnauthorize(req, res) {
    const permission = ac.can(req.user.role).updateAny('user');
    if (!permission.granted) {
      res.status(403).send('Você não tem permissão!');
      return;
    }
    User.findByIdAndUpdate(req.params.id, { $set: { role: 'COMMON' } }, (err) => {
      if (err) {
        res.send(err);
        return;
      }
      req.flash('success_messages', 'Usuário desautorizado com sucesso!');
      res.redirect('/admin/user/manage');
    });
  },
  getLearningObjectManage(req, res) {
    const permission = ac.can(req.user.role).updateAny('learningObject');
    if (!permission.granted) {
      res.status(403).send('Você não tem permissão!');
      return;
    }
    const query = LearningObject.find();
    if (req.query.situation) {
      if (req.query.situation === 'hab') {
        query.where('approved').equals(true);
      } else if (req.query.situation === 'des') {
        query.where('approved').equals(false);
      }
    }
    if (req.query.title) {
      query.where('title').equals(new RegExp(req.query.title, 'i'));
    }
    const { sort } = req.query;
    if (sort) {
      if (sort === 'newer') {
        query.sort({ createdAt: -1 });
      } else if (sort === 'older') {
        query.sort({ createdAt: 1 });
      }
    }
    query.exec((err, result) => {
      let data = result;
      if (err) {
        res.send(err);
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
