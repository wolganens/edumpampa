require('dotenv').load();
const config = require('./config/index');
const configPassport = require('./config/passport');
const accounts = require('./routes/accounts');
const admin = require('./routes/admin');
const auth = require('./routes/authentication');
const index = require('./routes/index');
const lo = require('./routes/learningobject');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const express = require('express');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const mongoose = require('mongoose');
const logger = require('morgan');
const passport = require('passport');
const path = require('path');
const cookieParser = require('cookie-parser')
// const favicon = require('serve-favicon');


const app = express();


// Set up mongoose connection
mongoose.Promise = global.Promise;

const mongoDB = process.env.MONGODB_URI;


configPassport(app);

mongoose.connect(mongoDB, {
  useMongoClient: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({ secret: '5cb1aeca94a165b0f5543cd3d6c4acc8a1d4388fa2ead70bd190f86ce943a180c42292e2fc0be8a149c0aeaf484e6bb6238217ad5ef5ad6b51556db1e75fbe3c', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload({
  limits: { fileSize: 20 * 1024 * 1024 },
}));

app.use((req, res, next) => {
  /*
  * Se for um campo multivalorado, garante que o valor seja um array.
  * Além disso, remove os colchetes
  */
  Object.keys(req.body).forEach((field) => {
    const indexArrayChar = field.indexOf('[');
    if (indexArrayChar !== -1) {
      if (!Array.isArray(req.body[field])) {
        req.body[field.substr(0, indexArrayChar)] = [req.body[field]];
      } else {
        req.body[field.substr(0, indexArrayChar)] = req.body[field];
      }
      delete req.body[field];
    }
  });
  next();
});
app.use((req, res, next) => {
  /*
  * Mapa para manter os valores dos campos get e post
  */
  res.locals.old = new Map();
  /*
  * Cria uma entrada no mapa para cada parametro get e post
  */
  const queryBody = Object.assign({}, req.flash('body')[0], req.query);
  Object.keys(queryBody).forEach((key) => {
    res.locals.old.set(key, queryBody[key]);
  });  
  /*
  * Esta função é utilizada nas views para retornar valores da requisição
  * (ex: campos de formulários)Se o campo procurado não existir, pode ser
  * especificado um valor padrão a ser retornado
  */
  res.locals.oldInput = (field, dflt) => {
    if (res.locals.old.has(field)) {
      return res.locals.old.get(field);
    }
    return dflt || null;
  };
  /*
  * O campo errors dentro de locals serve para exibir os erros em views,
  * por exemplo: erros de validação de campos
  */
  res.locals.errors = req.session.errors || [];
  /*
  * Mensagens de sucesso exibidas no topo do layout
  */
  res.locals.success_message = req.session.success_message || null;
  res.locals.error_message = req.session.error_message || null;
  delete req.session.errors;
  delete req.session.success_message;
  delete req.session.error_message;
  res.locals.app = config.app;
  /*
  * currentUser é utilizada para exibir dados do usuário autenticado no sistema,
  * por exemplo: nome do usuário na barra principal
  */
  res.locals.currentUser = req.user;
  console.log(req.cookies);
  res.locals.highContrast = req.cookies.contrast;
  /*
  * Url atual da aplicação para utilizar na paginação de consultas e destacar
  * abas (bootstrap tabs) ativas
  */
  res.locals.currentPath = req.url;
  next();
});
app.use('/', index);
app.use('/account', accounts);
app.use('/auth', auth);
app.use('/admin', admin);
app.use('/learning-object', lo);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
