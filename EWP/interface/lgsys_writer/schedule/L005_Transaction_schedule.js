const schedule = require('node-schedule');
const httpcall = require('../utils/httpCall');
const makejson = require('../utils/makejson');
const db = require('../models');
const winston = require('../config/winston')(module);

const CH_L005 = require('../clickhouse/L005');
const CH_L005_b = require('../clickhouse/L005_bumun');

exports.scheduleInsert = () => {
    schedule.scheduleJob(process.env.L005_TRANSACTION_TIME, async function() {
        let rtnResult = {};
        let result = {};
        let result_sect = {};

        try {
            let tableName = 'motie_L005_history';

            let rslt = await db[tableName.toUpperCase()].findAll({where: {state: ['C']}})
                .then(async users => {
                    if (users.length) {
                        for (user of users) {
                            let data = {...user.dataValues};
                            let value = makejson.makeReqData_L005_retry('L005', data);
                            httpcall.Call('get', process.env.L005_ADDRESS, value, async function (err, res) {
                                if (res) {
                                    //체크섬 검사
                                    const resData = res;
                                    const resConfirmCode = resData.body.result.checksum;
                                    if (resConfirmCode) {
                                        const localMakeConfirmCode = await confirmutils.makeConfirmCode(resData.body.list);

                                        if (resConfirmCode !== localMakeConfirmCode) {
                                            winston.error(`우리쪽 값 ${localMakeConfirmCode} ,  받은 값 ${resConfirmCode}`);
                                            throw Error('************** CheckSum 값이 일치하지 않아 데이터를 저장하지 않습니다. **************');
                                        }
                                    }

                                    result = await CH_L005.parseAndInsert(res);
                                    //result_sect = await CH_L005_b.parseAndInsert(res);  //부문전송금지(11.02)

                                    //단위 - 로그 트랜잭션, 실패 시 "이력테이블"에 실패이력 저장
                                    if (result instanceof Error) {
                                        winston.error('****************** 로그 이벤트 저장에 실패했습니다. (단위 CH 트랜잭션 오류) ******************');
                                    }
                                    //단위-부문 인서트 에러여부 확인
                                    else if (result_sect instanceof Error) {
                                        winston.error('****************** 부문 시스템과의 연결이 끊겼습니다. (부문 CH 트랜잭션 오류) ******************');
                                    }
                                    else {
                                        //트랜잭션 완전 성공 시 플래그 업데이트 한다.
                                        await user.update({state: 'E'});
                                    }

                                } else {
                                    winston.error('************** L005 응답이 없습니다.(트랜잭션 Retry 중) *******************');
                                    return;
                                }
                            })
                        }
                    }
                })
        }
        catch (error) {
            // If the execution reaches this line, an error occurred.
            // The transaction has already been rolled back automatically by Sequelize!
            winston.error(error.stack);
            rtnResult = error;
        } finally {
            return rtnResult;
        }
    })
};