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
      if (req.query.situation == 'aut') {
        query.where('role').equals('AUTHORIZED');
      } else if (req.query.situation == 'des') {
        query.where('role').equals('COMMON');
      }
    }
    if (req.query.name) {
      query.where('name').equals(new RegExp(req.query.name, 'i'));
    }
    query.exec((err, result) => {
      if (err) {
        res.send(err);
      }
      result.sort((a, b) => {
        const nameA = a.name.toUpperCase();
        const nameB = b.name.toUpperCase();

        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });
      req.flash('inputs', req.query);
      res.render('user_manage', {
        data: result, title: 'Gerenciar usuários - EduMPampa', situation: req.query.situation || '', name: req.query.name || '',
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
      if (req.query.situation == 'hab') {
        query.where('approved').equals(true);
      } else if (req.query.situation == 'des') {
        query.where('approved').equals(false);
      }
    }
    if (req.query.title) {
      query.where('title').equals(new RegExp(req.query.title, 'i'));
    }
    query.exec((err, result) => {
      if (err) {
        res.send(err);
      }
      result.sort((a, b) => {
        const nameA = a.title.toUpperCase();
        const nameB = b.title.toUpperCase();

        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });
      req.flash('inputs', req.query);
      res.render('lo_manage', {
        data: result, title: "Gerenciar OA's - EduMPampa", situation: req.query.situation || '', oatitle: req.query.title || '',
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
      res.render('admin_reports', { data: results, title: 'Relatórios - EduMPampa' });
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
    return User.count(userQueryDocument, (err, count) => User.find(userQueryDocument, (err, users) => res.render('admin_reports_users_results', { count, users, title: 'Resultado do Relatório - EduMPampa' })));
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
      res.render('admin_reports_oa', { title: 'Relatórios OA - EduMPampa', data: results });
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
    const qAccResources = req.query.accessibility_resources ? getReqParamAsArray(req.query.accessibility_resources) : [];
    const qAxes = req.query.axes ? getReqParamAsArray(req.query.axes) : [];
    const qTeachingLevels = req.query.teaching_levels ? getReqParamAsArray(req.query.teaching_levels) : [];
    const qResources = req.query.resources ? getReqParamAsArray(req.query.resources) : [];
    const qContents = req.query.contents ? getReqParamAsArray(req.query.contents) : [];
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
