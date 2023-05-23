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

// 정상 완료된 전송에 대한 버전 값을 테이블에 인서트하는 모듈
module.exports.version_insert = async function(version, tableName) {
    let rtnResult = {};

    try {
        const contents = `${version.start_version}` + '\',\'' + `${version.end_verion}` + '\',\'' + `${tableName}`;

        let query = `insert into dti.motie_high_versionTable (start_version, end_version, table_name) values (\'${contents}\')`;
        let rslt = await clickhouse.query(query).toPromise();

        if (rslt instanceof Error) { //인서트 실패 시
            winston.error(rslt);
            throw new Error(rslt);
        } else { //인서트 정상 진행 시
            winston.info('INSERT to verisonTable is COMPLERTE !!! , end_version is : ' + version.end_verion);
        }
    } catch (error) {
        winston.error(error.stack);
        rtnResult = error;
    } finally {
        return rtnResult;
    }
};
