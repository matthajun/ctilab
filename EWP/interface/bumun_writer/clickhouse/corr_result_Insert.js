const winston = require('../config/winston')(module);
const setDateTime = require('../utils/setDateTime');
const Event_history = require('./Event_history');

const {ClickHouse} = require('clickhouse');
const clickhouse = new ClickHouse({
    url: process.env.CH_ADDRESS,
    port: 8125,
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

module.exports.parseAndInsert = async function(req) {
    let Array = req.body.tableData;
    let queries = [];
    const tableName = req.body.tableName;

    for(let value of Array){
        const contents = `${value.f_time}`+'\',\''+`${value.f_ip}`+'\',\''+`${value.f_type}`+'\','+`${value.f_single_rule}`
            +',\''+`${value.f_hash}`+'\',\''+`${value.f_id}`+'\',\''+`${value.f_milli_time}`+'\',\''+`${value.b_time}`+'\',\''+`${value.b_ip}`+'\',\''+`${value.b_type}`+'\','+`${value.b_single_rule}`
            +',\''+`${value.b_hash}`+'\',\''+`${value.b_id}`+'\',\''+`${value.b_milli_time}`+'\','+`${value.corr}`+','+`${value.ai_rmse}`+','+`${value.ai_rmse_scaled}`+',\''+`${value.ai_label}`+'\',\''+`${value.version}`;

        const query = `insert into dti.${tableName} VALUES (\'${contents}\')`;
        queries.push(query);
    }

    let rtnResult = {};
    try {
        winston.info("******************* CH query start *************************");
        for (const query of queries) {
            const r = await clickhouse.query(query).toPromise();
        }
        winston.info("******************* CH query end *************************");

        const data = {date_time: setDateTime.setDateTimeforEvent(), table_name: tableName, powergen_id: 'EWP', id: 'DS_001'};
        Event_history.parseAndInsert(data);
    } catch (error) {
        winston.error(error.stack);
        rtnResult = error;
    } finally {
        return rtnResult;
    }
};