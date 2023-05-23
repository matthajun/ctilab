const httpcall = require('./httpCall');
const winston = require('../config/winston')(module);
const setTime = require('../utils/setDateTime');
const db = require('../models');
const confirmutils = require('./confirmutils');

const timeTable_insert = require('../ai/TimeTable_insert');

function isEmptyObj(obj)  {
    if (obj.constructor === Object && Object.keys(obj).length === 0) {
        return true;
    }
    return false;
}

module.exports.highrankPush = async function(value, num, version) {
    let confirmCode = confirmutils.makeConfirmCode(value.tableData);
    value.confirm_code = confirmCode;

    httpcall.Call('post', process.env.BUMUN_ADDRESS, value, async function (err, res) {
        if (err) { //부문위협 시스템으로의 전송이 실패했을 때
            winston.error('***************************** 부문위협 시스템으로의 전송이 실패하였습니다. *****************************');
            throw Error(err);
        }
        else{ //부문위협 시스템으로의 전송이 성공했을 때
            if(res.body.result.res_cd === '00') {
                // 빅데이터 응답에 로그남기기 22.07.11 추가
                if(res.body.result.res_msg.indexOf('빅데이터') !== -1)
                    winston.info("*************************** "+res.body.result.res_msg+" ***************");

                // 1. 전송이력 남기기
                // 운영정보 데이터가 아닐 경우만 이력을 남김 (수량이 너무 많음)
                if (value.tableName.indexOf('ai_op') === -1) {
                    if (Array.isArray(value.tableData)) { //테이블 데이터가 배열일 경우
                        for (let tableData of value.tableData) {
                            let data = {
                                date_time: setTime.setDateTimeforHistory(),
                                tableName: value.tableName,
                                tableData: JSON.stringify(tableData)
                            };
                            await db['MOTIE_TRANSMISSION_HISTORY'].create(data);
                        }
                    } else { //테이블 데이터가 단일일 경우
                        let data = {
                            date_time: setTime.setDateTimeforHistory(),
                            tableName: value.tableName,
                            tableData: JSON.stringify(value.tableData)
                        };
                        await db['MOTIE_TRANSMISSION_HISTORY'].create(data);
                    }
                }

                // 2. 타임테이블에 전송 완료시간 Insert
                if ((!num) || num === 0) { // 파라미터인 num가 NULL/NaN 이거나 0일때만 이 로직을 실행
                    //version 이 제대로 전달 된 경우만 -> 테스트 코드가 아닐 경우
                    if (version) {
                        if (!isEmptyObj(version)) {
                            timeTable_insert.version_insert(version, value.tableName);
                        }
                        // 테스트용 코드!!!!!!!!!!!!!!!!!!!!
                        // else { // 버전이 비어있는 경우 ->  !!!!!!!!!!!!!!!!!!!! 테스트 !!!!!!!!!!!!!!!!!!!
                        //     console.log('버전이 비었습니다.')
                        // }
                    }
                }

            }
            if(isNaN(num)) num = 0;
            winston.info("*************************** " + value.tableName + "'s transmission success (" + (num+1) +") *****************************");
        }
    });
};
