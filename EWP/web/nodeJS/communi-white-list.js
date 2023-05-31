'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('CommuniWhiteList');
const ipInt = require('ip-to-int');
var user_util = require('../service/util/user');
const IPCIDR = require("ip-cidr");
const moment = require('moment-timezone');
const loopback = require('../../server/server');
const crypto = require('../service/util/crypto');


module.exports = function(CommuniWhiteList) {
  CommuniWhiteList.beforeRemote('**', async function (ctx) {
    const roleId = parseInt((await loopback.models['account'].findById(ctx.req.accessToken.userId)).role);

    // admin 이 아닌 경우
    if (roleId !== 1) {
      const err = new Error();
      err.statusCode = 401;
      err.message = '권한 필수';
      err.code = 'AUTHORIZATION_REQUIRED';
      throw err;
    }
  });

  /* 페이징 및 필터처리로 인한 beforeremote 함수 추가 (22.06.21 태준) */
  CommuniWhiteList.beforeRemote('find', function (ctx, remoteMethodOutput, next) {
    let include = [];

    if (ctx.args.filter === undefined) {
      ctx.args.filter = {};
      ctx.args.filter.include = include;
    } else {
      ctx.args.filter.include = include;
    }
    console.log(ctx.args.filter);
    next();
  });

  CommuniWhiteList.afterRemote('find', function (ctx, remoteMethodOutput, next) {
    var where = "";
    if (ctx.args.filter !== undefined) {
      if (ctx.args.filter.where !== undefined) {
        where = ctx.args.filter.where;
      }
    }
    CommuniWhiteList.count(where, function (err, rec) {
      if (err) {
        next("QUERY ERR");
      } else {
        var result = {
          data : {
            total_cnt : rec,
            data : ctx.result.map(rs => {
              rs.srcIp = crypto.encrypt(rs.srcIp);
              rs.dstIp = crypto.encrypt(rs.dstIp);
              return rs;
            })
          }
        };
        ctx.result = result;
        next();
      }
    });
  });

  CommuniWhiteList.beforeRemote('create', (context, requestMethodOutput, next) =>{
    logger.info('before create');
    var dataSource = CommuniWhiteList.getDataSource().connector;
    user_util.getUserInfo(dataSource, context.args.options.accessToken.userId, function(err, userinfo) {

      context.args.data.fstUser = userinfo.username|| "";
      context.args.data.lstUser = userinfo.username|| "";
      context.args.data.lstDttm = moment.tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
      context.args.data.sanGubun = 1;
    });
    preProcessing(context, next);
  });

  CommuniWhiteList.beforeRemote('prototype.patchAttributes', (context, requestMethodOutput, next) =>{
    logger.info('before prototype.patchAttributes');
    preProcessing(context, next);
  });

  CommuniWhiteList.beforeRemote('replaceOrCreate', (context, requestMethodOutput, next) =>{
    logger.info('before CommuniWhiteList.replaceOrCreate');
    var dataSource = CommuniWhiteList.getDataSource().connector;
    user_util.getUserInfo(dataSource, context.args.options.accessToken.userId, function(err, userinfo) {
      "use strict";
      context.args.data.lstUser = userinfo.username|| "";
      context.args.data.lstDttm = moment.tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
      context.args.data.sanGubun = 1;
    });
    preProcessing(context, next);
  });

  CommuniWhiteList.remoteMethod(
    'updataCommuniWhiteList',
    {
      http: {path: '/updataCommuniWhiteList', verb: 'patch'},
      description: '통신기반 리스트 수정',
      accepts: [
        {arg: 'data', type: 'object', required: true},
        {arg: 'req', type: 'object', http: {source: 'req'}}
      ],
      returns: {arg: 'data'}
    }
  );

  CommuniWhiteList.updataCommuniWhiteList = (params, req) => new Promise(async (resolve, reject) => {
    const userInfo = await loopback.models['account'].findById(req.accessToken.userId);
    const now = moment.tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');

    // params.acquireDate = `${params.acquireDate.year}-${params.acquireDate.month}-${params.acquireDate.day}`;
    delete params.fstUser;
    delete params.fstDttm;
    params.lstDttm = now;
    params.lstUser = userInfo.username || '';
    params.sanGubun = 1;

    await CommuniWhiteList.update({id: params.id}, params).catch(e => {
      console.log(e);
      return reject(e)
    });

    resolve('UPDATE SUCCESS');
  });

  CommuniWhiteList.remoteMethod(
    'deleteMotieCommuniWhiteList',
    {
      http: {path: '/deleteMotieCommuniWhiteList', verb: 'patch'},
      description: '통신기반 리스트 삭제',
      accepts: [
        {arg: 'data', type: 'object', required: true},
        {arg: 'req', type: 'object', http: {source: 'req'}}
      ],
      returns: {arg: 'data'}
    }
  );

  CommuniWhiteList.deleteMotieCommuniWhiteList = (params, req) => new Promise(async (resolve, reject) => {
    const userInfo = await loopback.models['account'].findById(req.accessToken.userId);
    const now = moment.tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');

    // params.acquireDate = `${params.acquireDate.year}-${params.acquireDate.month}-${params.acquireDate.day}`;
    delete params.fstUser;
    delete params.fstDttm;
    params.lstDttm = now;
    params.state = 'D';
    params.lstUser = userInfo.username || '';
    params.sanGubun = 1;

    await CommuniWhiteList.update({id: params.id}, params).catch(e => {
      console.log(e);
      return reject(e)
    });
    resolve('UPDATE SUCCESS');
  });

  const preProcessing = (context, next) => {
    let data = context.args.data;

    next();
  };

};

