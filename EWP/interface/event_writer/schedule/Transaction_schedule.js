const schedule = require('node-schedule');
const httpcall = require('../utils/httpCall');
const makejson = require('../utils/makejson');

const winston = require('../config/winston')(module);
const setDateTime = require('../utils/setDateTime');

const H014 = require('../service/H014');

const timer = ms => new Promise(res => setTimeout(res, ms));

async function H014_schedule(num) {
    winston.info('************************ H014 트랜잭션 요청을 보냅니다. ************************');
    const start_time = setDateTime.setDateTime_dayago(1);
    const end_time = setDateTime.setDateTime_ago(0);

    let data = makejson.makeReqData_H014_Transaction('H014', start_time, end_time);
    winston.info(JSON.stringify(data));

    httpcall.Call('post', process.env.ANOMAL_ADDRESS, data, async function (err, res) {
        if (res) {
            res.body.result.contents = 'Transaction 요청';
            await H014.parseAndInsert(res);
        } else {
            winston.error('************************ H014 트랜잭션 요청의 응답이 없습니다. ************************');
            let error_res = {header:{message_id:'H014', keeper_id:'EWP_01_01', send_time: setDateTime.setDateTime()},
                body:{result:{res_cd: '500', res_msg: '이상행위탐지시스템 응답 없음. (트랜잭션)', contents: JSON.stringify(data.body)}}};
            H014.parseAndInsert(error_res);

            if (num === 1) {
                return;
            } else {
                winston.info('**************************** H014 트랜잭션 요청 2번째 시도 ***************************');
                await H014_schedule(num - 1);
            }
        }
        if (err) {
            winston.error("****************** H014 트랜잭션 요청 송신 에러!**********************");
            console.log(err);
        }
    });
}

exports.scheduleInsert = () => {
    schedule.scheduleJob(process.env.TRANSACTION_TIME, async function() {
        await H014_schedule(1);
    })
};