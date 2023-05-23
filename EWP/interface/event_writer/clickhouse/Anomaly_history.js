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

const tableName = 'motie_amly_history';
const setDateTime = require('../utils/setDateTime');

module.exports.history_parseAndInsert = async function(req, reply) {
    const contents = JSON.stringify(req) + '\' ,\'' + JSON.stringify(reply);

    const query =
        `insert into dti.${tableName} (req, reply) VALUES ('${contents}')`
    ;

    try {
        const result = await clickhouse.query(query).toPromise();
        if (result instanceof Error) {
            throw new Error(result);
        }
        else {
            winston.info("******************* 이상행위 이벤트  수신 이력 저장 성공! *************************");

            const query2 = `alter table dti.${tableName} delete where date_time < '${setDateTime.setDateTimeforAnomalyHistory(5)}'`
            ;
            winston.info("******************* 이력 삭제 쿼리 : "+JSON.stringify(query2));

            const result2 = await clickhouse.query(query2).toPromise();
            if (result2 instanceof Error) {
                throw new Error(result2);
            }
            else {
                winston.info("******************* 이상행위 이벤트  수신 이력 삭제 성공! (5개월 이전) *************************");
            }
        }

    } catch (error) {
        winston.error(error.stack);
    }
};
