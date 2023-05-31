'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
var mkdirp = require('mkdirp');
var app = module.exports = loopback();
var http = require('http');
var https = require('https');
var protocol = 'http';
var httpCall = require('../common/service/data/httpCall');
var clickhouse = require('../common/service/util/clickhouse');
app.start = function () {
  // start the web server

  global.slogger = require("../common/logger/serverLogger");
  global.esUrl = app.get('dtiConfig')["esUrl"];
  global.esAuth = app.get('dtiConfig')["esAuth"];
  global.esMergeMaxNumSegments = app.get('dtiConfig')["esMergeMaxNumSegments"];
  global.virusTotalUrl = app.get('dtiConfig')["virusTotalUrl"];
  global.virusTotalKey = app.get('dtiConfig')["virusTotalKey"];
  global.unusable_field_name = app.get('dtiConfig')["unusable_field_name"];
  global.stixReceiverUrl = app.get('dtiConfig')["stixReceiverUrl"];
  global.cifReceiverUrl = app.get('dtiConfig')["cifReceiverUrl"];
  global.yaraStoragePath = app.get('dtiConfig')["yaraStoragePath"];
  global.repStoragePath = app.get('dtiConfig')["repStoragePath"];
  global.fileStoragePath = app.get('dtiConfig')["fileStoragePath"];
  global.readerBackupPath = app.get('dtiConfig')["readerBackupPath"];
  global.mapStoragePath = app.get('dtiConfig')["mapStoragePath"];
  global.receiverUrl = app.get('dtiConfig')["receiverUrl"];
  global.web_redis = app.get('dtiConfig')["web_redis"];
  global.stix_redis = app.get('dtiConfig')["stix_redis"];
  global.cif_redis = app.get('dtiConfig')["cif_redis"];
  global.apiBackupPath = app.get('dtiConfig')["apiBackupPath"];
  global.esBackupPath = app.get('dtiConfig')["esBackupPath"];
  global.dbBackupPath = app.get('dtiConfig')["dbBackupPath"];
  global.ids2RuleParserExec = app.get('dtiConfig')["ids2RuleParserExec"];
  global.systemServiceUrl = app.get('dtiConfig')["systemServiceUrl"];
  global.nats_url = app.get('demo')['nats_url'];
  global.dbName = app.get('dtiConfig')["dbName"];
  global.focs = app.get('dtiConfig')["focs"];
  global.focsLoginUrl = focs.login_url;
  global.focsDeviceUrl = focs.device_url;
  global.focsUsername = focs.username;
  global.focsPassword = focs.password;
  global.policyCollectorUrl = app.get('dtiConfig')["policyCollectorUrl"];
  global.detectUrl = app.get('dtiConfig')["detectUrl"];
  global.tsharkApiUrl = app.get('dtiConfig')["tsharkApiUrl"];
  global.splunk = app.get('dtiConfig')["splunk"];
  global.clickhouse = app.get('dtiConfig')["clickhouse"];
  global.clickhouseRestApiUrl = global.clickhouse.RestApiUrl;
  global.clickhouseConfig = global.clickhouse.config;
  global.clickhouse_replicate = global.clickhouse.replicate;
  global.webFwUrl = app.get('dtiConfig')["webFwUrl"];
  global.intelligenceUrl = app.get('dtiConfig')["intelligenceUrl"];
  global.reportApiUrl = app.get('dtiConfig')["reportApiUrl"];
  global.backUpFileUrl = app.get('dtiConfig')["backUpFileUrl"];
  global.importUrl = app.get('dtiConfig')["importUrl"];
  global.health = app.get('dtiConfig')["health"];
  global.osintUrl = app.get('dtiConfig')["osintUrl"];
  global.easyUI = app.get('dtiConfig')["easyUI"];
  global.motie  = app.get('dtiConfig')["motie"];
  global.encryptionKey  = app.get('dtiConfig')["encryptionKey"];


  //메뉴 설정 관련
  global.menuConfig = app.get('menuConfig');
  /*mkdirp(global.esBackupPath,function(err) {
    if(err){
      console.log("ERROR MKDIR esBackupPath", err);
    }
  });*/

  mkdirp(global.dbBackupPath, function (err) {
    if (err) {
      console.log("ERROR MKDIR dbBackupPath", err);
    }
  });

  var server = null;

  if (protocol === 'https') {
    var sslConfig = require('./ssl-config');
    var options = {
      key: sslConfig.privateKey,
      cert: sslConfig.certificate
    };
    server = https.createServer(options, app);
  } else {
    server = http.createServer(app);
  }

  server.listen(app.get('port'), function () {
    var baseUrl = protocol + '://' + app.get('host') + ':' + app.get('port');

    global.slogger.addInfoLog("INIT", "Web server listening at: " + baseUrl);

    app.emit('started', baseUrl);
    console.log('Loop Back server listening @ %s%s', baseUrl, '/');
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      global.slogger.addInfoLog("INIT", "Browse your REST API at " + baseUrl, explorerPath);
    }
  });

  if (require.main === module) {
    // 서버를 처음 시작할때 DTI SYSTEM 이벤트소스를 연결한다.
    // var DtiSystem = app.models['DtiSystem'];
    // DtiSystem.getSystem("", (err, res) => {
    //   if (err) {
    //     global.slogger.addErrLog("DTI SYSTEM INIT ERROR : ", err);
    //   } else {
    //     global.slogger.addInfoLog("SUCCESS DTI SYSTEM INIT");
    //   }
    // });
  }

  return server;
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
  var user = require('../common/service/util/user');

  var Init_clickhouse = require('./init/clickhouse_init');
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module) {
    // socket.io 추가.
    app.io = require('socket.io')(app.start());
    app.sockets = [];

    app.models.SharedRoom.initEventStream();
    app.models.SharedComment.initEventStream();
    app.models.alarmEv.initEventStream();

    // namespace 추가.
    // app.io.alarmEv = app.io.of('/api/alarmEv/websocket');
    // app.io.shared = app.io.of('/api/shared/websocket');

    // socket.io 인증.
    require('socketio-auth')(app.io, {
      "authenticate": function (socket, value, callback) {
        if (value.access_token === undefined) {
          return callback(null, false);
        }
        console.log('request auth', socket.id);
        var AccessToken = app.models.AccessToken;
        //get credentials sent by the client
        AccessToken.find({"where": {"id": value.access_token}}, function (err, tokenDetail) {
          if (err) return callback(err);
          if (tokenDetail.length) {
            callback(null, true);
          } else {
            callback(null, false);
          }
        }); //find function..
      }, //authenticate function..
      "postAuthenticate": function (socket, data) {
        // find user_id
        var AccessToken = app.models.AccessToken;
        AccessToken.findById(data.access_token, (err, res) => {
          if (err) {
            slogger.addErrLog("AccessToken is Not in Database : ", err);
          } else {
            app.sockets.push({"socket": socket, "access_token": data.access_token, "userId": res.userId});
            console.log('added socket', app.sockets.map(socket => socket.socket.id));
          }
        });
      },
      "disconnect": function (disconnect_socket) {
        // app.sockets = app.sockets.filter((socket) => socket.id !== disconnect_socket.id);
        app.sockets = app.sockets.filter((socket) => socket.socket.id !== disconnect_socket.id);
      }
    });
  }
  else {
    app.start();
    return ;
  }

  var logFieldInfo = app.models['logFieldInfo'];
  var dataSource = logFieldInfo.getDataSource().connector;
  var data = {};
  var sql = "SELECT name, type FROM dti.log_field_info union all select name, type from dti.add_log_field_info";
  dataSource.execute(sql, '', function (err, result) {
    result.map(function (obj) {
      data[obj.name] = obj.type;
    });
    global.all_log_field = data;
  });

  var config = clickhouse.url_config();
  for (var i = 0; i < global.clickhouseRestApiUrl.length; i++) {
    var host = global.clickhouseRestApiUrl[i];
    !function run(host) {
      httpCall.ClickHouse('POST', host + '/?' + config, "CREATE DATABASE IF NOT EXISTS dti", function (err, result) {
        if (err) {
          global.slogger.addErrLog("ERR", err + " dti ERROR CH CHECK");
          //process.exit(1);
        } else {
          global.slogger.addInfoLog("[" + host + "]SUCCESS CH CREATE dti DATABASE" + result);
          httpCall.ClickHouse('POST', host + '/?' + config, "CREATE DATABASE IF NOT EXISTS dti_re", function (err, result) {
            if (err) {
              global.slogger.addErrLog("ERR", err + " dti_re ERROR CH CHECK");
            } else {
              global.slogger.addInfoLog("[" + host + "]SUCCESS CH CREATE dti_re DATABASE" + result);
            }
          });
        }
      });
    }(host)
  }
  var logDataset = app.models['LogDataset'];
  Init_clickhouse.createTable(config, httpCall);
  Init_clickhouse.createInitTable(logDataset, (err, res) =>{
    if(!err){
      Init_clickhouse.checkMysqlRep(config, httpCall,logDataset);
    }
  });

  const motieCmnCode = app.models['MotieCmnCode'];
  motieCmnCode.find().then((result) => global.motieCmnCodeList = result);

  const motiePwrinfo = app.models['MotiePwrinfo'];
  motiePwrinfo.find().then((result) => global.motiePwrinfoList = result);


  if (global.health.useYn === "ON") {
    var System = app.models['System'];
    setInterval(function () {
      System.checkStatus()
    }, global.health.interval * 1000);
  }
});
