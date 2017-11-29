const express = require('express');
const path = require('path');
// const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const fileUpload = require('express-fileupload');
const flash = require('connect-flash');
const mongoose = require('mongoose');

const index = require('./routes/index');
const auth = require('./routes/authentication');
const admin = require('./routes/admin');
const lo = require('./routes/learningobject');
const accounts = require('./routes/accounts');
const config = require('./config/index');
const configPassport = require('./config/passport');

const app = express();

// Set up mongoose connection
mongoose.Promise = global.Promise;

const mongoDB = process.env.MONGODB_URI || 'mongodb://edumpampa:unipampaedumpampa@ds129459.mlab.com:29459/edumpampa';


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
app.use(cookieParser());
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload({
  limits: { fileSize: 20 * 1024 * 1024 },
}));

app.use((req, res, next) => {
  // a simple object that holds resources for each request
  req.resources = req.resources || {};
  res.locals.app = config.app;
  res.locals.currentUser = req.user;
  res.locals.currentPath = req.url;
  res.locals.success_messages = req.flash('success_messages');
  res.locals.error_messages = req.flash('error_messages');
  [res.locals.inputs] = req.flash('inputs');
  [res.locals.inputErrors] = req.flash('inputErrors');
  // mock i18n funciton
  res.locals._t = function (value) { return value; };
  res.locals._s = function (obj) { return JSON.stringify(obj); };

  next();
});


app.use('/', index);
app.use('/account', accounts);
app.use('/auth', auth);

app.use('/admin', (req, res, next) => {
  if (!req.user || req.user.role != 'ADMIN') {
    req.flash('error_messages', 'Acesso exclusivo para administradores');
    return res.redirect('back');
  }
  next();
}, admin);

app.use('/learning-object', lo);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
