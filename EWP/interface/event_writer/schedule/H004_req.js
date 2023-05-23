const httpcall = require('../utils/httpCall');
const H004 = require('../service/H004');
const makejson = require('../utils/makejson');
const winston = require('../config/winston')(module);

async function H004_schedule(num, policy_type) {
    let value = makejson.makeReqData_H004('H004', policy_type);

    httpcall.Call('post', process.env.ANOMAL_ADDRESS, value, async function (err, res) {
        if(res) {
            H004.parseAndInsert(res);
        }
        else{
            //winston.error('************************ H004 응답이 없습니다. ************************');
            if (num === 1){
                return;
            }
            else {
                winston.info('**************************** H004 2번째 시도 ***************************');
                await H004_schedule(num - 1);
            }
        }
        if (err) {
            winston.info("****************** H004 송신 에러!**********************");
        }
    });
}

module.exports.ResInsert = async function(policy_type){
    await H004_schedule(2, policy_type);
};
