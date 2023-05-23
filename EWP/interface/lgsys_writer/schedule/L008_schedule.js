const schedule = require('node-schedule');
const httpcall = require('../utils/httpCall');
const makejson = require('../utils/makejson');
const {QueryTypes} = require('sequelize');
const db = require('../models');
const winston = require('../config/winston')(module);
const setDateTime = require('../utils/setDateTime');

const tableName = process.env.L004_TABLE;

const L004 = require('../service/L004');

exports.scheduleInsert = () => {
    schedule.scheduleJob(process.env.L008_TIME, function() {
        const result = db.sequelize.transaction(async (t) => {
            let rslt = await db.sequelize.query(
                'SELECT distinct dti.motie_asset_ip.deviceId as device_id, sanGubun as who, ' +
                'cpuNotice as cpu_notice, cpuWarning as cpu_warning, memoryNotice as memory_notice, ' +
                'memoryWarning as memory_warning, diskNotice as disk_notice, diskwarning as disk_warning ' +
                'FROM dti.motie_log_system inner join dti.motie_asset on dti.motie_log_system.assetNm = dti.motie_asset.assetNm ' +
                'inner join dti.motie_asset_ip on dti.motie_asset.assetId = dti.motie_asset_ip.assetId ' +
                'where state_limit = \'C\' or state_limit = \'U\';'
                ,{
                    type: QueryTypes.SELECT
                }
            ).then(async users => {
                if(users.length) {
                    let value = makejson.makeReqData_L008('L008', users);
                    winston.debug(JSON.stringify(value));

                    httpcall.Call('post', process.env.L008_ADDRESS, value, async function (err, res) {
                        if (res) {
                            let history = {...res};
                            history.body.contents = JSON.stringify(value.body);
                            await L004.parseAndInsert(history);

                        } else {
                            winston.error('************************* res 값이 없습니다. *************************');
                            let history = {header:{message_id: 'L008'}, body:{result:{}, res_cd: '500', res_msg: '로그 분석 시스템 응답 없음', contents: JSON.stringify(value.body),
                                sent_time: setDateTime.setDateTime(), date_time: setDateTime.setDateTime()}};
                            await L004.parseAndInsert(history);
                            console.log(err);

                            await db[tableName].update({stateValue: '500'}, {where: {state_level: ['C', 'U']}});
                        }
                        if (err) {
                            winston.error("****************** L008 송신 에러!**********************");

                            console.log(err);
                        }
                    });
                    await db[tableName].update({state_limit: 'E'}, {where: {state_limit: ['C','U']}});
                }
            });
            if(rslt instanceof Error){
                throw new Error(rslt);
            }
        });
    })
};