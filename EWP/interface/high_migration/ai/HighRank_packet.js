const winston = require('../config/winston')(module);
const setDateTime = require('../utils/setDateTime');
const sequelize = require('sequelize');
const db = require('../models');
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

const timer = ms => new Promise(res => setTimeout(res, ms));

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

const HistoryInsert = require('../service/HistoryInsert');

module.exports.searchAndtransm = async function() {
    schedule.scheduleJob('50 * * * * *', async function() {
        let isTest = false;

        /* 실제 코드 */
        // let a_time = ''; let b_time = '';
        // const date_time = setDateTime.setDateTime_1121(7,0);
        // const version_query = `select max(end_version) as a_time from dti.motie_high_versionTable where date_time > '${date_time}' and
        //     table_name = \'motie_ai_single_packet\'`;  //인서트된 버전의 최대값
        // let version = await clickhouse.query(version_query).toPromise();  //인서트된 버전의 최대값
        // if(version[0].a_time.length) { //셀렉트 결과가 있을 때
        //     a_time = version[0].a_time;
        // }
        // else {
        //     a_time = setDateTime.setDateTime_whatago(3); //셀렉트 결과가 없으면 디폴트로 3분전 값 대입
        // }
        // b_time = setDateTime.setDateTime_whatago(2);
        // //a타임, b타임 완성 후 셀렉트 쿼리에 대입
        // const query = `select * from dti.motie_ai_single_packet where version >= '${a_time}' and version < '${b_time}'`;

        let a_time = setDateTime.setDateTime_whatago(6);
        let b_time = setDateTime.setDateTime_whatago(5);

        const query = `select * from dti.motie_ai_single_packet where version >= '${a_time}' and version < '${b_time}'`;

        /* !!!!!! 테스트전용 코드 !!!!!! */
        // isTest = true;
        //
        // let a_time = setDateTime.setDateTime_1121(150, 1);   //데이터전송테스트
        // let b_time = setDateTime.setDateTime_1121_plus(150);  //데이터전송테스트
        //
        // const query = `select * from dti.motie_ai_single_packet where version >= '${a_time}' and version < '${b_time}' `;  //데이터전송테스트

        winston.debug(query);

        let rtnResult = {};
        try {
            let tableInfo = {};
            let rslt = await clickhouse.query(query).toPromise();

            let version = {};

            //부문전송 block(11.03)처리
            for (r of rslt){
                r.ip = '';
            }

            if (rslt instanceof Error) {
                throw new Error(rslt);
            } else {
                let num = 0;

                if (!isTest) //테스트가 아닐 경우에만 version 오브젝트에 버전 값 전달
                    version = {start_version : a_time, end_verion: b_time};

                if(rslt.length > 1000){
                    //부문으로 전송하려는 데이터가 10,000건 이상일 시 빅데이터 태그값을 Y로 전송
                    winston.info('**************************** Data is transmitted , 건수 : '+ rslt.length + '건 ************************************');
                    tableInfo = {tableName: 'motie_ai_single_packet', tableData: _.cloneDeep(rslt), bigData_tag: 'Y', bigData_cnt: rslt.length};
                    makereq.highrankPush(tableInfo, null, version);
                }
                else if(rslt.length > 100){
                    winston.info('**************************** Data is transmitted , 건수 : '+ rslt.length + '건 ************************************');
                    let motherTable = rslt.division(100);

                    for(let daughtTable of motherTable){
                        tableInfo = {tableName: 'motie_ai_single_packet', tableData: _.cloneDeep(daughtTable)};
                        makereq.highrankPush(tableInfo, num, version);
                        num ++;
                        await timer(1000);
                    }
                }
                else if(rslt.length) {
                    tableInfo = {tableName: 'motie_ai_single_packet', tableData: _.cloneDeep(rslt)};
                    winston.info('**************************** Data is transmitted , 건수 : '+ rslt.length + '건 ************************************');
                    makereq.highrankPush(tableInfo, null, version);
                }
                else {
                    winston.info('**************************** 전송할 데이터가 없습니다. (결과 0건) ************************************');
                }
                //시간,테이블 별 전송 갯수 이력 추가 (22.07.13)
                HistoryInsert.history_insert(rslt.length, 'motie_ai_single_packet')
            }
        } catch (error) {
            winston.error(error.stack);
            rtnResult = error;
        } finally {
            return rtnResult;
        }
    })
};
