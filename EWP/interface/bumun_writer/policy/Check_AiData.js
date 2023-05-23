const winston = require('../config/winston')(module);
const setDateTime = require('../utils/setDateTime');
const _ = require('loadsh');
const schedule = require('node-schedule');

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

Array.prototype.division = function (n) {
    let arr = this;
    let len = arr.length;
    let cnt = Math.floor(len / n) + (Math.floor(len % n) > 0 ? 1 : 0);
    let tmp = [];

    for (let i = 0; i < cnt; i++) {
        tmp.push(arr.splice(0, n));
    }

    return tmp;
};

const timer = ms => new Promise(res => setTimeout(res, ms));

module.exports.searchAndRun = async function() {
    schedule.scheduleJob('10 * * * *', async function() { // 매 시간 10분마다 해당 삭제 스케쥴이 실행
        let rtnResult = {};
        let data = [];

        try {
            winston.info('*************************** 중복데이터 삭제 스케쥴 실행 ***************************');
            const tables = ['motie_ai_single_log', 'motie_ai_single_packet'];
            const a_schedule_version = setDateTime.setDateTime_1121(0,180);
            const b_schedule_version = setDateTime.setDateTime_1121(0,60);

            for(let table of tables) {
                const count_query = `select count() as cnt from dti.${table} where version >= '${a_schedule_version}'
                    and version < '${b_schedule_version}'`; //console.log(count_query);
                data = await clickhouse.query(count_query).toPromise();
                winston.debug('+++++++++++++ 중복 데이터 삭제 실행 전 데이터 건수 : ' + data[0].cnt + ', Data : '
                    + table.replace('motie_ai_single_', ''));


                /* 삭제 실행 */
                let delete_query = `alter table dti.${table} delete
                where concat(hash, toString(version)) in (
                select concat(hash, max(toString(version)))
                from dti.motie_ai_single_packet
                where hash in (
                select hash
                from dti.motie_ai_single_packet
                where time >= '${a_schedule_version}'
                and time < '${b_schedule_version}'
                group by hash
                having count() > 1
                )
                group by hash
                )`;
                winston.debug('+++++++++++++ a_version  ~  b_version : ' + a_schedule_version + ' ~ ' + b_schedule_version);
                let dele = await clickhouse.query(delete_query).toPromise();

                data = await clickhouse.query(count_query).toPromise();
                winston.debug('+++++++++++++ 중복 데이터 삭제 실행 후 데이터 건수 : ' + data[0].cnt + ', Data : '
                    + table.replace('motie_ai_single_', ''));
            }
        } catch (error) {
            winston.error(error.stack);
            rtnResult = error;
        } finally {
            return rtnResult;
        }
    })
};
