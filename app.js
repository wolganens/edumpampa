var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var index = require('./routes/index');
var auth = require('./routes/authentication');
var admin = require('./routes/admin')
var lo = require('./routes/learningobject');
var accounts = require('./routes/accounts');
var config = require('./config/index');
const fileUpload = require('express-fileupload');
global.__appRoot = __dirname;
var flash = require('connect-flash');


var app = express();

//Set up mongoose connection
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var mongoDB = process.env.MONGODB_URI || 'mongodb://edumpampa:unipampaedumpampa@ds129459.mlab.com:29459/edumpampa';


require('./config/passport').init(app);

mongoose.connect(mongoDB, {
  useMongoClient: true
});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload(
  {
    limits: { fileSize: 20 * 1024 * 1024 },
  }
));

app.use(function(req, res, next) {
    // a simple object that holds resources for each request
    req.resources = req.resources || {};
    res.locals.app = config.app;
    res.locals.currentUser = req.user;
    res.locals.currentPath = req.url;    
    res.locals.success_messages = req.flash('success_messages');
    res.locals.error_messages = req.flash('error_messages');    
    res.locals.inputs = req.flash('inputs')[0];
    res.locals.inputErrors = req.flash('inputErrors')[0];    
    // mock i18n funciton
    res.locals._t = function (value) { return value; };
    res.locals._s = function (obj) { return JSON.stringify(obj); };

    next();
  });



app.use('/', index);
app.use('/account', accounts);
app.use('/auth', auth);

app.use('/admin', function(req,res, next){
  if(!req.user || req.user.role != 'ADMIN') {
    req.flash("error_messages", "Acesso exclusivo para administradores");    
    return res.redirect("back");    
  } else {
    next();
  }
}, admin);

app.use('/learning-object', lo);

// catch 404 and forward to error handler
app.use(function(req, res, next) {  
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
