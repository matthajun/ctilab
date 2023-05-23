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

module.exports.searchAndtransm = async function() {
    schedule.scheduleJob('0 * * * * *', async function() {
        const time = setDateTime.setDateTime_Twoago_high(4);
        const time_after =setDateTime.setDateTime_ago2(3,1);
        const query = `select splitByChar('_', hash)[2] as hash from dti.motie_ai_op_result where version between '${time}' and '${time_after}' and ai_label = 'True' `;
        //winston.info(query);

        let rtnResult = {};
        try {
            let tableInfo = {};
            const hashes = await clickhouse.query(query).toPromise();

            if (hashes instanceof Error) {
                throw new Error(hashes);
            }
            else if (hashes.length) {
                winston.info('**************************** I002 이벤트 데이터 발견! ************************************');
                winston.info('**************************** 갯수: '+hashes.length+'개 ************************************');
                let hash = '';

                for(h of hashes){
                    hash += '\''+ h.hash +'\'';
                }
                let hash2 = hash.replace(/''/gi,"','");

                //console.log(hash2);
                const date_time = setDateTime.setDateTime_ago(10);
                const op_query = `select * from (select * ,  toString(sipHash64(c.*)) hash from dti.motie_manag_I002 c where date_time > '${date_time}') where hash in (${hash2}) `;
                //console.log(op_query);
                const result = await clickhouse.query(op_query).toPromise();
                //console.log(result);
                if(result.length > 500){
                    winston.info('******************************** Value 갯수가 500개가 넘었습니다. ********************************');
                    let motherTable = result.division(500);

                    for(let daughtTable of motherTable){
                        tableInfo = {tableName: 'motie_manag_I002', tableData: _.cloneDeep(daughtTable)};
                        makereq.highrankPush(tableInfo);
                    }
                }
                else if(result.length) {
                    tableInfo = {tableName: 'motie_manag_I002', tableData: _.cloneDeep(result)};
                    winston.info('**************************** Data is transmitted ************************************');
                    makereq.highrankPush(tableInfo);
                }
            }
            else {
                winston.info('**************************** 1분간 탐지된 운영 이벤트가 없습니다. ***********************************');
            }
        } catch (error) {
            winston.error(error.stack);
            rtnResult = error;
        } finally {
            return rtnResult;
        }
    })
};