const httpcall = require('./httpCall');
const winston = require('../config/winston')(module);
const setTime = require('../utils/setDateTime');
const db = require('../models');
const confirmutils = require('./confirmutils');

module.exports.highrankPush = async function(value) {
    let confirmCode = confirmutils.makeConfirmCode(value.tableData);
    value.confirm_code = confirmCode;

    httpcall.Call('post', process.env.DANWI_ADDRESS, value, async function (err, res) {
        winston.info("*************************** "+value.tableName+" is transmitted to Unit-System *****************************");

        if(Array.isArray(value.tableData)) {
            for (tableData of value.tableData) {
                let data = {
                    date_time: setTime.setDateTimeforHistory(),
                    tableName: value.tableName,
                    tableData: JSON.stringify(tableData)
                };
                await db['MOTIE_TRANSMISSION_HISTORY'].create(data);
            }
        }
        else {
            let data = {
                date_time: setTime.setDateTimeforHistory(),
                tableName: value.tableName,
                tableData: JSON.stringify(value.tableData)
            };
            await db['MOTIE_TRANSMISSION_HISTORY'].create(data);
        }

        if (err instanceof Error) {
            throw new Error(err);
        }
    });
};