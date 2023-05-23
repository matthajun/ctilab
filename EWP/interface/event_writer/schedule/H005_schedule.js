const schedule = require('node-schedule');
const httpcall = require('../utils/httpCall');
const makejson = require('../utils/makejson');
const {QueryTypes} = require('sequelize');

const obc = require('../utils/objectconvert');
const keychange = require('../utils/KeyChange');

const db = require('../models');
const H005_bw=require('../service/H005_bw');
const H005 = require('../service/H005');

const tableName = process.env.BW_LIST_TABLE;
const param_tableName = process.env.BW_LIST_HISTORY_TABLE;

const winston = require('../config/winston')(module);
const makereq = require('../utils/makerequest');
const getRequest = require('../utils/getRequestId');

exports.scheduleInsert = () => {
    schedule.scheduleJob(process.env.H005_TIME, function() {
        // state C 인 경우(생성)
        const result_C = db.sequelize.transaction(async (t) => {
            let rslt = await db.sequelize.query(
                `select concat(\'${process.env.UNIT_PREFIX}\',unit) AS unit, ` +
                `IF(make = \'ABB\', \'EWP_01_UN_02_ABB\', ` +
                `IF(make = \'GE\', \'EWP_01_UN_02_GE_GT\', NULL)) AS make, ` +
                `port, ip, type, sanGubun from black_white_list ` +
                'where state= \'C\' and deploy = \'Y\''
                ,{
                    type: QueryTypes.SELECT
                }
            ).then(async users => {
                if(users.length){
                    winston.info("******************* H005 creation is founded!! *************************");
                    let blackInfos = [];
                    let whiteInfos = [];

                for (let user of users) {
                    if (user.type === 0) { //blacklist 이다.
                        blackInfos.push(user);
                    } else { //whitelist 이다.
                        whiteInfos.push(user);
                    }
                }

                if (whiteInfos.length) {
                    keychange.KeyChange_h005(whiteInfos);
                    const child_whiteInfos = obc.obConvert(whiteInfos);

                    for (let k of child_whiteInfos) {
                        //console.log(k);
                        let value = makejson.makeReqData_H005_wh(k, 11);
                        winston.debug(JSON.stringify(value));
                        httpcall.Call('post', process.env.ANOMAL_ADDRESS, value, async function (err, res) {
                            if (res) {
                                H005.parseAndInsert(res);

                                value.body.res_cd = '00';
                                value.body.res_msg = '이상행위시스템으로 배포에 성공하였습니다.';
                                H005_bw.parseAndInsert(value, param_tableName);
                            }
                            else{
                                winston.error('*********************** 이상행위시스템에 응답이 없습니다. *************************');
                                value.body.res_cd = '500';
                                value.body.res_msg = '이상행위시스템에 응답이 없습니다.';
                                H005_bw.parseAndInsert(value, param_tableName);
                            }
                           if (err) {
                                winston.error("HTTP CALL Error! at whitelist");
                            }
                        });

                    }
                }

                if (blackInfos.length) {
                    keychange.KeyChange_h005(blackInfos);
                    const child_blackInfos = obc.obConvert(blackInfos);

                    for (let k of child_blackInfos) {
                        let value = makejson.makeReqData_H005_bl(k, 11);
                        winston.debug(JSON.stringify(value));
                        setTimeout(function() {
                            httpcall.Call('post', process.env.ANOMAL_ADDRESS, value, async function (err, res) {
                                if (res) {
                                    H005.parseAndInsert(res);

                                    value.body.res_cd = '00';
                                    value.body.res_msg = '이상행위시스템으로 배포에 성공하였습니다.';
                                    H005_bw.parseAndInsert(value, param_tableName);
                                }
                                else{
                                    winston.error('*********************** 이상행위시스템에 응답이 없습니다. *************************');
                                    value.body.res_cd = '500';
                                    value.body.res_msg = '이상행위시스템에 응답이 없습니다.';
                                    H005_bw.parseAndInsert(value, param_tableName);
                                }
                                if (err) {
                                    winston.error("HTTP CALL Error! at blacklist");
                                }
                            });
                        }, 300)
                    }
                }

                let rt = await db[tableName.toUpperCase()].update({state: 'E'},
                    {
                        where: {
                            state: 'C' //테스트를 위해 비워둠 (실제 값 C)
                        }
                    });
                if (rt instanceof Error) {
                    throw new Error(rt);
                }
            }
            });

            if(rslt instanceof Error){
                throw new Error(rslt);
            }
        });

        //state U인 경우 (업데이트)
        setTimeout(function() {
            const result_U = db.sequelize.transaction(async (t) => {
            let rslt = db[tableName.toUpperCase()].findAll({where:{state : 'U', deploy: 'Y'}})
                .then(async users => {
                    if(users.length){
                        winston.info("******************* H005 update is founded!! *************************");
                        let blackInfos = [];
                        let whiteInfos = [];

                        for(user of users) {
                            let data = {...user.dataValues};
                            user.update({state:'E'});

                            if(data.sanGubun === 1) {
                                //부문으로 업데이트
                                winston.debug(JSON.stringify(data));
                                let tableInfo = {tableName: tableName, tableData: data};
                                //makereq.highrankPush(tableInfo); //부문전송금지(11.02)
                            }

                            if (data.type === 0) { //blacklist 이다.
                                let temp = keychange.KeyChange_h005_update(data);
                                blackInfos.push(temp);
                            } else { //whitelist 이다.
                                let temp = keychange.KeyChange_h005_update(data);
                                whiteInfos.push(temp);
                            }
                        }
                        if (whiteInfos.length){
                            const child_whiteInfos = obc.obConvert(whiteInfos);

                            for (let k of child_whiteInfos) {
                                let value = makejson.makeReqData_H005_wh(k, 11);
                                console.log(value);
                                if(!value.body.request_id)
                                    value.body.request_id=getRequest.getRequestId('H005');
                                winston.debug(JSON.stringify(value));

                                httpcall.Call('post', process.env.ANOMAL_ADDRESS, value, async function (err, res) {
                                    if (res) {
                                        H005.parseAndInsert(res);

                                        value.body.res_cd = '00';
                                        value.body.res_msg = '이상행위시스템으로 배포에 성공하였습니다.';
                                        H005_bw.parseAndInsert(value, param_tableName);
                                    }
                                    else{
                                        winston.error('*********************** 이상행위시스템에 응답이 없습니다. *************************');
                                        value.body.res_cd = '500';
                                        value.body.res_msg = '이상행위시스템에 응답이 없습니다.';
                                        H005_bw.parseAndInsert(value, param_tableName);
                                    }
                                    if (err) {
                                        winston.error("HTTP CALL Error! at whitelist");
                                    }
                                });
                            }
                        }
                        if (blackInfos.length){
                            const child_blackInfos = obc.obConvert(blackInfos);

                            for (let k of child_blackInfos) {
                                let value = makejson.makeReqData_H005_bl(k, 11);
                                if(!value.body.request_id)
                                    value.body.request_id = getRequest.getRequestId('H005');
                                winston.debug(JSON.stringify(value));

                                setTimeout(function() {
                                    httpcall.Call('post', process.env.ANOMAL_ADDRESS, value, async function (err, res) {
                                        if (res) {
                                            H005.parseAndInsert(res);

                                            value.body.res_cd = '00';
                                            value.body.res_msg = '이상행위시스템으로 배포에 성공하였습니다.';
                                            H005_bw.parseAndInsert(value, param_tableName);
                                        }
                                        else{
                                            winston.error('*********************** 이상행위시스템에 응답이 없습니다. *************************');
                                            value.body.res_cd = '500';
                                            value.body.res_msg = '이상행위시스템에 응답이 없습니다.';
                                            H005_bw.parseAndInsert(value, param_tableName);
                                        }
                                        if (err) {
                                            winston.error("HTTP CALL Error! at blacklist");
                                        }
                                    });
                                },200)
                            }
                        }
                    }
                })
            });
        },500)
    })
};