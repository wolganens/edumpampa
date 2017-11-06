#! /usr/bin/env node

console.log('This script populates a some test books, authors, genres and bookinstances to your database. Specified database as argument - e.g.: populatedb mongodb://your_username:your_password@your_dabase_url');

//Get arguments passed on command line
var userArgs = process.argv.slice(2);


var async = require('async')
var AccessibilityResources = require('./models/accessibilityresources')
var Axes = require('./models/axes')
var TeachingLevels = require('./models/teachinglevels')
var Resources = require('./models/resources')
var Contents = require('./models/contents')
var Licenses = require('./models/licenses')
var Qualification = require('./models/qualifications');
var OccupationArea = require('./models/occupation_area')
var InstitutionalLink = require("./models/institutional_link")
var InstitutionalPost = require("./models/institutional_post")

var mongoose = require('mongoose');
var mongoDB = userArgs[0];
mongoose.connect('mongodb://127.0.0.1:27017/edumpampa');
var db = mongoose.connection;
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

var aresources = []
var axes = []
var teachlevels = []
var contents = []
var resources = []
var licenses = []
var qualifications = []
var occupation_areas = []
var institutional_links = []
var institutional_posts = []

function aresourcesCreate(name, cb) {
  aresdetail = {name: name}
  var ares = new AccessibilityResources(aresdetail);
  ares.save(function (err) {
    if (err) {
      cb(err, null)
      return
    }
    console.log('New access resource: ' + ares);
    aresources.push(ares)
    cb(null, ares)
  }  );
}
function qualificationsCreate(name, cb) {
  aresdetail = {name: name}
  var ares = new Qualification(aresdetail);
  ares.save(function (err) {
    if (err) {
      cb(err, null)
      return
    }
    console.log('New access resource: ' + ares);
    qualifications.push(ares)
    cb(null, ares)
  }  );
}
function institutionalPostsCreate(name, cb) {
  aresdetail = {name: name}
  var ares = new InstitutionalPost(aresdetail);
  ares.save(function (err) {
    if (err) {
      cb(err, null)
      return
    }
    console.log('New access resource: ' + ares);
    institutional_posts.push(ares)
    cb(null, ares)
  }  );
}
function contentsCreate(name, cb) {
  aresdetail = {name: name}
  var ares = new Contents(aresdetail);
  ares.save(function (err) {
    if (err) {
      cb(err, null)
      return
    }
    console.log('New access resource: ' + ares);
    contents.push(ares)
    cb(null, ares)
  }  );
}
function resourcesCreate(name, cb) {
  aresdetail = {name: name}
  var ares = new Resources(aresdetail);
  ares.save(function (err) {
    if (err) {
      cb(err, null)
      return
    }
    console.log('New access resource: ' + ares);
    resources.push(ares)
    cb(null, ares)
  }  );
}
function occupationAreaCreate(name, cb) {
  aresdetail = {name: name}
  
  var ares = new OccupationArea(aresdetail);
       
  ares.save(function (err) {
    if (err) {
      cb(err, null)
      return
    }
    console.log('New access resource: ' + ares);
    occupation_areas.push(ares)
    cb(null, ares)
  }  );
}
function axesCreate(name, cb) {
  aresdetail = {name: name}
  
  var ares = new Axes(aresdetail);
       
  ares.save(function (err) {
    if (err) {
      cb(err, null)
      return
    }
    console.log('New access resource: ' + ares);
    axes.push(ares)
    cb(null, ares)
  }  );
}
function institutionalLinkCreate(name, cb) {
  aresdetail = {name: name}
  
  var ares = new InstitutionalLink(aresdetail);
       
  ares.save(function (err) {
    if (err) {
      cb(err, null)
      return
    }
    console.log('New access resource: ' + ares);
    institutional_links.push(ares)
    cb(null, ares)
  }  );
}
function licensesCreate(name, deed, legal, description, image, cb) {
  aresdetail = {
    name: name,
    deed: deed,
    legal: legal,
    description: description,
    image: image
  }
  
  var ares = new Licenses(aresdetail);
       
  ares.save(function (err) {
    if (err) {
      cb(err, null)
      return
    }
    console.log('New access resource: ' + ares);
    licenses.push(ares)
    cb(null, ares)
  }  );
}
function teachinglevelCreate(name, cb) {
  aresdetail = {name: name}
  
  var ares = new TeachingLevels(aresdetail);
       
  ares.save(function (err) {
    if (err) {
      cb(err, null)
      return
    }
    console.log('New access resource: ' + ares);
    teachlevels.push(ares)
    cb(null, ares)
  }  );
}

