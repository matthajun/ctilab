'use strict';
const log4js = require('log4js');
const logger = log4js.getLogger('LogTemplate');
const userUtil = require('../service/util/user');
const loopback = require('../../server/server');
const arrayUtil = require('../service/util/array');
const moment = require('moment-timezone');
const dao = require('../service/util/dao');
const cmnCode = require('../service/util/cmnCodeNameFind');
const motie_asset_query = require('../service/const/motie/motie_sql');
const user = require('../service/util/user');
const crypto = require('../service/util/crypto');
const slogger = require("../../common/logger/serverLogger");

module.exports = function (MotieAsset) {
  MotieAsset.disableRemoteMethod('find', false);// search
  MotieAsset.disableRemoteMethod('findById', true);// search
  MotieAsset.disableRemoteMethod('create', true);// create
  MotieAsset.disableRemoteMethod('deleteById', false);// delete
  MotieAsset.disableRemoteMethod('prototype.patchAttributes', true);// update
  MotieAsset.disableRemoteMethod('replaceById', true);
  MotieAsset.disableRemoteMethod('upsert', true);
  MotieAsset.disableRemoteMethod('updateAll', true);
  MotieAsset.disableRemoteMethod('updateAttributes', true);
  MotieAsset.disableRemoteMethod('upsertWithWhere', true);
  MotieAsset.disableRemoteMethod('findOne', true);
  MotieAsset.disableRemoteMethod('replaceOrCreate', true);
  MotieAsset.disableRemoteMethod('createChangeStream', true);
  MotieAsset.disableRemoteMethod('confirm', true);
  MotieAsset.disableRemoteMethod('count', true);
  MotieAsset.disableRemoteMethod('exists', true);

  MotieAsset.beforeRemote('find', function (ctx, remoteMethodOutput, next) {
    const include = [
      {
        relation: 'motieAssetIp',
        scope: {
          fields: ['assetIp', 'deviceMac']
        }
      }/*,  not supported loopback mutilple foreign keys
      { relation: 'motiePwrInfo',
        scope:
        {
          fields:['stationNm', 'powerGenNm']
        }
      }*/
    ];

    if (ctx.args.filter === undefined) {
      ctx.args.filter = {};
      ctx.args.filter.include = include;
    } else {
      ctx.args.filter.include = include;
    }
    //assetReal 칼럼 추가, 22.09.14 태준
    if (ctx.args.filter.where === undefined) {
      ctx.args.filter.where = {
        and: [
          {state: {inq: ['U', 'C','E']}}
          ,
          {
           assetReal: 'Y'
          }
        ]
      };
    } else {
      ctx.args.filter.where = Object.assign(ctx.args.filter.where, {state: {inq: ['U', 'C','E']}, assetReal: {inq: []}})
    }

    if (ctx.args.filter.order === undefined) {
      ctx.args.filter.order = 'assetId desc';
    }
    //{where:{or:[{state:'U'},{state:'C'}]}
    next();
  });

  MotieAsset.afterRemote('find', function (ctx, remoteMethodOutput, next) {
    var filter;
    var where = "";
    if (ctx.args.filter !== undefined) {
      if (ctx.args.filter.where !== undefined) {
        where = ctx.args.filter.where;
      }
    }
    MotieAsset.count(where, function (err, rec) {
      if (err) {
        next("QUERY ERR");
      } else {
        var result = {
          data: {
            total_cnt: rec,
            data: ctx.result.map(rs => {
              let motieAssetIps = rs.__cachedRelations['motieAssetIp'];
              if(motieAssetIps.length > 0) {
                motieAssetIps.map(ip => {
                  return ip.assetIp = crypto.encrypt(ip.assetIp);
                });
              }
              const stationInfo = cmnCode.findPwrInfo({'stationId': rs.stationId, 'powerGenId': rs.powerGenId});
              rs.stationName = stationInfo.stationNm;
              rs.powerGenName = stationInfo.powerGenNm;
              rs.keeperKey = stationInfo.keeperKey;
              rs.assetHogiCodeName = cmnCode.findCmnCodeName('DTI', 'div_hogi', rs.assetHogiCode);
              rs.assetClassName = cmnCode.findCmnCodeName('DTI', 'div_gubun', rs.assetClassCode);
              rs.assetHighClassName = cmnCode.findCmnCodeName('DTI', 'div_high_gubun', rs.assetHighClassCode);
              return rs;
            })
          }
        };
        ctx.result = result;
        next();
      }
    });
  });


  MotieAsset.remoteMethod(
    'createMotieAsset',
    {
      http: {path: '/createMotieAsset', verb: 'post'},
      description: '자산 등록',
      accepts: [
        {arg: 'params', type: 'object', required: true},
        {arg: 'req', type: 'object', http: {source: 'req'}}
      ],
      returns: {arg: 'data'}
    }
  );

  /**
   * 자산 등록 => api를 통하여 등록된 ip정보를 이용하여 자산 생성 및 ip 정보 자산id로 업데이트
   * @param params
   * @param req
   * @returns {Promise<any>}
   */
  MotieAsset.createMotieAsset = (params, req) => new Promise(async (resolve, reject) => {

    const userInfo = await loopback.models['account'].findById(req.accessToken.userId);
    const now = moment.tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');

    delete params.assetId;
    params.acquireDate = `${params.acquireDate.year}-${params.acquireDate.month}-${params.acquireDate.day}`;
    params.fstUser = userInfo.username || '';
    params.fstDttm = now;
    params.lstDttm = now;
    params.lstUser = userInfo.username || '';
    if(!params.assetMacAddr) params.assetMacAddr = '11:11:11:11:11:11';

    MotieAsset.beginTransaction('READ COMMITTED', async function (err, tx) {
      try {
        const newMotieAsset = await MotieAsset.create(params, {transaction: tx}).catch(e => {
          console.log(e);
          return reject(e)
        });
        // relation key 일때 model.update keyname=value  where ... 불가
        const motieAssetIpModel = loopback.models['MotieAssetIp'];
        const arrMotieAssetIp = params.motieAssetIp.split(',');
        slogger.addInfoLog(params.id + ' 번 자산IP 업데이트!!!');

        //업데이트 쿼리 변경 (22.6.7 태준)
        const updateSql = `update dti.motie_asset_ip set state='U' ,  assetId = ${newMotieAsset.assetId} , lstDttm= '${now}' , lstUser='${userInfo.username || ''}' where id = '${params.id}'`;
        await dao.executeQuery(MotieAsset.getDataSource().connector, '', updateSql).catch(e => {
          console.log(e);
          throw new Error(e);
        });

        // for (let objMotieAssetIp of arrMotieAssetIp) {
        //   const updateSql = `update dti.motie_asset_ip set state='U' ,  assetId = ${newMotieAsset.assetId} , lstDttm= '${now}' , lstUser='${userInfo.username || ''}' where assetIp = '${objMotieAssetIp}'`
        //   await dao.executeQuery(MotieAsset.getDataSource().connector, '', updateSql).catch(e => {
        //     console.log(e);
        //     throw new Error(e);
        //   });
          //console.log(await motieAssetIpModel.find({where: {assetIp: objMotieAssetIp}}));

/*          const result = await motieAssetIpModel.updateAll({assetIp: objMotieAssetIp }, {
             lstDttm: now,
             lstUser: '11111111111111111' || '',
             assetId: newMotieAsset.assetId
           },
           {transaction: tx}).catch(e => {
            logger.error(e);
             throw new Error(e);
           });*/
        // }
        tx.commit();
        resolve('success create');
      } catch (e) {
        tx.rollback();
        reject('오류가 발생하였습니다.');
      }
    });
  });

  MotieAsset.remoteMethod(
    'updateMotieAsset',
    {
      http: {path: '/updateMotieAsset', verb: 'patch'},
      description: '자산 수정',
      accepts: [
        {arg: 'params', type: 'object', required: true},
        {arg: 'req', type: 'object', http: {source: 'req'}}
      ],
      returns: {arg: 'data'}
    }
  );

  MotieAsset.updateMotieAsset = (params, req) => new Promise(async (resolve, reject) => {
    const userInfo = await loopback.models['account'].findById(req.accessToken.userId);
    const now = moment.tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');

    params.acquireDate = `${params.acquireDate.year}-${params.acquireDate.month}-${params.acquireDate.day}`;
    delete params.fstUser;
    delete params.fstDttm;
    params.lstDttm = now;
    params.lstUser = userInfo.username || '';

    await MotieAsset.update({assetId: params.assetId}, params).catch(e => {
      console.log(e);
      return reject(e)
    });

    resolve('UPDATE SUCCESS');
    /*  ip 변경 없음 트랜잭션 제거
        MotieAsset.beginTransaction('READ COMMITTED', async  function (err, tx) {
          try{
            await MotieAsset.update(params, {transaction: tx}).catch(e=>{console.log(e);return reject(e)});
            const motieAssetIpModel = loopback.models['MotieAssetIp'];

            const arrMotieAssetIp = params.motieAssetIp.split(',');
            for (let objMotieAssetIp of arrMotieAssetIp) {
              params.assetIp = objMotieAssetIp;
              await motieAssetIpModel.upsert(params).catch(e => {console.log(e);return reject(e)});
            }
            tx.commit();
            resolve('update success');
          }catch (e) {
            tx.rollback();
            reject(e);
          }
        });*/
  });

  MotieAsset.remoteMethod(
    'deleteMotieAsset',
    {
      http: {path: '/deleteMotieAsset', verb: 'patch'},
      description: '자산 삭제',
      accepts: [
        {arg: 'param', type: 'object', required: false},
        {arg: 'req', type: 'object', http: {source: 'req'}}
      ],
      returns: {arg: 'data'}
    }
  );

  MotieAsset.deleteMotieAsset = (param, req) => new Promise(async (resolve, reject) => {

    const userInfo = await loopback.models['account'].findById(req.accessToken.userId);
    const now = moment.tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');

    let params = {};
    params.lstDttm = now;
    params.lstUser = userInfo.username || '';
    params.state = 'D';

    await MotieAsset.update({assetId: param.assetId}, params).catch(e => {
      console.log(e);
      return reject(e)
    });

    const updateSql = `update dti.motie_asset_ip set assetId = null, state='U', lstDttm= '${now}' , lstUser='${userInfo.username || ''}' where assetId = '${param.assetId}'`
    await dao.executeQuery(MotieAsset.getDataSource().connector, '', updateSql).catch(e => {
      console.log(e);
      throw new Error(e);
    });

    resolve('DELETE SUCCESS');
  });

  MotieAsset.remoteMethod(
    'createMotieAssetExcel',
    {
      http: {path: '/createMotieAssetExcel', verb: 'post'},
      description: '자산 일괄 등록',
      accepts: [
        {arg: 'params', type: 'any', required: true},
        {arg: 'req', type: 'object', http: {source: 'req'}}
      ],
      returns: {arg: 'data'}
    }
  );

  /**
   * 자산 일괄 등록 => 엑셀 파일의 자산 정보 일괄 등록
   * @param params
   * @param req
   * @returns {Promise<any>}
   */
  MotieAsset.createMotieAssetExcel = (params, req) => new Promise(async (resolve, reject) => {
    const userInfo = await loopback.models['account'].findById(req.accessToken.userId);
    const now = moment.tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');

    let errorList = [];
    errorList.push('오류 내용 리스트');
    MotieAsset.beginTransaction('READ COMMITTED', (err, tx) => {
      params.forEach(async (param, index) => {
        try {
          param.fstUser = 'excel_' + userInfo.username || '';
          param.lstUser = userInfo.username || '';
          param.fstDttm = param.lstDttm = now;

          let options = {transaction: tx};
          // let options = {...req, transaction: tx};
          // let ipParam = { assetIp: param.motieAssetIp, assetId: newMotieAsset.assetId, fstUser: param.fstUser, fstDttm: param.fstDttm, lstUser: param.lstUser, lstDttm: param.lstDttm, state: 'U' };
          if (param.motieAssetIp) {
            let ipParam = { assetIp: param.motieAssetIp, assetId: null, fstUser: param.fstUser, fstDttm: param.fstDttm, lstUser: param.lstUser, lstDttm: param.lstDttm, powerGenId: param.powerGenId};
            let motieAssetIpModel = loopback.models['MotieAssetIp'];
            let motieAssetIpList = await motieAssetIpModel.find({where : {assetIp: param.motieAssetIp}});

            let motieAssetIP = motieAssetIpList.filter(row => row.assetIp === param.motieAssetIp);
            if (motieAssetIP.length === 0) {
              // ip가 존재하지 않은 경우 ==> 자산 후 IP 등록
              let newMotieAsset = await MotieAsset.create(param, options);
              //   .catch(error => {
              //   logger.error(error);
              //   throw (`[${param.assetNm || '자산명 없음' }] 자산 IP 추가를 실패하였습니다.`);
              // });
              if(newMotieAsset.assetId) {
                // delete ipParam.state;
                ipParam.assetId = newMotieAsset.assetId;
                await motieAssetIpModel.create(ipParam, options);
              }
            } else {
              // ip가 존재하는 경우 ==> 자산 등록 안함
            }
          }

        } catch (e) {
          logger.error(e);
          errorList.push(`[${param.assetNm || '자산명 없음' }] 자산 등록 도중 오류가 발생하였습니다.`);
        } finally {
          if(index === params.length - 1 ) {
            if (errorList.length > 1) {
              let err = errorList.join("<br>");
              tx.rollback();
              reject(err);
            } else {
              tx.commit();
              resolve('success upload');
            }
          }
        }
      });
    });
  });

  MotieAsset.remoteMethod(
    'syncAssetAnomalyLogSystem',
    {
      http: {path: '/syncAssetAnomalyLogSystem', verb: 'post'},
      accepts: [
        {arg: 'req', type: 'object', http: {source: 'req'}}
      ],
      returns: [
        {arg: 'data'}
      ]
    }
  );

  MotieAsset.syncAssetAnomalyLogSystem = (req) => new Promise(async (resolve, reject) => {
    const checkNewIpListSql = motie_asset_query.sql.check_new_ip_list;
    const dataSource = MotieAsset.getDataSource().connector;
    const motieAssetIpModel = loopback.models['MotieAssetIp'];

    const checkNewIpList = await dao.executeQuery(dataSource, '', checkNewIpListSql).catch(e => reject(e));
    if (checkNewIpList.length > 0) {
     // const userInfo = await loopback.models['account'].findById(req.accessToken.userId);

      for (let checkNewIp of checkNewIpList) {
        checkNewIp.fstDttm = moment.tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
        checkNewIp.lstDttm = moment.tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
        checkNewIp.fstUser = 'batch';
        checkNewIp.lstUser = 'batch';
        console.log(checkNewIp);
        await motieAssetIpModel.create(checkNewIp).catch(e => {
          reject(e);
        });
      }
      resolve("End syncAssetAnomalyLogSystem");

    } else {
      resolve("End syncAssetAnomalyLogSystem, checkNewIpList.length = 0 ");
    }
  });
};



