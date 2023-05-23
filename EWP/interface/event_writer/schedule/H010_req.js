const httpcall = require('../utils/httpCall');
const H010 = require('../service/H010');
const makejson = require('../utils/makejson');
const winston = require('../config/winston')(module);

let result = {};

async function H010_schedule(num) {
    let value = makejson.makeReqData('H010');

    httpcall.Call('post', process.env.ANOMAL_ADDRESS, value, async function (err, res) {
        if(res) {
            result = await H010.parseAndInsert(res);
        }
        else {
            winston.info('************************ H010 응답이 없습니다. ************************');
            if (num === 1){
                return;
            }
            else {
                winston.info('**************************** H010 2번째 시도 ***************************');
                await H010_schedule(num - 1);
            }
        }
    });
}

module.exports.ResInsert = async function(){
    await H010_schedule(2);
};
