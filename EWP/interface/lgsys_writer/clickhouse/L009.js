const winston = require('../config/winston')(module);
const setDateTime = require('../utils/setDateTime');

const {ClickHouse} = require('clickhouse');
const clickhouse = new ClickHouse({
    host: process.env.CH_ADDRESS,
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

const tableName = process.env.CH_L009;

module.exports.parseAndInsert = async function(req) {
    let Array = [];
    let queries = [];

    if(req.body.body.alarm_array) {
        for (let list of req.body.body.alarm_array) {
            let req_body = {};
            req_body = {
                message_id: req.body.header.message_id, ...list,
                tid: req.body.body.tid,
                date_time: setDateTime.setDateTime()
            };
            Array.push(req_body);
        }
        for (let value of Array) {
            const contents = `${value.message_id}` + '\',\'' + `${value.tid}` + '\',\'' + `${value.seq}` + '\',\'' + `${value.plant_id}` + '\',\'' + `${value.machine_no}`
                + '\',\'' + `${value.manufacturer_id}` + '\',\'' +`${value.device_id}` + '\',\'' + `${value.msg}` + '\',\'' + `${value.loged_time}` + '\',\'' + `${value.date_time}`;

            const query = `insert into dti.${tableName} VALUES (\'${contents}\')`;
            queries.push(query);
        }
    }
    else{
        //winston.error('****************** body.list가 없습니다. ******************************')
    }

    let rtnResult = {};
    try {
        if(queries.length) {
            winston.info("******************* CH query start *************************");
            for (const query of queries) {
                const r = await clickhouse.query(query).toPromise();
            }
            winston.info("******************* CH query end *************************");
        }
    } catch (error) {
        winston.error(error.stack);
        rtnResult = error;
    } finally {
        return rtnResult;
    }
};