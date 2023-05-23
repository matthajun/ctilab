const schedule = require('node-schedule');
const makejson = require('../utils/makejson');
const httpcall = require('../utils/httpCall');
const winston = require('../config/winston')(module);

const L011_ch = require('../clickhouse/L011');
const L011_ch_bu = require('../clickhouse/L011_bumun');

async function L018_schedule(num) {
    let value = makejson.makeReqData('L018');

    httpcall.Call('get', process.env.L018_ADDRESS, value,  async function (err, res) {
        if(res) {
            winston.info(JSON.stringify(res));
            let req = {body : res};

            await L011_ch.parseAndInsert(req);
            await L011_ch_bu.parseAndInsert(req);
        }
        else {
            winston.info('************************ L018의 응답이 없습니다. (실패) ***************************');
            if (num === 1){
                return;
            }
            else {
                winston.info('**************************** L018 요청을 재시도합니다. ***************************');
                await L018_schedule(num-1);
            }
        }
    })
}

exports.scheduleInsert = () => {
    schedule.scheduleJob(process.env.L018_TIME, async function() {
        await L018_schedule(2);
    })
};