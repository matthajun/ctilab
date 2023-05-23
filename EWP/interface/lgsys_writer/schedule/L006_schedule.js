const schedule = require('node-schedule');
const httpcall = require('../utils/httpCall');
const L005 = require('../service/L005');
const makejson = require('../utils/makejson');
const db = require('../models');
const sequelize = require('sequelize');
const winston = require('../config/winston')(module);
const _ = require('loadsh');
const {QueryTypes} = require('sequelize');
const makereq = require('../utils/makerequest');
const historyInsert = require('../service/History');

exports.scheduleInsert = () => {
    schedule.scheduleJob(process.env.L006_TIME, async function () {
        let rtnResult = {};

        try {
            const result = await db.sequelize.transaction(async (t) => {
                let tableName = process.env.DATA_REQUEST_TABLE;
                let rslt = await db.sequelize.query(
                    'SELECT distinct dti.motie_data_request.id, type, gubun, dti.motie_data_request.powerGenId, dti.motie_data_request.unitId, ' +
                    'dti.motie_data_request.makeId, dti.motie_asset_ip.deviceId, startTime, endTime, dti.motie_data_request.state, ' +
                    'dti.motie_data_request.stateValue, dti.motie_data_request.fstUser, dti.motie_data_request.fstDttm, ' +
                    'dti.motie_data_request.stationId FROM dti.motie_data_request ' +
                    'inner join dti.motie_asset on dti.motie_data_request.deviceId = dti.motie_asset.assetNm ' +
                    'inner join dti.motie_asset_ip on dti.motie_asset.assetId = dti.motie_asset_ip.assetId ' +
                    'where dti.motie_data_request.gubun = \'LOG_OR\' and dti.motie_data_request.state = \'200\';'
                    ,{
                        type: QueryTypes.SELECT
                    }
                ).then(async users => {
                    if(users.length) {
                        for (let user of users) {
                            //L006저장
                            let data = {};
                            data = user;

                            let value = makejson.makeReqData_L006('L006', data);
                            winston.debug(JSON.stringify(value));
                            setTimeout(function() {
                                httpcall.Call('get', process.env.L006_ADDRESS, value, async function (err, res) {
                                    if (res) {
                                        winston.debug(JSON.stringify(res));
                                        const resData = res;
                                        const resConfirmCode = resData.body.result.checksum;
                                        if (resConfirmCode) {
                                            const localMakeConfirmCode = await confirmutils.makeConfirmCode(resData.body.list);

                                            if (resConfirmCode !== localMakeConfirmCode) {
                                                winston.error(`우리쪽 값 ${localMakeConfirmCode} ,  받은 값 ${resConfirmCode}`);

                                                await db[tableName.toUpperCase()].update({
                                                    state: '201',
                                                    stateValue: '500'
                                                }, {where: {state: '200'}});

                                                user.state = '201';
                                                user.stateValue = '500';
                                                winston.info('************** 상태값 500로 업데이트! ****************');

                                                throw Error('************** CheckSum 값이 일치하지 않아 데이터를 저장하지 않습니다. **************');
                                            }
                                        }
                                        await L005.parseAndInsert(res);

                                        let history = {
                                            ...res.header, ...res.body.result,
                                            contents: JSON.stringify(value.body)
                                        };
                                        await historyInsert.parseAndInsert(history);

                                        if (res.body.result.res_msg === 'No Data') {
                                            await db[tableName.toUpperCase()].update({
                                                state: '201',
                                                stateValue: '204'
                                            }, {where: {state: '200'}});
                                            user.state = '201';
                                            user.stateValue = '204';
                                            winston.info('************** 상태value 값 204로 업데이트! ****************');
                                        }
                                        else if (res.body.result.res_msg.indexOf('범위') !== -1) {
                                            await db[tableName.toUpperCase()].update({
                                                state: '201',
                                                stateValue: '408'
                                            }, {where: {state: '200'}});
                                            user.state = '201';
                                            user.stateValue = '408';
                                            winston.info('************** 상태값 408로 업데이트! ****************');
                                        }
                                        else {
                                            await db[tableName.toUpperCase()].update({
                                                state: '201',
                                                stateValue: '201'
                                            }, {where: {state: '200'}});
                                            user.state = '201';
                                            user.stateValue = '201';
                                            winston.info('************** 상태값 201로 업데이트! ****************');
                                        }

                                        if (result instanceof Error) {
                                            throw new Error(result);
                                        }
                                    } else {
                                        await db[tableName.toUpperCase()].update({
                                            state: '500',
                                            stateValue: '404'
                                        }, {where: {state: '200'}});
                                        user.state = '500';
                                        user.stateValue = '404';
                                        winston.info('************** 상태값 500로 업데이트! ****************');
                                        winston.error('****************************** L006 응답이 없습니다. *******************************');

                                        let history = {
                                            message_id: 'L006',
                                            res_cd: 500,
                                            res_msg: '로그 시스템에 응답이 없습니다.',
                                            contents: JSON.stringify(value.body)
                                        };
                                        await historyInsert.parseAndInsert(history);
                                    }
                                });
                            },100);

                            setTimeout(function() {
                                //부문으로 생성,업데이트
                                winston.debug('*************** L006 부문으로 전송 ***************');
                                winston.debug(JSON.stringify(user));
                                let tableInfo = {tableName: 'motie_data_request', tableData: user};
                                //makereq.highrankPush(tableInfo); //부문전송금지(11.02)
                            },1000)
                        }
                    }
                });
            })
        } catch (error) {
            // If the execution reaches this line, an error occurred.
            // The transaction has already been rolled back automatically by Sequelize!
            winston.error(error.stack);
            rtnResult = error;
        } finally {
            return rtnResult;
        }
    })
};