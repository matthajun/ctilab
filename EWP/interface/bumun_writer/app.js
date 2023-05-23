const createError = require('http-errors');
const dotenv = require('dotenv'); dotenv.config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');

const api = require('./routes/api');

const winston = require('./config/winston')(module);

const app = express();
const { sequelize } = require('./models');
const makejson = require('./utils/makejson');

// const HighRank_policy = require('./policy/HighRank_policy_update');
// const HighRank_communi = require('./policy/HighRank_communi_update');
// const HighRank_signature = require('./policy/HighRank_signature');
// const HighRank_log = require('./policy/HighRank_log');
// const HighRank_DataReq = require('./policy/HighRank_dataRequest');

const http = require('http');
const https = require('https');

const check_aiData = require('./policy/Check_AiData');

app.set('port', process.env.PORT);

app.use(logger(process.env.NODE_ENV !== 'production'?'dev':'combined',{stream:winston.httpLogStream}));

//json 수신 용량 확장 설정 (22.3.14) 1000으로 다시변경(22.3.30)
app.use(express.json({
  limit : '1000mb'
}));
app.use(express.urlencoded({
  limit : '1000mb',
  extended: false
}));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', api);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Other settings
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(function (req, res, next) { // 1
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'content-type');
  next();
});

app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false,
  },

}));
sequelize.sync({ force: false })
    .then(() => {
      winston.info('success db connect (ver. 22 04 27) ');
    })
    .catch((err) => {
      winston.error(err.stack);
    });

var protocol = 'https';

if (protocol === 'https') {
  var sslConfig = require('./config/ssl-config');
  var options = {
    key: sslConfig.privateKey,
    cert: sslConfig.certificate
  };
  server = https.createServer(options, app).listen(process.env.PORT);
} else {
  server = http.createServer(app);
}

app.use((req, res, next) => {
  const error =  new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);
  winston.error(err.stack);
  res.json(makejson.makeResData(err,req))
});

app.set('etag', false);

//보안정책관련 기능 사용 중지,  21.11부터

//HighRank_policy.searchAndtransm();
//HighRank_communi.searchAndtransm();
//HighRank_signature.searchAndtransm();
//HighRank_log.searchAndtransm();
//HighRank_DataReq.searchAndtransm();

check_aiData.searchAndRun();
