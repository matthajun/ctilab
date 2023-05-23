const winston = require('../config/winston')(module);
const setDateTime = require('../utils/setDateTime');
const _ = require('loadsh');
const schedule = require('node-schedule');

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

module.exports.searchAndRun = async function() {
    schedule.scheduleJob('10 */10 * * * *', async function() { // 매 10분마다 해당 삭제 스케쥴이 실행
        let rtnResult = {};
        let data = [];

        try {
            winston.info('*************************** 중복데이터 삭제 스케쥴 실행 ***************************');
            const tables = ['motie_amly_H007'];
            const a_schedule_time = setDateTime.setDateTime_220727(1);
            const b_schedule_time = setDateTime.setDateTime_220727(0,0);

            for(let table of tables) {
                const count_query = `select count() as cnt from dti.${table} where date_time >= '${a_schedule_time}'
                    and date_time < '${b_schedule_time}'`; //console.log(count_query);
                data = await clickhouse.query(count_query).toPromise();

                /* 삭제 실행 */
                let delete_query = `alter table dti.${table} delete
                where concat(anomaly_seq, toString(date_time)) in (
                select concat(anomaly_seq, max(toString(date_time)))
                from dti.${table}
                where anomaly_seq in (
                select anomaly_seq
                from dti.${table}
                where date_time >= '${a_schedule_time}'
                -- and date_time < '${b_schedule_time}'
                group by anomaly_seq
                having count() > 1
                )
                group by anomaly_seq
                )`;
                winston.debug(delete_query);
                winston.debug('+++++++++++++ 중복 데이터 삭제 실행 전 데이터 건수 : ' + data[0].cnt);
                winston.debug('+++++++++++++ time coverage : '
                    + a_schedule_time.substr(0,4) + '.' + a_schedule_time.substr(4,4) + '.' + a_schedule_time.substr(8,6)
                    + ' ~ '
                    + b_schedule_time.substr(0,4) + '.' + b_schedule_time.substr(4,4) + '.' + b_schedule_time.substr(8,6));
                let dele = await clickhouse.query(delete_query).toPromise();

                setTimeout(async () =>{
                    data = await clickhouse.query(count_query).toPromise();
                    winston.debug('+++++++++++++ 중복 데이터 삭제 실행 후 데이터 건수 : ' + data[0].cnt);
                },5000);
            }
        } catch (error) {
            winston.error(error.stack);
            rtnResult = error;
        } finally {
            return rtnResult;
        }
    })
};

