const winston = require('../config/winston')(module);
const setDateTime = require('../utils/setDateTime');

const {ClickHouse} = require('clickhouse');
const clickhouse = new ClickHouse({
    host: process.env.CH_ADDRESS,
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

const tableName = 'motie_lgsys_L001';


module.exports.parseAndInsert = async function(res, index) {
    //winston.info("******************* CH Query start *************************");

    let rtnResult = {};
    try {
        for (let list of res.body.list) {
            let value = {};
            value = {
                message_id: res.header.message_id, ...list,
                sent_time: res.body.sent_time,
                date_time: setDateTime.setDateTime()
            };
            let raw_re = value.raw.replace(/'/gi,"");

            const contents = `${value.message_id}` +'\',\'' + `${value.plant_id}` + '\',\'' + `${value.plant_name}`
                + '\',\'' + `${value.machine_no}` + '\',\'' + `${value.manufacturer_name}` + '\',\'' + `${value.log_type}` + '\',\'' + `${value.log_category}`
                + '\',\'' + `${value.format}` + '\',\'' + `${value.device_id}` + '\',\'' + `${value.device_name}` + '\',\'' + `${value.loged_time}`
                + '\',\'' + `${value.type01}` + '\',\'' + `${value.type02}` + '\',\'' + `${value.type03}` + '\',\'' + `${value.code01}` + '\',\'' + `${value.code02}`
                + '\',\'' + `${value.code03}` + '\',\'' + `${value.value01}` + '\',\'' + `${value.value02}` + '\',\'' + `${value.value03}`
                + '\',\'' + `${value.value04}` + '\',\'' + `${value.value05}` + '\',\'' + `${value.value06}` + '\',\'' + `${value.value07}`
                + '\',\'' + `${value.content01}` + '\',\'' + `${value.content02}` + '\',\'' + `${value.content03}`
                + '\',\'' + raw_re + '\',\'' + `${value.sent_time}` + '\',\'' + `${value.date_time}`;

            const query = `insert into dti.${tableName} VALUES (\'${contents}\')`;

            const result = await clickhouse.query(query).toPromise();

            if (result instanceof Error) {
                throw new Error(result);
            }
        }
        //winston.info("******************* "+index+" CH Query end *************************");
    } catch (error) {
        winston.error(error.stack);
        rtnResult = error;
    } finally {
        return rtnResult;
    }
};