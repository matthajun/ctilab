const schedule = require('node-schedule');
const httpcall = require('../utils/httpCall');
const L001 = require('../service/L001');
const L001_result = require('../service/L001_result');
const makejson = require('../utils/makejson');
const winston = require('../config/winston')(module);
const confirmutils = require('../utils/confirmutils');
const L001_ch = require('../clickhouse/L001');
const L001_ch_sect = require('../clickhouse/L001_sect');

const timer = ms => new Promise(res => setTimeout(res, ms));

async function L001_schedule(num) {
    let result = {};
    let result_ch = {};
    let value = makejson.makeReqData_L001('L001', 1);

    httpcall.Call('get', process.env.L001_ADDRESS, value,  async function (err, res) {
        if(res) {
            result = await L001_result.parseAndInsert(res); //result 테이블(mysql) 인서트
            winston.info(JSON.stringify(res.body.result));

            if(res.body.list) {
                //Confirm_Code 확인
                const resData = res;
                const resConfirmCode = resData.body.result.checksum;
                if(resConfirmCode) {
                    const localMakeConfirmCode = await confirmutils.makeConfirmCode(resData.body.list);

                    if (resConfirmCode !== localMakeConfirmCode) {
                        winston.error(`우리쪽 값 ${localMakeConfirmCode} ,  받은 값 ${resConfirmCode}`);
                        throw Error('************** CheckSum 값이 일치하지 않아 데이터를 저장하지 않습니다. **************');
                    }
                }
                winston.info('1' + ' 번 시도 *************************');

                result_ch = await L001_ch.parseAndInsert(res, 1);
                //await L001_ch_sect.parseAndInsert(res, 1);  //부문전송금지(11.02)
                if (result_ch instanceof Error) {
                    winston.error('******************* index: ' + index + '번 실패 *******************');
                    throw new Error(result_ch);
                }
                else {
                    winston.info("******************* 1 CH Query end *************************");
                }

                let k = res.body.result.total_page;
                if (k >= 2) {
                    for (let index = 2; index <= k; index++) {
                        value.body.page = index;
                        winston.info(index + ' 번 시도 *************************');

                        httpcall.Call('get', process.env.L001_ADDRESS, value, async function (err, res) {
                            if (res) {
                                const resData = res;
                                const resConfirmCode = resData.body.result.checksum;
                                if (resConfirmCode) {
                                    const localMakeConfirmCode = await confirmutils.makeConfirmCode(resData.body.list);

                                    if (resConfirmCode !== localMakeConfirmCode) {
                                        winston.error(`우리쪽 값 ${localMakeConfirmCode} ,  받은 값 ${resConfirmCode}`);
                                        throw Error('************** CheckSum 값이 일치하지 않아 데이터를 저장하지 않습니다. **************');
                                    }
                                }

                                result_ch = await L001_ch.parseAndInsert(res, index);
                                //await L001_ch_sect.parseAndInsert(res, index);  //부문전송금지(11.02)
                                if (result_ch instanceof Error) {
                                    winston.error('******************* index: ' + index + '번 실패 *******************');
                                    throw new Error(result_ch);
                                }
                                else {
                                    winston.info("******************* "+index+" CH Query end *************************");
                                }
                            }
                            else {
                                winston.error('******************* index: ' + index + '번 실패 *******************');
                            }
                        });
                        await timer(500);
                    }
                }
            }
            else {
                winston.info('*************************** L001(로그원본) 응답에 body_list 가 없습니다. ***************************');
            }
        }
        else {
            winston.error('************** L001응답이 없습니다. *******************');
            if (num === 1){
                return;
            }
            else {
                winston.info('***************************** L001 2번째 시도 *****************************');
                await L001_schedule(num - 1);
            }
        }
    })
}

exports.scheduleInsert = () => {
    schedule.scheduleJob(process.env.L001_TIME, async function() {
        await L001_schedule(1);
    })
};
