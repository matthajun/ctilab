const winston = require('../config/winston')(module);
const setDateTime = require('../utils/setDateTime');

const {ClickHouse} = require('clickhouse');
const clickhouse = new ClickHouse({
    url: process.env.CH_ADDRESS,
    port: 8124,
    debug: false,
    basicAuth: null,
    isUseGzip: false,
    format: "json",
    config: {
        session_timeout                         : 30,
        output_format_json_quote_64bit_integers : 0,
        enable_http_compression                 : 0,
        database                                : 'dti',
    },
});

const tableName = process.env.CH_H007;

function getDigit(num) {
    num = num.toString();
    let i=0;
    while(num[i]) { i++; }
    return i;
}

module.exports.parseAndInsert = async function(req) {
    let first_date_time = setDateTime.setDateTime() + String(Math.floor(Math.random() * 1000));
    if(getDigit(first_date_time) === 16){
        first_date_time += '0';
    }
    else if (getDigit(first_date_time) === 15) {
        first_date_time += '00';
    }
    // console.log(first_date_time);
    // console.log(String(Math.floor(Math.random() * 1000)));
    let req_body = {...req.body.header, ...req.body.body, date_time: first_date_time};

    const contents = `${req_body.message_id}`+'\',\''+`${req_body.keeper_id}`+'\',\''+`${req_body.send_time}`+'\',\''+`${req_body.anomaly_seq}`+'\',\''+`${req_body.unit_id}`
        +'\',\''+`${req_body.make_id}`+'\',\''+`${req_body.anomaly_type}`+'\',\''+`${req_body.protocol_type}`+'\',\''+`${req_body.protocol_detail}`+'\',\''+`${req_body.src_ip}`+'\',\''+`${req_body.src_mac}`
        +'\',\''+`${req_body.src_port}`+'\',\''+`${req_body.dst_ip}`+'\',\''+`${req_body.dst_mac}`+'\',\''+`${req_body.dst_port}`+'\',\''+`${req_body.payload}`+'\',\''+`${req_body.packet_code}`
        +'\',\''+`${req_body.policy_name}`+'\',\''+`${req_body.packet_time}`+'\',\''+`${req_body.event_time}`+'\',\''+`${req_body.date_time}`;

    const query =
        `insert into dti.${tableName} VALUES (\'${contents}\')`
    ;

    //const sel_query = `select anomaly_type from dti.motie_amly_H007 where anomaly_seq = '${req_body.anomaly_seq}'`;

    let rtnResult = {};
    let seq ;
    try {
        // 중복 방지 로직 변경으로 인한 주석처리 (22.08.01)
        // const in_seq = await clickhouse.query(sel_query).toPromise();
        //
        // if (in_seq instanceof Error) {
        //     throw new Error(in_seq);
        // }
        // else if (in_seq.length) {
        //     winston.info("******************************** 같은 anomaly_seq 의 데이터가 있어, Insert 하지 않습니다. ( "+ req_body.anomaly_seq +" ) *********************************");
        //     seq = req_body.anomaly_seq;
        // }
        // else {
            let rslt = await clickhouse.query(query).toPromise();

            //winston.info(query);
            if (rslt instanceof Error) {
                throw new Error(rslt);
            } else {
                seq = req_body.anomaly_seq;
            }
            winston.info("******************* CH query end (정상처리) *************************");
        // }

    } catch (error) {
        winston.error(error.stack);
        rtnResult = error;
    } finally {
        if(rtnResult instanceof Error)
            return rtnResult;
        else
            return seq;
    }
};
