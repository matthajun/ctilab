const schedule = require('node-schedule');
const httpcall = require('../utils/httpCall');
const makejson = require('../utils/makejson');
const {QueryTypes} = require('sequelize');
const db = require('../models');
const winston = require('../config/winston')(module);

const L004 = require('../service/L004');
const makereq = require('../utils/makerequest');
const setDateTime = require('../utils/setDateTime');

const tableName = process.env.L004_TABLE;

exports.scheduleInsert = () => {
    schedule.scheduleJob(process.env.L004_TIME, function() {
        const result = db.sequelize.transaction(async (t) => {
            let rslt = await db.sequelize.query(
                'SELECT distinct dti.motie_log_system.powerGenId, dti.motie_log_system.assetNm, dti.motie_asset_ip.deviceId, levelLow, \n' +
                'levelHight, dti.motie_log_system.id, dti.motie_log_system.stationId, cpuNotice, cpuWarning, memoryNotice, memoryWarning, diskNotice, diskwarning, ' +
                'content, dti.motie_log_system.fstUser, dti.motie_log_system.fstDttm, dti.motie_log_system.lstUser, dti.motie_log_system.lstDttm, ' +
                'state_level, stateValue, sanGubun FROM dti.motie_log_system inner join dti.motie_asset on dti.motie_log_system.assetNm = dti.motie_asset.assetNm \n' +
                'inner join dti.motie_asset_ip on dti.motie_asset.assetId = dti.motie_asset_ip.assetId \n' +
                'where state_level = \'C\' or state_level = \'U\';'
                ,{
                    type: QueryTypes.SELECT
                }
            ).then(async users => {
                if(users.length) {
                    for (let user of users) {

                        let value = makejson.makeReqData_L004(user.powerGenId, user.deviceId, user.levelLow, user.levelHight, user.sanGubun);
                        winston.debug(JSON.stringify(value));

                        httpcall.Call('POST', process.env.L004_ADDRESS, value, async function (err, res) {
                            if (res) {
                                let history = {...res};
                                history.body.contents = JSON.stringify(value.body);
                                await L004.parseAndInsert(history);

                                if(res.body.result.res_cd === 0) {
                                    winston.error("****************** 201 상태밸류 업데이트 *****************");
                                    await db[tableName].update({stateValue: '201'}, {where: {state_level: ['C', 'U']}});
                                    user.stateValue = '201';
                                }
                                else if(res.body.result.res_cd === -1) {
                                    winston.error("****************** 500 상태밸류 업데이트 ****************");
                                    await db[tableName].update({stateValue: '500'}, {where: {state_level: ['C', 'U']}});
                                    user.stateValue = '500';
                                }
                            } else {
                                winston.error('************************* res 값이 없습니다. *************************');
                                let history = {header:{message_id: 'L004'}, body:{result:{}, res_cd: '500', res_msg: '로그 분석 시스템 응답 없음', contents: JSON.stringify(value.body),
                                    sent_time: setDateTime.setDateTime(), date_time: setDateTime.setDateTime()}};
                                await L004.parseAndInsert(history);
                                console.log(err);

                                await db[tableName].update({stateValue: '500'}, {where: {state_level: ['C', 'U']}});
                                user.stateValue = '500';
                            }
                            if (err) {
                                winston.error("****************** L004 송신 에러!**********************");
                                console.log(err);
                            }
                        });
                        setTimeout(function() {
                            if (user.state_level === 'U') {
                                winston.debug('*************** L004 업데이트 전송 ***************');
                                let tableInfo = {tableName: 'motie_log_system', tableData: user};
                                //makereq.highrankPush(tableInfo);  //부문전송금지(11.02)
                            }
                            if (user.state_level === 'C') {
                                winston.debug('*************** L004 생성완료 전송 ***************');
                                let tableInfo = {tableName: 'motie_log_system', tableData: user};
                                //makereq.highrankPush(tableInfo);  //부문전송금지(11.02)
                            }
                        },200)
                    }
                    setTimeout(function() {
                        db[tableName].update({state_level: 'E'}, {where: {state_level: ['C', 'U']}});
                    },1000)
                }
            });
            if(rslt instanceof Error){
                throw new Error(rslt);
            }
        });
    })
};