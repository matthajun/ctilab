const schedule = require('node-schedule');
const httpcall = require('../utils/httpCall');
const L005 = require('../service/L005');
const makejson = require('../utils/makejson');
const winston = require('../config/winston')(module);
const confirmutils = require('../utils/confirmutils');

let result = {};
let result_for = {};

async function L012_schedule(num) {
    let value = makejson.makeReqData_L012('L012', 1);

    result_for = httpcall.Call('get', process.env.L012_ADDRESS, value,  async function (err, res) {
        if(res) {
            const resData = res;
            const resConfirmCode = resData.body.result.checksum;
            if(resConfirmCode) {
                const localMakeConfirmCode = await confirmutils.makeConfirmCode(resData.body.list);

                if (resConfirmCode !== localMakeConfirmCode) {
                    winston.error(`우리쪽 값 ${localMakeConfirmCode} ,  받은 값 ${resConfirmCode}`);
                    throw Error('************** CheckSum 값이 일치하지 않아 데이터를 저장하지 않습니다. **************');
                }
            }

            result = await L005.parseAndInsert(res);

            let k = res.body.result.total_page;

            if (k >= 2) {
                for (let index = 2; index <= k; index++) {
                    let value_for = makejson.makeReqData_L012('L012', index);

                    httpcall.Call('get', process.env.L012_ADDRESS, value_for, async function (err, res) {
                        if (res) {
                            const resData = res;
                            const resConfirmCode = resData.body.result.checksum;
                            if(resConfirmCode) {
                                const localMakeConfirmCode = await confirmutils.makeConfirmCode(resData.body.list);

                                if (resConfirmCode !== localMakeConfirmCode) {
                                    winston.error(`우리쪽 값 ${localMakeConfirmCode} ,  받은 값 ${resConfirmCode}`);
                                    throw Error('************** CheckSum 값이 일치하지 않아 데이터를 저장하지 않습니다. **************');
                                }

                            }
                            await L005.parseAndInsert(res, index);

                            if (result_for instanceof Error) {
                                throw new Error(result_for);
                            }
                        } else {
                            winston.error('************************* index: ' + index + '번 실패 *************************');
                        }
                    })
                }
            }
            if (result instanceof Error) {
                throw new Error(result);
            }
        }
        else {
            winston.info('************************ L012의 응답이 없습니다.***************************');
            if (num === 1){
                return;
            }
            else {
                winston.info('**************************** L012 2번째 시도 ***************************');
                await L012_schedule(num - 1);
            }
        }
    })
}

exports.scheduleInsert = () => {
    schedule.scheduleJob(process.env.L012_TIME, async function() {
        winston.info('***************************** L012 1번째 시도 *****************************');
        await L012_schedule(2);
    });
};