const schedule = require('node-schedule');
const httpcall = require('../utils/httpCall');
const makejson = require('../utils/makejson');
const {QueryTypes} = require('sequelize');

const db = require('../models');
const H008 = require('../service/H008');

const winston = require('../config/winston')(module);
const setDateTime = require('../utils/setDateTime');

async function H013_schedule(num) {
    // state C 인 경우(생성)
    const result_C = db.sequelize.transaction(async (t) => {
        const ipQuery = 'select concat(\'EWP_01_UN_0\',assethogicode) as unit_id, IF(mnufcturCor =\'ABB\', concat(\'EWP_01_UN_0\',assethogicode,\'_ABB\'),'+
            'IF(mnufcturCor = \'GE\', concat(\'EWP_01_UN_0\',assethogicode,\'_GE_GT\'), NULL)) as make_id,'+
            ' dti.motie_asset_ip.assetIp as device_ip, ' +
            'deviceMac as device_mac,assetNm as device_name, hostInfo as host_name from dti.motie_asset inner join ' +
            'dti.motie_asset_ip on dti.motie_asset.assetId = dti.motie_asset_ip.assetId where assetReal = \'Y\'' ;

        let rslt = await db.sequelize.query(
                ipQuery
            ,{
                type: QueryTypes.SELECT
            }
        ).then(async users => {
            if(users.length){
                let asset = {'device_list': users};
                const value = makejson.makeReqData_Body('H013', asset);

                httpcall.Call('post', process.env.ANOMAL_ADDRESS, value, async function (err, res) {
                    if(res) {
                        let history = {...res};
                        history.body.contents = JSON.stringify(value.body);

                        await H008.parseAndInsert(history);
                    }
                    else{
                        winston.error('****************************** 응답이 없습니다. *******************************');
                        let error_res = {header:{message_id:'H013', keeper_id:'EWP_01_01', send_time: setDateTime.setDateTime()},
                            body:{result:{res_cd: '500', res_msg: '이상행위탐지시스템 응답 없음.', contents: JSON.stringify(value.body)}}};

                        await H008.parseAndInsert(error_res);
                        console.log(err);

                        winston.error('************************ H013 응답이 없습니다. ************************');
                        if (num === 1){
                            return;
                        }
                        else {
                            winston.info('**************************** H013 2번째 시도 ***************************');
                            await H013_schedule(num - 1);
                        }
                    }
                    if (err) {
                        winston.error("****************** H013 자산정보 송신 에러!**********************");
                        console.log(err);
                    }
                });
            }
        });
        if(rslt instanceof Error){
            throw new Error(rslt);
        }
    });
}

exports.scheduleInsert = () => {
    schedule.scheduleJob(process.env.H013_TIME, async function() {
        await H013_schedule(2);
    })
};
