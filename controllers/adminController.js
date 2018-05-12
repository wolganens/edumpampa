const ac = require('../config/roles');
const LearningObject = require('../models/learningobject');
const User = require('../models/user');
const moment = require('moment')
/*
* Ordena um vetor de objetos com base em um campo do objeto
*/
const { sortDocsInArray } = require('../helpers/utils.js');

/*
* Métodos "privados" da controller
*/
const setOaApprovedStatus = (filter, status) => {
  return LearningObject.updateMany(
    filter,
    {
      $set: {approved: status}
    }
  );
}
const removeLearningObjects = (filter) => {
  return LearningObject.remove(filter);
}

const routeMethods = {
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
      { value: '', text: 'Ordenar resultados' },
      { value: 'name', text: 'Nome' },
      { value: 'newer', text: 'Mais novo' },
      { value: 'older', text: 'Mais antigos' },
    ];
    /*
    * Opções de filtros por situação
    */
    const situationOptions = [
      { value: '', text: 'Selecionar situação' },
      { value: 'aut', text: 'Autorizados' },
      { value: 'des', text: 'Desautorizados' },
    ];
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
    if (req.query.export && req.query.export === 'csv') {
      let csv_string = `"Nome";"Email";"Aniversário";"Formação";"Área de Atuação";"Vínculo Institucional";"Cargo na Instituição";"Instituição";"Enredeço da Instituição"\n`;
      return users
      .populate('qualification_id')
      .populate('occupation_area_id')
      .populate('institutional_link_id')
      .populate('institutional_post_id')
      .exec(function(err, result) {
        result.forEach(function(user) {
          
          csv_string+= `"${user.name}";"${user.email}";"${moment(user.birthday).format('DD/MM/YYYY')}";"${user.qualification_id ? user.qualification_id.name : user.qualification_text}";"${user.occupation_area_id ? user.occupation_area_id.name: user.occupation_area_text}";"${user.institutional_link_id ? user.institutional_link_id.name: user.institutional_link_text}";"${user.institutional_post_id ? user.institutional_post_id.map(post => post.name).join(',') : user.institutional_post_text}";"${user.institution_name}";"${user.institution_address}"   
          `
        })
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-disposition', 'attachment; filename=users.csv');
        res.write(csv_string);
        return res.end();
      })
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

      return res.render('admin/user/manage', {
        sortOptions,
        situationOptions,
        data,
        title: 'Gerenciar Usuários',
      });
    });
  },
  getMassUserAuthorize(req, res) {
    /*
    * Verifica se o usuário autenticado tem permissão para editar qualquer usuário
    */
    const permission = ac.can(req.user.role).updateAny('user');
    if (!permission.granted) {
      return res.status(403).send('Você não tem permissão!');
    }    
    return User.updateMany({_id: req.body.resource_ids, role: {$ne: 'ADMIN'}}, {role: 'AUTHORIZED' }, (err, result) => {
      console.log(result)
      if (err) {
        return res.send(err);
      }
      req.session.success_message = 'Usuários autorizados com sucesso!';
      return res.sendStatus(200);
    });
  },
  getMassUserRemove(req, res) {
     /*
    * Verifica se o usuário tem permissão para remover usuários (Admin)
    */
    const permission = ac.can(req.user.role).deleteAny('user');
    if (!permission.granted) {
      return res.status(403).send('Você não tem permissão!');
    }
    /*
    * Remove todos os objetos de aprendizagem que são de propriedade
    * do usuário que está tentando ser excluído (owner)
    */
    return LearningObject.remove({ owner: req.body.resource_ids }, (errLO) => {
      if (errLO) {
        return res.send(errLO);
      }
      /*
      * Remove o usuário em si
      */
      return User.remove({_id: req.body.resource_ids}, (errUser) => {
        if (errUser) {
          return res.send(errUser);
        }
        req.session.success_message = 'Usuários removidos com sucesso!';
        res.sendStatus(200);
      });
    });
  },
  getMassUserUnauthorize(req, res) {
    /*
    * Verifica se o usuário autenticado tem permissão para editar qualquer usuário
    */
    const permission = ac.can(req.user.role).updateAny('user');
    if (!permission.granted) {
      return res.status(403).send('Você não tem permissão!');
    }    
    return User.updateMany({_id: req.body.resource_ids, role: {$ne: 'ADMIN'}}, {role: 'COMMON' }, (err, result) => {
      console.log(result)
      if (err) {
        return res.send(err);
      }
      req.session.success_message = 'Usuários desautorizados com sucesso!';
      return res.sendStatus(200);
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
    * Opções de ordenação de resultados (data)
    */
    const sortOptions = [
      { value: '', text: 'Ordenar resultados' },
      { value: 'name', text: 'Título' },
      { value: 'newer', text: 'Mais novos' },
      { value: 'older', text: 'Mais antigos' },
    ];
    /*
    * Opções de filtros por situação
    */
    const situationOptions = [
      { value: '', text: 'Selecionar situação' },
      { value: 'hab', text: 'Habilitados' },
      { value: 'des', text: 'Desabilitados' },
    ];
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

      return res.render('admin/learning-object/manage', {
        sortOptions, situationOptions, data, title: "Gerenciar OA",
      });
    });
  },
  getUserRemove(req, res) {
    /*
    * Verifica se o usupário tem permissão para remover usuários (Admin)
    */
    const permission = ac.can(req.user.role).deleteAny('user');
    if (!permission.granted) {
      return res.status(403).send('Você não tem permissão!');
    }
    /*
    * Remove todos os objetos de aprendizagem que são de propriedade
    * do usuário que está tentando ser excluído (owner)
    */
    return LearningObject.remove({ owner: req.params.id }, (errLO) => {
      if (errLO) {
        return res.send(errLO);
      }
      /*
      * Remove o usuário em si
      */
      return User.findByIdAndRemove(req.params.id, (errUser) => {
        if (errUser) {
          return res.send(errUser);
        }
        req.session.success_message = 'Usuário removido com sucesso!';
        return res.redirect('/admin/user/manage');
      });
    });
  },
  postLearningObjectSetApproveStatus(req, res) {
    let filter = {};
    if (req.body.owner) {
      filter["owner"] = {
        $in: req.body._id
      }
    } else {
      filter["_id"] = {
        $in: req.body._id
      }
    }
    return setOaApprovedStatus(filter, req.body.status).exec((err, result) => {
      if (err) {        
        return res.send(err);
      } else {        
        return res.send({ok: 1});
      }
    });
  },
  postLearningObjectRemove(req, res) {
    let filter = {};
    if (req.body.owner) {
      filter["owner"] = {
        $in: req.body._id
      }
    } else {
      filter["_id"] = {
        $in: req.body._id
      }
    }
    return removeLearningObjects(filter).exec((err, result) => {
      if (err) {        
        return res.send(err);
      } else {        
        return res.send({ok: 1});
      }
    });
  }
};
module.exports = routeMethods;