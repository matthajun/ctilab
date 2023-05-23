const schedule = require('node-schedule');
const httpcall = require('../utils/httpCall');
const makejson = require('../utils/makejson');

const winston = require('../config/winston')(module);
const setDateTime = require('../utils/setDateTime');

const H014 = require('../service/H014');

const timer = ms => new Promise(res => setTimeout(res, ms));

async function H014_schedule(num, day) {
    winston.info('************************ H014 트랜잭션 요청을 보냅니다. ************************');
    const start_time = setDateTime.setDateTime_dayago3(day);
    const end_time = setDateTime.setDateTime_dayago2(day);
    winston.info('**************************** 요청하는 날짜 : ' + start_time.substring(4,8));

    let data = makejson.makeReqData_H014_Transaction('H014', start_time, end_time);
    winston.info(JSON.stringify(data));

    httpcall.Call('post', process.env.ANOMAL_ADDRESS, data, async function (err, res) {
        if (res) {
            res.body.result.contents = 'Transaction 임의요청 ' + JSON.stringify(data.body);
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

let day_ago = 15;  // x일 전 데이터를
let day_until = 1;  // x일치 만
let day_same = day_ago;

exports.scheduleInsert = () => {
    schedule.scheduleJob(process.env.TRANSACTION_TIME_OPTION, async function() {
        if(day_ago > day_same - day_until) {
            await H014_schedule(1, day_ago);
            day_ago--;
        }
    })
};