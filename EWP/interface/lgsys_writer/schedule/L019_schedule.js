const schedule = require('node-schedule');
const makejson = require('../utils/makejson');
const httpcall = require('../utils/httpCall');
const winston = require('../config/winston')(module);

const L009_ch = require('../clickhouse/L009');
const L009_ch_bu = require('../clickhouse/L009_bumun');

async function L019_schedule(num) {
    let value = makejson.makeReqData('L019');

    httpcall.Call('get', process.env.L019_ADDRESS, value,  async function (err, res) {
        if(res) {
            winston.info(JSON.stringify(res));
            let req = {body : res};

            await L009_ch.parseAndInsert(req);
            await L009_ch_bu.parseAndInsert(req);
        }
        else {
            winston.info('************************ L019의 응답이 없습니다. (실패) ***************************');
            if (num === 1){
                return;
            }
            else {
                winston.info('**************************** L019 요청을 재시도합니다. ***************************');
                await L019_schedule(num-1);
            }
        }
    })
}

exports.scheduleInsert = () => {
    schedule.scheduleJob(process.env.L019_TIME, async function() {
        await L019_schedule(2);
    })
};