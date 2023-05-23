const httpcall = require('./httpCall');
const winston = require('../config/winston')(module);

const L015 = require('../service/L015');

module.exports.Transaction = function (message_id, tid, seq) {
    let Address = '';
    let req_id = '';
    let Transaction_req = {};

    if(message_id === 'L009') {
        req_id = 'L017';
        Address = process.env.L017_ADDRESS;
    }
    else if (message_id === 'L011') {
        req_id = 'L016';
        Address = process.env.L016_ADDRESS;
    }

    const HeaderData = {message_id: req_id, logger_id: ''};
    const BodyData = {tid: tid, seq_array:seq};

    Transaction_req.header = HeaderData;
    Transaction_req.body = BodyData;

    winston.info('********************** 확인된 seq 를 전송합니다. **********************');
    winston.info(JSON.stringify(Transaction_req));

    httpcall.Call('post', Address, Transaction_req, async function(err, res){
        if(res) {
            winston.info(JSON.stringify(res));
            L015.parseAndInsert(res);
        }
        else {
            winston.info('********************** res, 응답이 없습니다. **********************')
        }
    })
};