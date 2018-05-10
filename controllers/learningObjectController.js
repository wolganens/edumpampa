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
  getCreateFirstStep(req, res) {
    const permission = ac.can(req.user.role).createOwn('learningObject');
    if (!permission.granted) {
      return res.status(403).send('Você não tem permissão!');
    }
    return res.render('learning-object/create-1');
  },
  getCreateSecondStep(req, res) {
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
      contents(callback) {
        Contents.find({}).sort('name').exec(callback);
      },      
      lo(callback) {
        LearningObject.findById(req.params._id).exec(callback);
      }
    }, (err, results) => {

      return res.render('learning-object/create-2', {
        error: err,
        data: results,
        title: 'Cadastro de OA - EduMPampa',
      });
    });

  },
  getCreateThirdStep(req, res) {
    return async.parallel({      
      licenses(callback) {
        Licenses.find(callback);
      },
      lo(callback) {
        LearningObject.findById(req.params._id).exec(callback);
      }
    }, (err, results) => {

      return res.render('learning-object/create-3', {
        error: err,
        data: results,
        title: 'Cadastro de OA - EduMPampa',
      });
    });

  },
  postCreateFirstStep(req, res) {
    const permission = ac.can(req.user.role).createOwn('learningObject');
    if (!permission.granted) {
      return res.status(403).send('Você não tem permissão!');
    }
    /*Extrai dados vindos do formulário*/
    const {title, description, authors, year} = req.body
    /*Cria o objeto para instanciar o modelo do usuário (mongoose)*/
    let data = {
      title,
      description,
      authors,
      year,
      owner: req.user._id,
      approved: false,
      step: 1,
    }
    const lo = new LearningObject(data);

    return lo.save((err) => {
      if (err) {
        req.session.errors = err.errors;
        /*
        * Mantem o corpo do POST até a próxima requisição
        */
        req.flash('body', req.body);
        return res.redirect('back');
      }
      return res.redirect(`/learning-object/create-second-step/${lo._id}`);
    });
  },
  postCreateSecondStep(req, res){        
    return LearningObject.findById(req.body._id, function(err, lo) {
      let permission;
      /*
      * Verifica se o usuário autenticado é "dono"(owner) do OA
      */
      if (req.user._id.toString() === lo.owner.toString()) {
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
      
      Object.assign(lo, req.body, {step: 2});
      
      return lo.save((saveError) => {
        if (saveError) {
          req.session.errors = saveError.errors;
          /*
          * Mantem o corpo do POST até a próxima requisição
          */
          req.flash('body', req.body);
          return res.redirect('back');
        }
        return res.redirect(`/learning-object/create-third-step/${lo._id}`);
      });
    });
  },
  postCreateThirdStep(req, res){        
    return LearningObject.findById(req.body._id, function(err, lo) {
      let permission;
      /*
      * Verifica se o usuário autenticado é "dono"(owner) do OA
      */
      if (req.user._id.toString() === lo.owner.toString()) {
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
      
      Object.assign(lo, req.body, {approved: req.user.role === 'ADMIN' ? true : false}, {step: 3});

      return lo.save(function(saveError, saveResult){
        if(saveError) {
          return res.send(saveError);
        }

        let successMsg = req.user.role === 'ADMIN' ? ' aprovado ' : ' submetido para aprovação ';
        
        const mailOptions = {
          to: 'edumpampa@gmail.com',
          subject: 'Novo OA submetido para aprovação',
          html: pug.renderFile(path.join(__dirname, '..', 'views', 'emails/submited-oa.pug'), {
            user: req.user.name,
            title: lo.title,
            lo_id: lo._id,
            url: config.baseUrl,
          }),
        };
        return email.sendMail(mailOptions, (mailErr) => {
          if (mailErr) {
            return res.send(mailErr);
          }          
          req.session.success_message = `Objeto ${successMsg} com sucesso!`;
          return res.redirect(`/learning-object/single/${lo._id}`);
        });        
      })
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
          return res.redirect(`/learningobject/details/${results.lo._id}`);
        }
        switch (results.lo.step) {
          case 0:
            return res.redirect(`/learning-object/create-first-step/${results.lo._id}`);
            break;
          case 1:
            return res.redirect(`/learning-object/create-second-step/${results.lo._id}`);
            break;
          case 2:
            return res.redirect(`/learning-object/create-third-step/${results.lo._id}`);
            break;
          default:            
            return res.render('learning-object/single', {
              data: results,
              title: 'Atualização de OA  EduMPampa',
            });            
            break;
        }
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
    const storageName = (req.user._id + file.name).replace(/\s*/g,'');
    if (req.files && file) {
      fileAttrs.name = file.name;
      fileAttrs.mimetype = file.mimetype;
      fileAttrs.size = req.headers['content-length'];
      fileAttrs.url = path.join('/uploads', 'lo', storageName);
      const filePath = path.join(__dirname, '..', 'public', 'uploads', 'lo', storageName);
      fs.writeFileSync(filePath, file.data);
      return LearningObject.findByIdAndUpdate(req.body._id,{file: fileAttrs}, function(err, result) {
        if (err) {
          return res.send(err.error);
        }        
        return res.status(200).send({ file: fileAttrs });
      })
    } else {
      return res.status(500).send({ error: 'Arquivo não especificado' });
    }
  },
  postRemoveFile(req, res) {
    const storageName = (req.user._id + req.body.filename).replace(/\s*/g,'');
    const filePath = path.join(__dirname, '..', 'public', 'uploads', 'lo', storageName);
    return fs.unlink(filePath, (err) => {
      if (err) {
        return res.send(err);
      }
      return LearningObject.findByIdAndUpdate(req.body._id, {$unset: {file: 1}}, function(loErr, result) {
        if (loErr) {
          return res.send(loErr);
        }
        return res.status(200).end();
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
