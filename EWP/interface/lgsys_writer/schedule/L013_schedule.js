const schedule = require('node-schedule');
const httpcall = require('../utils/httpCall');
const makejson = require('../utils/makejson');
const CH_L005 = require('../clickhouse/L005');
const CH_L005_b = require('../clickhouse/L005_bumun');
const winston = require('../config/winston')(module);
const confirmutils = require('../utils/confirmutils');

const L005 = require('../service/L005');
const L015 = require('../service/L015');
const L005_FAIL = require('../service/L005_FAIL');

async function L013_schedule(num) {
    let value = makejson.makeReqData_L013('L013');
    let result = {};

    httpcall.Call('get', process.env.L013_ADDRESS, value,  async function (err, res) {
        if(res) {
            if(res.body.list) {
                const resData = res;
                const resConfirmCode = resData.body.result.checksum;
                if (resConfirmCode) {
                    const localMakeConfirmCode = await confirmutils.makeConfirmCode(resData.body.list);

                    if (resConfirmCode !== localMakeConfirmCode) {
                        winston.error(`우리쪽 값 ${localMakeConfirmCode} ,  받은 값 ${resConfirmCode}`);
                        throw Error('************** CheckSum 값이 일치하지 않아 데이터를 저장하지 않습니다. **************');
                    }
                    //winston.info(`단위위협시스템 값 ${localMakeConfirmCode} ,  로그시스템 값 ${resConfirmCode}`);
                    //winston.info('****************************** 정합성 코드가 일치합니다.*************************');
                }

                await CH_L005.parseAndInsert(res);
                let result_sect = await CH_L005_b.parseAndInsert(res);
                result = await L005.parseAndInsert(res);

                //트랜잭션 처리
                if (result instanceof Error) {
                    throw new result;
                }
                else {
                    const logRes = makejson.makeReqData_L015('L015', res.body.result.tid, result);

                    httpcall.Call('post', process.env.L015_ADDRESS, logRes, async function (err, res) {
                        if (res) {
                            await L015.parseAndInsert(res);
                        } else {
                            winston.error('************************* res 값이 없습니다. *************************');
                            winston.error('************************* L013의 트랜잭션 처리에 실패했습니다. *************************');
                        }
                    })
                }
                //단위-부문 트랜잭션, MYSQL 백업 테이블로
                if (result_sect instanceof Error) {
                    winston.error('****************** 부문 시스템과의 연결이 끊겼습니다. ******************');
                    L005_FAIL.parseAndInsert(res);
                }

            }
            else {
                winston.info('*************************** L013 응답에 body_list 가 없습니다. ***************************');
            }
        }
        else { //res값이 없을때, 응답이 없을때
            winston.error('************************* res 값이 없습니다. *************************');
            if (num === 1){
                return;
            }
            else {
                winston.info('**************************** L013 2번째 시도 ***************************');
                await L013_schedule(num - 1);
            }
        }
    })
}

exports.scheduleInsert = () => {
    schedule.scheduleJob(process.env.L005_TIME, async function() {
        await L013_schedule(2);
    })
};