function createAresources(cb) {
    async.parallel([
        function(callback) {
          aresourcesCreate('Apontadores' , callback);
        },
        function(callback) {
          aresourcesCreate("Comando de voz", callback);
        },
        function(callback) {
          aresourcesCreate("Recursos visuais", callback);
        },
        function(callback) {
          aresourcesCreate("Recursos sonoros", callback);
        },
        function(callback) {
          aresourcesCreate("Recursos táteis", callback);
        },
        function(callback) {
          aresourcesCreate('Teclados', callback);
        },
        function(callback) {
          aresourcesCreate('Outros', callback)
        }
        ],
        // optional callback
        cb);
}
function createContents(cb) {
    async.parallel([
        function(callback) {
          contentsCreate('Instrumentos musicais' , callback);
        },
        function(callback) {
          contentsCreate("Objetos sonoros", callback);
        },
        function(callback) {
          contentsCreate("Ritmo", callback);
        },
        function(callback) {
          contentsCreate("Melodia", callback);
        },
        function(callback) {
          contentsCreate("Altura", callback);
        },
        function(callback) {
          contentsCreate(' Duração', callback);
        },
        function(callback) {
          contentsCreate('  Timbre', callback);
        },
        function(callback) {
          contentsCreate('Notação tradicional', callback);
        },
        function(callback) {
          contentsCreate('Grafia analógica', callback);
        },
        function(callback) {
          contentsCreate('Canto', callback)
        },
        function(callback) {
          contentsCreate('Estilos musicais', callback);
        },
        function(callback) {
          contentsCreate('Expressão corporal', callback);
        },        
        ],
        // optional callback
        cb);
}
function createResources(cb) {
    async.parallel([
        function(callback) {
          resourcesCreate('Corporal' , callback);
        },
        function(callback) {
          resourcesCreate('Vocal' , callback);
        },
        function(callback) {
          resourcesCreate('Instrumental' , callback);
        },
        function(callback) {
          resourcesCreate('Auditivo' , callback);
        }        
        ],
        // optional callback
        cb);
}
function createInstitutionalPost(cb) {
    async.parallel([
        function(callback) {
          institutionalPostsCreate('Aluno(a)' , callback);
        },
        function(callback) {
          institutionalPostsCreate('Estagiário(a)' , callback);
        },
        function(callback) {
          institutionalPostsCreate('Professor(a)' , callback);
        },
        function(callback) {
          institutionalPostsCreate('Orientador(a)' , callback);
        },
        function(callback) {
          institutionalPostsCreate('Supervisor(a)' , callback);
        },
        function(callback) {
          institutionalPostsCreate('Diretor(a)' , callback);
        },
        function(callback) {
          institutionalPostsCreate('Coordenador(a)' , callback);
        },        
        ],
        // optional callback
        cb);
}
function createOccupationArea(cb) {
    async.parallel([
        function(callback) {
          occupationAreaCreate('Educação Musical' , callback);
        },
        function(callback) {
          occupationAreaCreate('Educação Artística' , callback);
        },
      ],
        // optional callback
        cb);
}
function createQualifications(cb) {
    async.parallel([
        function(callback) {
          qualificationsCreate('Ensino Fundamental' , callback);
        },
        function(callback) {
          qualificationsCreate('Ensino Médio' , callback);
        },
        function(callback) {
          qualificationsCreate('Magistério' , callback);
        },
        function(callback) {
          qualificationsCreate('Graduação' , callback);
        },
        function(callback) {
          qualificationsCreate('Especialização' , callback);
        },
        function(callback) {
          qualificationsCreate('Mestrado' , callback);
        },
        function(callback) {
          qualificationsCreate('Doutorado' , callback);
        },        
        ],
        // optional callback
        cb);
}
function createLicenses(cb) {
    async.parallel([
        function(callback) {
          licensesCreate('Atribuição CC BY', 'https://creativecommons.org/licenses/by/4.0', 'https://creativecommons.org/licenses/by/4.0/legalcode', 'Esta licença permite que outros distribuam, remixem, adaptem e criem a partir do seu trabalho, mesmo para fins comerciais, desde que lhe atribuam o devido crédito pela criação original. É a licença mais flexível de todas as licenças disponíveis. É recomendada para maximizar a disseminação e uso dos materiais licenciados.','/images/licenses/by.jpg', callback);
        },
        function(callback) {
          licensesCreate('Atribuição-CompartilhaIgual CC BY-SA', 'https://creativecommons.org/licenses/by-sa/4.0', 'https://creativecommons.org/licenses/by-sa/4.0/legalcode', 'Esta licença permite que outros remixem, adaptem e criem a partir do seu trabalho, mesmo para fins comerciais, desde que lhe atribuam o devido crédito e que licenciem as novas criações sob termos idênticos. Esta licença costuma ser comparada com as licenças de software livre e de código aberto "copyleft". Todos os trabalhos novos baseados no seu terão a mesma licença, portanto quaisquer trabalhos derivados também permitirão o uso comercial. Esta é a licença usada pela Wikipédia e é recomendada para materiais que seriam beneficiados com a incorporação de conteúdos da Wikipédia e de outros projetos com licenciamento semelhante.','/images/licenses/by-sa.jpg', callback);
        },
        function(callback) {
          licensesCreate('Atribuição-SemDerivações CC BY-ND', 'https://creativecommons.org/licenses/by-nd/4.0', 'https://creativecommons.org/licenses/by-nd/4.0/legalcode', 'Esta licença permite a redistribuição, comercial e não comercial, desde que o trabalho seja distribuído inalterado e no seu todo, com crédito atribuído a você.','/images/licenses/by-nd.jpg', callback);
        },
        function(callback) {
          licensesCreate('Atribuição-NãoComercial CC BY-NC', 'https://creativecommons.org/licenses/by-nc/4.0', 'https://creativecommons.org/licenses/by-nc/4.0/legalcode', 'Esta licença permite que outros remixem, adaptem e criem a partir do seu trabalho para fins não comerciais, e embora os novos trabalhos tenham de lhe atribuir o devido crédito e não possam ser usados para fins comerciais, os usuários não têm de licenciar esses trabalhos derivados sob os mesmos termos.','/images/licenses/by-nc.jpg', callback);
        },
        function(callback) {
          licensesCreate('Atribuição-NãoComercial-CompartilhaIgual CC BY-NC-SA', 'https://creativecommons.org/licenses/by-nc-sa/4.0', 'https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode', 'Esta licença permite que outros remixem, adaptem e criem a partir do seu trabalho para fins não comerciais, desde que atribuam a você o devido crédito e que licenciem as novas criações sob termos idênticos.','/images/licenses/by-nc-sa.jpg', callback);
        },
        function(callback) {
          licensesCreate('Atribuição-SemDerivações-SemDerivados CC BY-NC-ND', 'https://creativecommons.org/licenses/by-nc-nd/4.0', 'https://creativecommons.org/licenses/by-nc-nd/4.0/legalcode', 'Esta é a mais restritiva das nossas seis licenças principais, só permitindo que outros façam download dos seus trabalhos e os compartilhem desde que atribuam crédito a você, mas sem que possam alterá-los de nenhuma forma ou utilizá-los para fins comerciais.','/images/licenses/by-nc-sa.jpg', callback);
        },     
        ],
        // optional callback
        cb);
}
function createachinglevels(cb) {
    async.parallel([
        function(callback) {
          teachinglevelCreate('Educação Infantil' , callback);
        },
        function(callback) {
          teachinglevelCreate("Ensino Fundamental - anos iniciais", callback);
        },
        function(callback) {
          teachinglevelCreate("Ensino Fundamental - anos finais", callback);
        },
        function(callback) {
          teachinglevelCreate("Ensino Médio", callback);
        }
        ],
        // optional callback
        cb);
}

function createAxes(cb) {
    async.parallel([
        function(callback) {
          axesCreate('Apreciação' , callback);
        },
        function(callback) {
          axesCreate("Interpretação", callback);
        },
        function(callback) {
          axesCreate("Criação", callback);
        }        
        ],
        // optional callback
        cb);
}

function createInstitutionalLink(cb) {
    async.parallel([
        function(callback) {
          institutionalLinkCreate('Educação Básica da Rede Pública' , callback);
        },
        function(callback) {
          institutionalLinkCreate("Educação Básica da Rede Privada", callback);
        },
        function(callback) {
          institutionalLinkCreate("Ensino Superior Público", callback);
        },
        function(callback) {
          institutionalLinkCreate("Ensino Superior Privado", callback);
        }
        ],
        // optional callback
        cb);
}

async.series([
    createachinglevels,
    createAresources,
    createContents,
    createResources,
    createLicenses,
    createQualifications,
    createOccupationArea,
    createInstitutionalLink,
    createInstitutionalPost
],
// optional callback
function(err, results) {
    if (err) {
        console.log('FINAL ERR: '+err);
    }
    else {
        console.log('BOOKInstances: '+results);
        
    }
    //All done, disconnect from database
    mongoose.connection.close();
});




