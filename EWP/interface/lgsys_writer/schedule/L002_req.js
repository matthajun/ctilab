const schedule = require('node-schedule');
const httpcall = require('../utils/httpCall');
const L002 = require('../service/L002');
const makejson = require('../utils/makejson');
const winston = require('../config/winston')(module);
const confirmutils = require('../utils/confirmutils');

let result = {};

async function L002_schedule(num) {
    let value = makejson.makeReqData_L002('L002');

    httpcall.Call('get', process.env.L002_ADDRESS, value,  async function (err, res) {
        if(res) {
            //console.log(JSON.stringify(res.body.list));
            const resData = res;
            const resConfirmCode = resData.body.result.checksum;
            if (resConfirmCode) {
                const localMakeConfirmCode = await confirmutils.makeConfirmCode(resData.body.list);

                if (resConfirmCode !== localMakeConfirmCode) {
                    winston.error(`우리쪽 값 ${localMakeConfirmCode} ,  받은 값 ${resConfirmCode}`);
                    throw Error('************** CheckSum 값이 일치하지 않아 데이터를 저장하지 않습니다. **************');
                }
            }

            result = await L002.parseAndInsert(res);
        }
        else {
            winston.info('************************ L002의 응답이 없습니다.***************************');
            if (num === 1){
                return;
            }
            else {
                winston.info('**************************** L002 2번째 시도 ***************************');
                await L002_schedule(num - 1);
            }
        }
    })
}

exports.scheduleInsert = () => {
    schedule.scheduleJob(process.env.L002_TIME, async function() {
        await L002_schedule(2);
    })
};
