const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const session = require('express-session');
const bodyParser = require('body-parser');
const winston = require('./config/winston')(module);
const { sequelize } = require('./models');

const app = express();
app.set('port', process.env.PORT || 8002);

const HighRank_corr1 = require('./ai/HighRank_corr1');
const HighRank_log = require('./ai/HighRank_log');
const HighRank_packet = require('./ai/HighRank_packet');
const HighRank_op2 = require('./ai/HighRank_op2');

// 21.11부로 사용하지 않는 기능
// const HighRank = require('./HighRank');
//
// const HighRank_Policy = require('./policy/HighRank_policy_update');
// const HighRank_communi = require('./policy/HighRank_communi_update');
// const HighRank_log_update = require('./policy/HighRank_log_update');
// const HighRank_asset = require('./policy/HighRank_asset_update');
// const HighRank_asset_ip = require('./policy/HighRank_asset_ip_update');
//
// const singleRule = require('./policy/HighRank_Rulesingle_update');
// const multiRule = require('./policy/HighRank_Rulemulti_update');
// const mapRule = require('./policy/HighRank_Rulemap_update');
// const fileTrans = require('./fileTrans');
// const H009Trans = require('./policy/H009_transport');

const api = require('./routes/api');

const makejson = require('./utils/makejson');
const Delete_table = require('./policy/Delete_schedul_table');
const Free_transmission = require('./schedule/Free_transmission');

const http = require('http');
const https = require('https');

app.set('port', process.env.PORT);

sequelize.sync({ force: false })
    .then(() => {
        winston.info('success db connect (ver. 22 03 30) ');
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

app.use(morgan( process.env.NODE_ENV !== 'production'?'dev':'combined',{stream:winston.httpLogStream}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use('/api', api);

app.use(function(req, res, next) {
    next(createError(404));
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

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
    res.status(err.status || 500);
    winston.error(err.stack);
    res.json(makejson.makeResData(err,req))
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



app.use((req, res, next) => {
    const error =  new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    next(error);
});

app.set('etag', false);

//클릭하우스 AI 결과테이블 상위연계(22.03.14)
HighRank_corr1.searchAndtransm();
HighRank_log.searchAndtransm();
HighRank_packet.searchAndtransm();
HighRank_op2.searchAndtransm();

//자산, 룰, 정책 생성(Create)상위연계
//HighRank.searchAndtransm();

//HighRank_Policy.searchAndtransm();  //부문전송금지(11.02)
//HighRank_communi.searchAndtransm();  //부문전송금지(11.02)
//HighRank_log_update.searchAndtransm();  //부문전송금지(11.02)
//HighRank_asset.searchAndtransm();  //부문전송금지(11.02)
//HighRank_asset_ip.searchAndtransm();  //부문전송금지(11.02)

//singleRule.searchAndtransm();  //부문전송금지(11.02)
//multiRule.searchAndtransm();  //부문전송금지(11.02)
//mapRule.searchAndtransm();  //부문전송금지(11.02)

//fileTrans.searchAndTrans(); //(8월20일, 부문태그 추가하여 수정완료)

//H009Trans.searchAndtransm(); //8월19일 추가 (H008->H009)
Delete_table.scheduleDelete(); //10월29일 추가 (수집테이블 정리)

Free_transmission.searchAndtransm(); //3월25일 추가 (임의 재전송)
