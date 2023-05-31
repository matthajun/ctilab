'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('LogTemplate');
const userUtil = require('../service/util/user');
const loopback = require('../../server/server');
const arrayUtil = require('../service/util/array');
const dao = require('../service/util/dao');
const cmnCode = require('../service/util/cmnCodeNameFind');
const moment = require('moment-timezone');
const _ = require('lodash');
const crypto = require('../service/util/crypto');
const motie_asset_query = require('../service/const/motie/motie_sql');

module.exports = function(MotieAssetIp) {
  MotieAssetIp.disableRemoteMethod('find', false);// search
  MotieAssetIp.disableRemoteMethod('findById', true);// search
  MotieAssetIp.disableRemoteMethod('create', true);// create
  MotieAssetIp.disableRemoteMethod('deleteById', true);// delete
  MotieAssetIp.disableRemoteMethod('prototype.patchAttributes', true);// update
  MotieAssetIp.disableRemoteMethod('replaceById', true);
  MotieAssetIp.disableRemoteMethod('upsert', true);
  MotieAssetIp.disableRemoteMethod('updateAll', true);
  MotieAssetIp.disableRemoteMethod('updateAttributes', true);
  MotieAssetIp.disableRemoteMethod('upsertWithWhere', true);
  MotieAssetIp.disableRemoteMethod('findOne', true);
  MotieAssetIp.disableRemoteMethod('replaceOrCreate', true);
  MotieAssetIp.disableRemoteMethod('createChangeStream', true);
  MotieAssetIp.disableRemoteMethod('confirm', true);
  MotieAssetIp.disableRemoteMethod('count', true);
  MotieAssetIp.disableRemoteMethod('exists', true);

  MotieAssetIp.beforeRemote('find', function(ctx, remoteMethodOutput, next) {
    const include = [
      {relation: 'motieAsset',
        scope: {
          fields: ['assetId', 'assetNm', 'stationId', 'powerGenId'],
        },
      },
    ];

    if (ctx.args.filter === undefined) {
      ctx.args.filter = {};
      ctx.args.filter.include = include;
    } else {
      ctx.args.filter.include = include;
    }
    next();
  });

  MotieAssetIp.afterRemote('find', function(ctx, remoteMethodOutput, next) {
    let filter;
    let where = '';
    if (ctx.args.filter !== undefined) {
      if (ctx.args.filter.where !== undefined) {
        where = ctx.args.filter.where;
      }
    }
    MotieAssetIp.count(where, function(err, rec) {
      if (err) {
        next('QUERY ERR');
      } else {
        let result = {
          data: {
            total_cnt: rec,
            data: ctx.result.map(rs => {
              const param =  rs.keeperKey ? {'keeperKey': rs.keeperKey.substring(0, 6)} : {'powerGenId': rs.powerGenId};
              let systemNm = '';
              const anmly = !_.isEmpty(rs.keeperKey);
              const lgsy = !_.isEmpty(rs.powerGenId);
              const excel = rs.fstUser.startsWith('excel');
              if(excel){
                systemNm = 'excel';
              }else
                if(anmly && lgsy){
                systemNm = '이상행위, 로그 분석';
              }else if(anmly  && ! lgsy){
                systemNm = '이상행위';
              }else if(!anmly && lgsy){
                systemNm = '로그분석';
              }

              /* 22.05.05 호기 코드 추가*/
              let conv_unitId = '';
              let unitId = '';
              if(rs.unitId) {
                unitId = rs.unitId.split('_')[3];
                if (unitId)
                  /* 임시로 0을 제거, 추루 10호기까지 확장 시에는 수정 필요! */
                  conv_unitId = unitId.replace('0', '');
                else
                  conv_unitId = rs.unitId;
              }

              /* 22.05.05 제조사 코드 추가*/
              const makeId = !_.isEmpty(rs.makeId);
              let conv_makeId = '';
              if (makeId) {
                const makeId = rs.makeId.substr(13);
                if (makeId === 'ABB')
                  conv_makeId = '보일러';
                else if (makeId === 'GE_GT')
                  conv_makeId = '터빈';
                else
                  conv_makeId = makeId;
              }

              const stationInfo = cmnCode.findPwrInfo(param);
              rs.stationId = stationInfo.stationId;
              rs.stationName = stationInfo.stationNm;
              rs.powerGenName = stationInfo.powerGenNm;
              rs.powerGenId   = stationInfo.powerGenId;
              rs.systemNm  = systemNm;
              rs.assetIp = crypto.encrypt(rs.assetIp);

              /* 22.05.05 태준 코드 추가*/
              rs.unitId = conv_unitId;
              rs.makeId = conv_makeId;

              rs.assetHogiCodeName = cmnCode.findCmnCodeName('DTI', 'div_hogi', rs.unitId);

              return rs;
            }),
          },
        };
        ctx.result = result;
        next();
      }
    });
  });

  MotieAssetIp.remoteMethod(
    'updateMotieAssetIp',
    {
      http: {path: '/updateMotieAssetIp', verb: 'patch'},
      description: '자산 수정',
      accepts: [
        {arg: 'params', type: 'object', required: true},
        {arg: 'req', type: 'object', http: {source: 'req'}}
      ],
      returns: {arg: 'data'}
    }
  );

  MotieAssetIp.updateMotieAssetIp = (params, req) => new Promise(async (resolve, reject) => {
    const userInfo = await loopback.models['account'].findById(req.accessToken.userId);
    const now = moment.tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');

    params.lstDttm = now;
    params.lstUser = userInfo.username || '';

    //업데이트 쿼리 변경 (22.6.7)
    const updateSql = `update dti.motie_asset_ip set state='U', assetId = ${params.assetId} , lstDttm= '${now}' , lstUser='${userInfo.username || ''}' where id= '${params.id}'`;
    await dao.executeQuery(MotieAssetIp.getDataSource().connector, '', updateSql).catch(e => {
      reject(e);
    });

/*    const result = await MotieAssetIp.updateAll({assetIp: params.assetIp }, {
       lstDttm: now,
       lstUser: userInfo.username || '',
       assetId: params.assetId
     }).catch(e => {
      logger.error(e);
       throw new Error(e);
     });*/

    resolve('UPDATE SUCCESS');
  });

  MotieAssetIp.remoteMethod(
    'updateMotieAssetIpMac',
    {
      http: {path: '/updateMotieAssetIpMac', verb: 'patch'},
      description: '자산 IP/Mac 수정',
      accepts: [
        {arg: 'params', type: 'object', required: true},
        {arg: 'req', type: 'object', http: {source: 'req'}}
      ],
      returns: {arg: 'data'}
    }
  );

  MotieAssetIp.updateMotieAssetIpMac = (params, req) => new Promise(async (resolve, reject) => {
    const userInfo = await loopback.models['account'].findById(req.accessToken.userId);
    const now = moment.tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');

    let setParams = {};
    setParams.lstDttm = now;
    setParams.lstUser = userInfo.username || '';

    // convert to unit-code + make code
    setParams.unitId = 'EWP_01_UN_0' + params.assetHogiCode;
    if(params.mnufcturCor === 'GE')
      setParams.makeId = setParams.unitId + '_GE_GT';
    else
      setParams.makeId = setParams.unitId + '_' +params.mnufcturCor;

    setParams.assetIp = params.motieAssetIp; setParams.id = params.id;
    setParams.deviceMac = params.assetMacAddrs;
    console.log(setParams);

    await MotieAssetIp.update({id: setParams.id}, setParams).catch(e => {
      console.log(e);
      return reject(e)
    });

    resolve('UPDATE SUCCESS');
  });

  MotieAssetIp.remoteMethod(
    'syncAssetMacAddress',
    {
      http: {path: '/syncAssetMacAddress', verb: 'post'},
      accepts: [
        {arg: 'req', type: 'object', http: {source: 'req'}}
      ],
      returns: [
        {arg: 'data'}
      ]
    }
  );

  MotieAssetIp.syncAssetMacAddress = (req) => new Promise(async (resolve, reject) => {
    const checkNewMacListSql = motie_asset_query.sql.check_new_mac_list;
    const dataSource = MotieAssetIp.getDataSource().connector;

    const checkNewMacList = await dao.executeQuery(dataSource, '', checkNewMacListSql).catch(e => reject(e));

    if (checkNewMacList.length > 0) {
      const userInfo = await loopback.models['account'].findById(req.accessToken.userId);
      const now = moment.tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');

      for (let checkNewMac of checkNewMacList) {
        const updateSql = `update dti.motie_asset_ip set deviceMac = '${checkNewMac.device_mac}', state='U', lstDttm= '${now}' , lstUser='${userInfo.username || ''}' where id= '${checkNewMac.id}'`;
        await dao.executeQuery(MotieAssetIp.getDataSource().connector, '', updateSql).catch(e => {
          reject(e);
        });
      }
      resolve("End syncAssetAnomalyLogSystem");

    } else {
      resolve("End syncAssetAnomalyLogSystem, checkNewIpList.length = 0 ");
    }
  });
};
