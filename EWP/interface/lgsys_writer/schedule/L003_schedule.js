const schedule = require('node-schedule');
const httpcall = require('../utils/httpCall');
const L001 = require('../service/L001');
const makejson = require('../utils/makejson');
const winston = require('../config/winston')(module);
const confirmutils = require('../utils/confirmutils');

let result = {};

async function L003_schedule(num) {
    let value = makejson.makeReqData_L003('L003');

    httpcall.Call('get', process.env.L003_ADDRESS, value, async function (err, res) {
        if(res.body.list) {
            const resData = res;
            const resConfirmCode = resData.body.result.checksum;
            if(resConfirmCode) {
                const localMakeConfirmCode = await confirmutils.makeConfirmCode(resData.body.list);

                if (resConfirmCode !== localMakeConfirmCode) {
                    winston.error(`우리쪽 값 ${localMakeConfirmCode} ,  받은 값 ${resConfirmCode}`);
                    throw Error('************** CheckSum 값이 일치하지 않아 데이터를 저장하지 않습니다. **************');
                }

                result = await L001.parseAndInsert(res);

                if (result instanceof Error) {
                    throw new Error(result);
                }
            }
        }
        else{
            winston.error('************************* L003 res 값이 없습니다. *************************');
            if (num === 1){
                return;
            }
            else {
                winston.info('**************************** L003 2번째 시도 ***************************');
                await L003_schedule(num - 1);
            }
        }
    })
}

exports.scheduleInsert = () => {
    schedule.scheduleJob(process.env.L003_TIME, async function() {
        await L003_schedule(2);
    })
};
