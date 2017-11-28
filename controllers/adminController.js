

const async = require('async');

var LearningObject = require('../models/learningobject');
const User = require('../models/user');
const ac = require('../config/roles');
const InstitutionalLink = require('../models/institutional_link');
const OccupationArea = require('../models/occupation_area');
const Qualification = require('../models/qualifications');
const AccessibilityResources = require('../models/accessibilityresources');
const Axes = require('../models/axes');
const TeachingLevels = require('../models/teachinglevels');
var LearningObject = require('../models/learningobject');
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

exports.getUserManage = function (req, res) {
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
};
exports.getUserAuthorize = function (req, res) {
  const permission = ac.can(req.user.role).updateAny('user');
  if (!permission.granted) {
    res.status(403).send('Você não tem permissão!');
    return;
  }
  User.findByIdAndUpdate(req.params.id, { $set: { role: 'AUTHORIZED' } }, (err, tank) => {
    if (err) {
      res.send(err);
      return;
    }
    req.flash('success_messages', 'Usuário autorizado com sucesso!');
    res.redirect('/admin/user/manage');
  });
};
exports.getUserUnauthorize = function (req, res) {
  const permission = ac.can(req.user.role).updateAny('user');
  if (!permission.granted) {
    res.status(403).send('Você não tem permissão!');
    return;
  }
  User.findByIdAndUpdate(req.params.id, { $set: { role: 'COMMON' } }, (err, tank) => {
    if (err) {
      res.send(err);
      return;
    }
    req.flash('success_messages', 'Usuário desautorizado com sucesso!');
    res.redirect('/admin/user/manage');
  });
};
exports.getLearningObjectManage = function (req, res) {
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
};
/*
    Página de relatórios
*/
exports.getReports = function (req, res) {
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
};
/*
    Relatórios de usuários com base na área de atuação, formação e vínculo instituicional
*/
exports.getReportsUsers = function (req, res) {
  const user_query_document = {};

  if (req.query.qualification_id) {
    user_query_document.qualification_id = req.query.qualification_id;
  } else if (req.query.qualification_text) {
    user_query_document.qualification_text = req.query.qualification_text;
  }

  if (req.query.occupation_area_id) {
    user_query_document.occupation_area_id = req.query.occupation_area_id;
  } else if (req.query.occupation_area_text) {
    user_query_document.occupation_area_text = req.query.occupation_area_text;
  }

  if (req.query.institutional_link_id) {
    user_query_document.institutional_link_id = req.query.institutional_link_id;
  } else if (req.query.institutional_link_text) {
    user_query_document.institutional_link_text = req.query.institutional_link_text;
  }
  return User.count(user_query_document, (err, count) => User.find(user_query_document, (err, users) => res.render('admin_reports_users_results', { count, users, title: 'Resultado do Relatório - EduMPampa' })));
};
exports.getUserRemove = function (req, res) {
  const permission = ac.can(req.user.role).deleteAny('user');
  if (!permission.granted) {
    return res.status(403).send('Você não tem permissão!');
  }
  return LearningObject.remove({ owner: req.params.id }, (err_lo, removed) => {
    if (err_lo) {
      return res.send(err_lo);
    }
    return User.findByIdAndRemove(req.params.id, (err_user, removed_user) => {
      if (err_user) {
        return res.send(err_user);
      }
      req.flash('success_messages', 'Usuário removido com sucesso!');
      return res.redirect('/admin/user/manage');
    });
  });
};
/*
    Relatório de Objetos de aprendizagem
    */
exports.getLoReports = function (req, res) {
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
};

exports.getLoReportsResults = function (req, res) {
  /*
        Variavel responsavel por armazenar os filtros de busca da query
    */
  const and = {
    $and: [],
  };
    /*
        Popula os arrays de consulta com os checkbox marcados pelo usuário
    */
  const q_acc_resources = req.query.accessibility_resources ? getReqParamAsArray(req.query.accessibility_resources) : [];
  const q_axes = req.query.axes ? getReqParamAsArray(req.query.axes) : [];
  const q_teaching_levels = req.query.teaching_levels ? getReqParamAsArray(req.query.teaching_levels) : [];
  const q_resources = req.query.resources ? getReqParamAsArray(req.query.resources) : [];
  const q_contents = req.query.contents ? getReqParamAsArray(req.query.contents) : [];
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
  if (q_contents.length > 0) {
    and.$and.push({
      content: { $all: q_contents },
    });
  }
  if (q_resources.length > 0) {
    and.$and.push({
      resources: { $all: q_resources },
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
};

module.exports.postAprroveUserOa = postAprroveUserOa;
module.exports.postDisapproveUserOa = postDisapproveUserOa;
module.exports.postRemoveUserOa = postRemoveUserOa;

function postAprroveUserOa(req, res) {
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
}
function postDisapproveUserOa(req, res) {
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
}
function postRemoveUserOa(req, res) {
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
}
