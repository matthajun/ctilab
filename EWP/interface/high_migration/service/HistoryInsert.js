const winston = require('../config/winston')(module);
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

module.exports.history_insert = async function(number, tableName) {
    try {
        const contents = `${number}` + '\',\'' + `${tableName}`;

        let query = `insert into dti.motie_high_history (number, table_name) values ('${contents}')`;
        let rslt = await clickhouse.query(query).toPromise();

        if (rslt instanceof Error) { //인서트 실패 시
            winston.error(rslt);
            throw new Error(rslt);
        } else { //인서트 정상 진행 시
            winston.info("******************* 상위연계 송신 이력 저장 성공! *******************");
        }
    } catch (error) {
        winston.error(error.stack);
    }
};
