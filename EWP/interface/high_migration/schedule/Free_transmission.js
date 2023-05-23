const winston = require('../config/winston')(module);
const setDateTime = require('../utils/setDateTime');
const _ = require('loadsh');
const schedule = require('node-schedule');
const makereq = require('../utils/makerequest');
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

module.exports.searchAndtransm = async function() {
    schedule.scheduleJob('0 */5 * * * *', async function() { //스케쥴 5분지정!!!!!!!
        let rtnResult = {};

        try {
            const date_time = setDateTime.setDateTime_whatago(5); //스케쥴 5분지정!!!!!!!
            const query = `select * from dti.motie_high_freeTrans where date_time > '${date_time}' order by date_time desc limit 1`;
            let rslt = await clickhouse.query(query).toPromise();

            if(rslt.length) {// 임의전송 테이블에 정보가 인서트되어 있을때
                let start_time = rslt[0].start_time; let end_time = rslt[0].end_time;
                let table_name = rslt[0].table_name; let data_query = '';
                winston.info('!!!!!!!!!!!!!!!!!!!!! 임의전송 로직을 시작합니다. !!!!!!!!!!!!!!!!!!!!!');
                winston.info(' start_time : ' + start_time + ' ~ end_time : ' + end_time + ' , table_name : ' + table_name);
                switch (table_name) {
                    case 'motie_ai_corr_result_v2':
                        data_query = `select * from dti.motie_ai_corr_result_v2 where f_time >= '${start_time}' and f_time < '${end_time}'`;
                        break;

                    default:
                        data_query = `select * from dti.${table_name} where time >= '${start_time}' and time < '${end_time}'`;
                        break;
                }
                //console.log(data_query);
                let data_rslt = await clickhouse.query(data_query).toPromise();

                if(data_rslt.length) {
                    winston.info('!!!!!!!!!!!!!!!!!!!!! 임의전송 건수 : ' + data_rslt.length + '건 !!!!!!!!!!!!!!!!!!!!!');
                    let tableInfo = {
                        tableName: table_name,
                        tableData: _.cloneDeep(data_rslt),
                        bigData_tag: 'Y',
                        bigData_cnt: data_rslt.length
                    };
                    makereq.highrankPush(tableInfo, null);
                }
                else {
                    winston.info('***************************** 요청하신 시간의 데이터가 0건입니다. *****************************');
                }
            }
            else {// 임의전송 테이블에 정보가 없음
                winston.info('***************************** 임의전송 정보가 테이블에 없습니다. *****************************');
            }
        } catch (error) {
        winston.error(error.stack);
        rtnResult = error;
        } finally {
            return rtnResult;
        }
    })
};
