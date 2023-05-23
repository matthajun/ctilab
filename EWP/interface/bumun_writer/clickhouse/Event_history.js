const winston = require('../config/winston')(module);

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

//이벤트 AI 결과데이터 수신 -> insert 기능 부분
module.exports.parseAndInsert = async function(data) {
    let rtnResult = {};
    const contents = `${data.date_time}`+'\',\''+`${data.table_name}`+'\',\''+`${data.powergen_id}`+'\',\''+`${data.id}`;
    const query = `insert into dti.motie_ai_receive VALUES (\'${contents}\')`;

    try {
        const r = await clickhouse.query(query).toPromise();
    } catch (error) {
        winston.error(error.stack);
        rtnResult = error;
    } finally {
        return rtnResult;
    }
};
