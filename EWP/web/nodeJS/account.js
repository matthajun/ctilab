var moment = require('moment');
var uuid = require('uuid');
var file_util = require('../service/util/file');
var user_util = require('../service/util/user');
const loopback = require('../../server/server');
var LoopBackContext = require('loopback-context');
const bcrypt = require('bcryptjs');
const date = require('date-and-time');
const async = require('async');
var log4js = require('log4js');
var logger = log4js.getLogger('account');
const _ = require("lodash");

const allowReadMethod = ['account.find', 'account.findById', 'account.logout'];
const allowWriteMethod = ['account.prototype.patchAttributes', 'account.changePassword', 'account.forceUpdate'];

module.exports = function (Account) {
  //Account.disableRemoteMethod("create", true);
  //Account.disableRemoteMethod("upsert", true);
  //Account.disableRemoteMethod("updateAll", true);
  //Account.disableRemoteMethod("createChangeStream", true);
  //Account.disableRemoteMethod("upsertById", true);
  //Account.disableRemoteMethod("deleteById", true);
  //Account.disableRemoteMethod("findById", true);
  //Account.disableRemoteMethod("findOne", true);
  //Account.disableRemoteMethod("exists", true);
  //Account.disableRemoteMethod("destroyAll", true);

  Account.beforeRemote('**', async function (ctx) {
    // 로그인 및 생성은 토큰 권한 확인 건너뜀
    if (ctx.req.accessToken == null && (ctx.methodString === 'account.login' || ctx.methodString === 'account.create')) {
      return ;
    }

    const roleId = parseInt((await Account.findById(ctx.req.accessToken.userId)).role);
    // admin 이 아닌 경우
    if ( roleId !== 1 ) {
      // 권한 없는 API 인 경우
      if ( !allowReadMethod.includes(ctx.methodString) && !allowWriteMethod.includes(ctx.methodString) ) {
        return new Promise((resolve, reject) => {
          reject('권한 필수');
        });
        /*
        const err = new Error();
        err.statusCode = 401;
        err.message = '권한 필수';
        err.code = 'AUTHORIZATION_REQUIRED';
        throw err;*/
      }

      const menu = loopback.models['menuv3'];
      const menu_data = JSON.parse((await menu.findById(1)).data);
      //const allowApiId = menu_data[4].children[2].children[2].api;
      const allowApiId = _.find(menu_data, j =>{
        return _.some(j.children, (c)=>{
          if(c.path_name.toString().includes('account_management')){
            return c.path_name.toString().includes('account_management') ;
          }
          return _.some(c.children, (lst)=>{
            return lst.path_name.toString().includes('account_management');
          })
        });
      }).api;
      // 수정시에는 본인이 맞는지 확인
      // 본인 아니라면 수정 권한이 있는지 확인.
      if (ctx.methodString === 'account.prototype.patchAttributes' && ctx.req.accessToken.userId != ctx.req.params.id) {
        return new Promise((resolve, reject) => {
          reject('권한 필수');
        });
        /*
        const err = new Error();
        err.statusCode = 401;
        err.message = '권한 필수';
        err.code = 'AUTHORIZATION_REQUIRED';
        throw err;*/
      } else if ( ctx.methodString === 'account.forceUpdate' && !allowApiId.includes(roleId) ) {
        return new Promise((resolve, reject) => {
          reject('권한 필수');
        });
        /*
        const err = new Error();
        err.statusCode = 401;
        err.message = '권한 필수';
        err.code = 'AUTHORIZATION_REQUIRED';
        throw err;*/
      }
    }
  });

  const allowRole = (data, roleId, result) => {
    data.forEach(board => {
      if (board.dashboard && board.role.includes(roleId)) {
        result.push(board.path_name);
      }
      allowRole(board.children, roleId, result);
    });
  };

  //UI 리턴포맷 맞춤
  Account.afterRemote('find', async function (ctx, remoteMethodOutput, next) {
    const roleId = parseInt((await loopback.models['account'].findById(ctx.req.accessToken.userId)).role);
    let {result = []} = ctx;

    if (roleId !== 1) {
      const menu = loopback.models['menuv3'];
      const menu_data = JSON.parse((await menu.findById(1)).data);
      //const allowRoleId = menu_data[4].children[2].children[2].role;
      const allowRoleId = _.find(menu_data, j =>{
        return _.some(j.children, (c)=>{
          return _.some(c.children, (lst)=>{
            //console.log(lst.path_name);
            return lst.path_name.toString().includes('account_management') ;
          })
        });
      }).role;
      result = (!allowRoleId.includes(roleId))? result.filter(account => account.id === ctx.req.accessToken.userId) : result;
    }

    ctx.result = {
      data: {
        total_cnt: result.length,
        data: result
      }
    }
  });

  // 사용자 생성시 기본 데이터 입력
  Account.beforeRemote('create', function (ctx, remoteMethodOutput, next) {
    var moment = require('moment');
    ctx.req.body.created = moment().format(); //생성시간 자동 입력
    ctx.req.body.email = uuid.v1() + '@ctilab.co.kr';
    ctx.req.body.status = ctx.req.body.status || 'inactive'; //활성화 사용자여부 처리
    next();
  });

  Account.afterRemote('create', function (ctx, remoteMethodOutput, next) {
    //사용자 생성시 사용권한에 따라 Role Mapping 정보를 입력한다.
    var loopback = require('../../server/server');
    var RoleMapping = loopback.models['RoleMapping'];
    var data = {
      principalType: 'USER',
      principalId: remoteMethodOutput.id,
      roleId: remoteMethodOutput.role === 'admin' ? 1 : 2
    };

    RoleMapping.create(data, function (err, res) {
      if (err) return next(err);
      global.slogger.addInfoLog(err, res);
      next();
    });
  });

  Account.beforeRemote('changePassword', function (context, remoteMethodOutput, next) {

    logger.info(' INFO :: beforeRemote changePassword');
    logger.info(context.req.accessToken);
    // console.log(context.req.accessToken.userId);

    let sql = `select password from account where id = ${context.req.accessToken.userId}`;

    let dataSource = Account.getDataSource().connector;
    dataSource.execute(sql, '', (err, current_pwd) => {
      if (err)
        next(err);
      else {
        current_pwd = current_pwd[0].password;
        //console.log(context.req.body.newPassword, current_pwd);
        bcrypt.compare(context.req.body.newPassword, current_pwd, function (err, isSamePWD) {
          if (err || isSamePWD) {
            let err = {status: 500, message: 'current pwd is same as new password'}
            context.res.status(500).send(err);
          }
          if (!isSamePWD) {
            next();
          }
        })

      }
    });


  });

  Account.afterRemote('changePassword', function (context, remoteMethodOutput, next) {

    logger.info(' INFO :: afterRemote changePassword');
    // console.log(context.req.accessToken);
    Account.find({"where": {"id": context.req.accessToken.userId}}, (err, res) => {
      if (err) {
        next(err);
      } else {
        // console.log(res[0]);
        ++res[0].pwdChgCnt;

        Account.replaceById(context.req.accessToken.userId, res[0], (err, res) => {
          if (err)
            next(err);
          else {
            console.log(res);
            next();
          }
        })

      }
    })

  });

  Account.beforeRemote('prototype.updateAttributes', function (ctx, remoteMethodOutput, next) {
    ctx.req.body.status = ctx.req.body.status || 'inactive'; //활성화 사용자여부 처리
    next();
  });

  Account.afterRemote('prototype.updateAttributes', function (ctx, remoteMethodOutput, next) {
    //사용자 수정시 사용권한에 따라 Role Mapping 정보를 수정한다.
    var dataSource = Account.getDataSource().connector;
    var sql = `insert into RoleMapping(principalType, principalId, roleId)
               values('USER', ${remoteMethodOutput.id}, ${remoteMethodOutput.role == 'admin' ? 1 : 2})
               on duplicate update roleId = ${remoteMethodOutput.role == 'admin' ? 1 : 2}
               `;

    dataSource.execute(sql, '', function (err, result) {
      if (err) global.slogger.addErrLog("Account.afterRemote", err);
      next();
    });
  });

  //로그인시 미사용 사용자 및 삭제 사용자는 로그인을 막는다.
  Account.beforeRemote('login', function (ctx, remoteMethodOutput, next) {
    var where = {
      where: {
        "and": [{
          "status": {
            "neq": "deleted"
          }
        }, {
          username: ctx.req.body.username
        }]
      }
    };
    Account.findOne(where, function (err, user) {
      if (err) return next(err);
      global.slogger.addInfoLog("----------------------------");
      global.slogger.addInfoLog(user);
      global.slogger.addInfoLog("----------------------------");
      if (user && user.status != 'active') {
        ctx.req.body.username = '';
        ctx.req.body.password = '';
        ctx.res.status(500).send({
          "error": {
            "statusCode": 400,
            "name": "Error",
            "message": "Account is inactive (관리자에게 문의하세요)",
            "code": "로그인 실패"
          }
        });
      }
      next();
    })
  });

  //최종 로그인일시 수정
  Account.afterRemote('login', function (ctx, remoteMethodOutput, next) {
    remoteMethodOutput.menuConfig = global.menuConfig;
    // console.log('id : ' + ctx.result.userId);
    Account.find({
      "where": {
        "id": ctx.result.userId
      }
    }).then((resolved) => {
      console.log(resolved);
      ctx.result.pwdChgCnt = resolved[0].pwdChgCnt;

      var where = {
        where: {
          "and": [{
            "status": {
              "neq": "deleted"
            }
          }, {
            username: ctx.req.body.username
          }]
        }
      };
      Account.findOne(where, function (err, inst) {
        if (err || !inst) return next();
        var updateObj = {
          "last_login": moment().format('YYYY-MM-DD HH:mm:ss')
        };
        inst.updateAttributes(updateObj, function (err, res) {
          // remoteMethodOutput.userInfo = res;
          // remoteMethodOutput.created = moment().add('9', 'h').format('YYYY-MM-DD HH:mm:ss');
          next();
        });
      })
    }).catch((reject) => {
      callback(null, reject);
    })

  });

  Account.afterRemoteError('login', function (ctx, next) {
    ctx.error.code = '로그인 실패';
    next();
  });

  Account.remoteMethod(
    'tokenExpireCheck', {
      http: {
        path: '/tokenExpireCheck',
        verb: 'get'
      },
      description: '토큰 Expire 체크하여 삭제 && 사용기간 지난 File 삭제',
      accepts: [{
        arg: "param",
        type: "string",
        description: "empty"
      }],
      returns: {
        arg: 'data'
      }
    }
  );
  Account.tokenExpireCheck = function (param, callback) {
    var loopback = require('../../server/server');
    var dataSource = Account.getDataSource().connector;
    var delete_sql = "delete from AccessToken where created < date_add(now(), interval - (ttl+60) second)";
    var sql = `
      select a.id, b.username from AccessToken a
      LEFT JOIN account b ON b.id = a.userId where a.created < date_add(now(), interval - (ttl+60) second)`;

    dataSource.execute(sql, '', function (err, result) {
      if (err) {
        return callback(err, null);
      } else {
        var i = 0;
        var cnt = 0;
        if (result.length == 0) {
          global.slogger.addInfoLog("Token Expire Lenth == 0");
          return callback(null, true);
        } else {
          for (i = 0; i < result.length; i++) {
            global.slogger.addInfoLog(result[i].username);
          }
          dataSource.execute(delete_sql, '', function (del_err, del_result) {
            if (del_err) {
              global.slogger.addErrLog("del_err", del_err);
            }
            global.slogger.addInfoLog("del_result : ", del_result);

            return callback(null, true);
          });
        }
      }
    });
  };

  Account.remoteMethod(
    'getUserId', {
      http: {
        path: '/getUserId',
        verb: 'get'
      },
      description: '현재 사용자 아이디 조회',
      accepts: [],
      returns: {
        arg: 'data'
      }
    }
  );
  Account.getUserId = function (callback) {
    callback(null, user_util.getUserId());
  };

  Account.remoteMethod(
    'getUserInfo', {
      http: {
        path: '/getUserInfo',
        verb: 'get'
      },
      description: '현재 사용자 정보 조회',
      accepts: [],
      returns: {
        arg: 'data'
      }
    }
  );
  Account.getUserInfo = function (callback) {
    callback(null, util.getUserInfo());
  };

  Account.autoLogout = function (cb) {
    var loopback = require('loopback');
    var ctx = loopback.getCurrentContext(); // Returns null if the access token is not valid
    if (!ctx) return cb('Not Logged In');
    var accessToken = ctx && ctx.get('accessToken');
    if (accessToken.id) {
      Account.logout(accessToken.id, function (err, rsp) {
        if (err) {
          global.slogger.addErrLog(err);
          return cb(err);
        }
        global.slogger.addInfoLog("RSP", rsp);
        return cb(null, "자동로그아웃 완료");
      });
    } else {
      return cb("Not Find Id");
    }

  };

  //자동 로그아웃
  Account.remoteMethod(
    'autoLogout', {
      description: '자동로그아웃',
      http: {
        verb: 'PUT',
        path: '/autoLogout'
      },
      returns: {
        arg: 'data'
      }
    }
  );

  Account.remoteMethod(
    'forceUpdate',
    {
      description: 'menu retreive by role_id/permission/access list',
      http: {path: '/forceUpdate', verb: 'put'},
      accepts: [
        {arg: 'user_data', type: 'object', required: true},
        // , http: {source: 'body'}
        {arg: 'req', type: 'object', http: {source: 'req'}}
        // {arg: 'data', type: 'object', http: {source: 'body'}}
      ],
      returns: {arg: 'data'}
    }
  );

  Account.beforeRemote('prototype.patchAttributes', (ctx, remoteMethodOutput, next) => {
    logger.info(`method prototype.patchAttributes`);

    getUserPWD(ctx.req.body, ctx.req).then(r => {
      let user_pwd = r[0].PASSWORD;
      comparePWD(ctx.req.body.password, user_pwd).then(same => {
        let err = {
          statusCode: 500,
          message: 'wrong password'
        };
        // err.statusCode = 500;
        // err.message = 'wrong password';
        same ? next() : ctx.res.status(500).send({error : err})
      })
    }).catch(e => {
      ctx.res.status(500).send(e);
    })
  });


  Account.forceUpdate = async (user_data, req) => {
    console.log(user_data);

    if (user_data.id == undefined || user_data.adminPassword == undefined) {
      return new Promise((resolve, reject) => {
        reject(`property 'id' and 'adminPassword' is required`)
      })
    }

    let isAdmin = await checkAdmin(user_data, req);

    if (isAdmin === true) {
      let usr_pwd = await getUserPWD(user_data, req);
      // console.log(usr_pwd[0].PASSWORD);
      // console.log(user_data.adminPassword);

      let compare_result = await comparePWD(user_data.adminPassword, usr_pwd[0].PASSWORD);
      if (compare_result !== true) {
        return new Promise((resolve, reject) => {
          reject('wrong password')
        })
      }

      let updateDone = await updateUser(user_data);
      return updateDone;

    } else {
      return new Promise((resolve, reject) => {
        reject('user is not admin');
      })
    }
  };

  const checkAdmin = async (user_data, req) => new Promise(async (resolve, reject) => {
    let account = await Account.find({"where": {"id": req.accessToken.userId}}).catch(err => {
      reject(err);
    });

    const menu = loopback.models['menuv3'];
    const menu_data = JSON.parse((await menu.findById(1)).data);
    //const allowApiId = menu_data[4].children[2].children[2].api;
    const allowApiId = _.find(menu_data, j =>{
      return _.some(j.children, (c)=>{
        if(c.path_name.toString().includes('account_management')){
          return c.path_name.toString().includes('account_management') ;
        }
        return _.some(c.children, (lst)=>{
          //console.log(lst.path_name);
          return lst.path_name.toString().includes('account_management') ;
        })
      });
    }).api;

    let result = account[0].role === 1 || allowApiId.includes(parseInt(account[0].role)) ? true : false;
    //let result = account[0].role == 1 ? true : false;

    resolve(result);
  });

  const getUserPWD = async (user_data, req) => new Promise(async (resolve, reject) => {
    logger.info(' INFO :: method : _forceUpdate');
    let user_info = user_data;
    let dataSource = Account.getDataSource().connector;
    let sql = `SELECT PASSWORD FROM account WHERE id = ${req.accessToken.userId}`;
    let queryResult = await executeQuery(dataSource, sql);
    resolve(queryResult);

  });

  const executeQuery = async (dataSource, sql) => new Promise((resolve, reject) => {
    dataSource.execute(sql, '', (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });

  const comparePWD = async (usr_pwd, adm_pwd) => new Promise((resolve, reject) => {
    bcrypt.compare(usr_pwd, adm_pwd, function (err, res) {
      if (err)
        reject(err);
      resolve(res);
    })
  });

  const updateUser = async (usr_data) => new Promise(async (resolve, reject) => {
    logger.info('method : updateUser');
    let dataSource = Account.getDataSource().connector;
    let salt = bcrypt.genSaltSync(10);

    let user_data = await Account.find({"where": {"id": usr_data.id}}).catch(err => {
      reject(err)
    });
    user_data = user_data[0];
    // console.log('user_data : ',  user_data);
    // console.log('usr_data : ', usr_data);

    const keys = Object.keys(usr_data);
    console.log(keys);

    let update_obj = {
      'id': usr_data.id,
      'email': ( usr_data.email !== null && usr_data.email !== undefined && usr_data.email.length !== 0) ? usr_data.email : user_data.email,
      'mail': (usr_data.mail !== null && usr_data.mail !== undefined && usr_data.mail.length !== 0) ? usr_data.mail : user_data.mail,
      'contact': ( usr_data.contact !== null && usr_data.contact !== undefined && usr_data.contact.length !== 0) ? usr_data.contact : user_data.contact,
      'password': ( usr_data.newPassword !== null && usr_data.newPassword !== undefined && usr_data.newPassword.length !== 0) ? bcrypt.hashSync(usr_data.newPassword, salt) : null ,
      'fullname': ( usr_data.fullname !== null && usr_data.fullname !== undefined && usr_data.fullname.length !== 0) ? usr_data.fullname: user_data.fullname,
      'mobile': ( usr_data.mobile !== null && usr_data.mobile !== undefined && usr_data.mobile.length !== 0) ? usr_data.mobile :user_data.mobile,
      "role": (usr_data.role !== null && usr_data.role !== undefined && usr_data.role.length !== 0) ? usr_data.role :user_data.role,
      'description':( usr_data.description !== null && usr_data.description !== undefined && usr_data.description.length !== 0) ? usr_data.description :  user_data.description,
      'realm': (usr_data.realm !== null && usr_data.realm !== undefined && usr_data.realm.length !== 0) ? usr_data.realm :user_data.realm,
      'username': ( usr_data.username !== null && usr_data.username !== undefined && usr_data.username.length !== 0) ? usr_data.username :user_data.username,
      'credentials': ( usr_data.credentials !== null && usr_data.credentials !== undefined  && usr_data.credentials.length !== 0) ? usr_data.credentials : user_data.credentials,
      'challenges': (usr_data.challenges !== null && usr_data.challenges !== undefined  && usr_data.challenges.length !== 0) ? usr_data.challenges : user_data.challenges,
      "emailVerified": ( usr_data.emailVerified !== null && usr_data.emailVerified !== undefined  && usr_data.emailVerified.length !== 0) ? usr_data.emailVerified : user_data.emailVerified,
      'status': ( usr_data.status !== null && usr_data.status !== undefined && usr_data.status.length !== 0) ?  usr_data.status : user_data.status,
      "lastUpdated": date.format(new Date(), 'YYYY/MM/DD HH:mm:ss'),
      "equipments": (usr_data.equipments !== null && usr_data.equipments !== undefined && usr_data.equipments.length !== 0) ? usr_data.equipments : null,
      'dept': ( usr_data.dept !== null && usr_data.dept !== undefined && usr_data.dept.length !== 0)? usr_data.dept : user_data.dept,
      'pwdChgCnt': ( usr_data.newPassword !== null && usr_data.newPassword !== undefined && usr_data.newPassword.length !== 0) ? 0: user_data.pwdChgCnt,
      'ipList' : JSON.stringify(usr_data.ipList)
    };

    console.log(update_obj['password']);
    Object.keys(update_obj).forEach((attr) => {
      if (update_obj[attr] == null || update_obj[attr] === undefined) {
        delete update_obj[attr];
      }
    });

    let update_sql = 'update account set ' + objTosqlUpdateValue(update_obj) + ' WHERE id = ' + user_data.id;
    let updateQueryDone = await executeQuery(dataSource, update_sql).catch(err => {
      reject(err)
    });

    resolve(updateQueryDone);
  });

  function objTosqlUpdateValue(obj) {
    "use strict";
    var keyArr = Object.keys(obj);
    var result = "";
    var value = "";
    for (var i = 0; i < keyArr.length; i++) {
      if (i > 0) {
        result += ",";
      }
      value = obj[keyArr[i]] + "".replace(/\'/g, '\\\'');
      result += keyArr[i] + "='" + value + "'";
    }
    return result;
  }

};

