const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const morgan = require('morgan');
const session = require('express-session');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const makejson = require('./utils/makejson');
const winston = require('./config/winston')(module);
dotenv.config();
const api = require('./routes/api');
const { sequelize } = require('./models');
const passportConfig = require('./passport');

const app = express();
passportConfig();
app.set('port', process.env.PORT || 8002);

const L001 = require('./schedule/L001_schedule');
const L002 = require('./schedule/L002_req');
const L003 = require('./schedule/L003_schedule');
const L004 = require('./schedule/L004_schedule');
const L005 = require('./schedule/L005_schedule');
const L006 = require('./schedule/L006_schedule');
const L007 = require('./schedule/L007_schedule');
const L008 = require('./schedule/L008_schedule');

const L010 = require('./schedule/L010_schedule');

const L012 = require('./schedule/L012_schedule');
const L013 = require('./schedule/L013_schedule');
const L014 = require('./schedule/L014_schedule');
const L018 = require('./schedule/L018_schedule');
const L019 = require('./schedule/L019_schedule');

const HighRank = require('./service/HighRank');

const stix_log = require('./STIX_service/stixInsert_logevent');
const http = require('http');
const https = require('https');
const L009_FAIL = require('./service/L009_FAIL');

const L005_transation = require('./schedule/L005_Transaction_schedule');

const Delete_schedule = require('./schedule/Delete_schedule');

//app.set('view engine', 'html');

sequelize.sync({ force: false })
    .then(() => {
        winston.info('success db connect  (version. 22.10.5)');
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
    server = https.createServer(options, app).listen(process.env.SSL_PORT);
} else {
    server = http.createServer(app);
}

app.use(morgan( process.env.NODE_ENV !== 'production'?'dev':'combined',{stream:winston.httpLogStream}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
}));
app.use(passport.initialize());
app.use(passport.session());

// Other settings
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(function (req, res, next) { // 1
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'content-type');
    next();
});

app.use('/api', api);

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
    if(err.port === 8125 && err.address === (process.env.CH_ADDRESS2).replace('http://','')){
        winston.error('****************** 부문 시스템과의 연결이 끊겼습니다. ******************');
        L009_FAIL.parseAndInsert(req, req.body.header.message_id);
    }
    res.json(makejson.makeResData(err,req))
});

app.set('etag', false);

L001.scheduleInsert();
//L002.scheduleInsert();
L003.scheduleInsert();
L004.scheduleInsert();
L005.scheduleInsert(); //L013요청으로 대체, L005로 다시 대체(210719), 오류로그관련 수정(211206)
L006.scheduleInsert();
L007.scheduleInsert();
L008.scheduleInsert();

L010.scheduleInsert();

//L012.scheduleInsert();
//L013.scheduleInsert();  //L005요청으로 대체
L014.scheduleInsert();

L018.scheduleInsert();
L019.scheduleInsert();

HighRank.searchAndtransm();

//stix_log.searchAndInsert(); //부문 STIX-maker로 대체

//L005_transation.scheduleInsert(); //8월22일 개발, L005트랜잭션

Delete_schedule.Delete();
