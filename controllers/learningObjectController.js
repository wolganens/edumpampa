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
const request = require('request');
/*
* Ordena um vetor de objetos com base em um campo do objeto
*/
const { sortDocsInArray } = require('../helpers/utils.js');

module.exports = {
  getCreateFirstStep(req, res) {
    const permission = ac.can(req.user.role).createOwn('learningObject');
    if (!permission.granted) {
      return res.status(403).send('Você não tem permissão!');
    }
    return res.render('learning-object/create-1', {title: 'Cadastrar OA'});
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
        title: 'Cadastrar OA',
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
        title: 'Cadastrar OA',
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
      norm_title: title.toLowerCase(),
    }
    const lo = new LearningObject(data);

    return lo.save((err) => {
      if (err) {
        console.log(err);
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

        let successMsg = req.user.role === 'ADMIN' ? ' aprovado ' : ' submetido para avaliação ';
        
        const mailOptions = {
          to: 'edumpampa@gmail.com',
          subject: 'Novo OA submetido para avaliação',
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
        loData.teaching_levels = req.body.teaching_levels || [];
        loData.axes = req.body.axes || [];
        loData.accessibility_resources = req.body.accessibility_resources || [];
        loData.content = req.body.content || [];
        loData.resources = req.body.resources || [];
        /*Desautoriza o objeto devido a sua atualização*/

        loData.approved = req.user.role === 'ADMIN' ? true : false;
        return loData.save((saveErr) => {
          if (saveErr) {
            req.session.error_message = saveErr;
            /*
            * Mantem o corpo do POST até a próxima requisição
            */
            req.flash('body', req.body);
          }
          req.session.success_message = 'Objeto atualizado com sucesso!';
          if (req.user.role !== 'ADMIN') {
            req.session.success_message += '<br/> <strong>Obs: O objeto será avaliado antes de sua publicação.</strong>';
          }
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
        Axes.find({}).sort('name').exec(callback);
      },
      teaching_levels(callback) {
        TeachingLevels.find({}).sort('name').exec(callback);
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
        return res.render('learning-object/details',
          {
            error: err,
            data: results,
            title: `${results.lo.title} - detalhes do objeto de aprendizagem` 
          }
        );
      });
  },
  postUploadFile(req, res) {
    const {cdnUrl, isImage, mimeType, name, size, uuid, _id} = req.body;    
    const file = {
      cdnUrl,
      isImage,
      mimeType,
      name,
      size,
      uuid,
    }    
    return LearningObject.findById(_id, function(err, lo) {
      if (err) {
        return res.send(err.error);
      }      
      lo.file = file;
      return lo.save(function(saveErr, result){
        if(saveErr) {
          return res.send(saveErr);
        }
        return res.status(200).send(file);
      });      
    })    
  },
  postRemoveFile(req, res) {
    const {_id} = req.body;
    console.log(process.env.UPLOADCARE_PUBLIC_KEY + ':' + process.env.UPLOADCARE_SECRET_KEY)
    return LearningObject.findByIdAndUpdate(_id, {file: null}, function(findErr, lo){
      if(findErr) {
        return res.send(findErr);
      }
      var options = {
        url: 'https://api.uploadcare.com/files/' + lo.file.uuid + '/storage/',
        headers: {
          'User-Agent': 'request',
          'Authorization': 'Uploadcare.Simple ' + process.env.UPLOADCARE_PUBLIC_KEY + ':' + process.env.UPLOADCARE_SECRET_KEY,
        },
        method: 'DELETE'
      };
       
      function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
          var info = JSON.parse(body);
          console.log(info.stargazers_count + " Stars");
          console.log(info.forks_count + " Forks");
        }
        return res.sendStatus(200);
      }
       
      return request(options, callback);

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
          $regex: new RegExp(searchText.replace(/\$|\.|\*|[|]/, '')),
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
        .equals(true)
      .sort('norm_title');
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
            title: 'Resultados da busca',
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
        .equals(true)
      .sort('norm_title');
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
            title: 'Resultados da busca'
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
        req.session.success_message = 'Objeto habilitado com sucesso!';
      } else {
        req.session.success_message = 'Objeto desabilitado com sucesso!';
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
        return res.render('learning-object/retrieve', { data: lo, title: 'Ver meus OA' });
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
        
        return new Downloads({
          user_id: req.user._id,
          learning_object_id: req.params.id,
        }).save(function(saveDownloadErr, result){
          if(saveDownloadErr) {
            return res.send(saveDownloadErr);
          }
          return res.redirect(lo.file.cdnUrl);
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
