const winston = require('../config/winston')(module);
const db = require('../models');
const setDateTime = require('../utils/setDateTime');

let tablePrefix = process.env.LOG_TABLE_PREFIX;
let tableName = "";
let masterTableName = "";

module.exports.parseAndInsert = async function(res){
    let tableInfos = [];
    let childTableInfos = [];
    const time = setDateTime.setDateTime();

    masterTableName = tablePrefix + res.header.message_id;
    tableName = `${masterTableName}_result`;

    childTableInfos.push({...res.header, ...res.body.result, date_time: time});
    tableInfos.push({tableName, tableData: childTableInfos});

    let rtnResult = {};

    try {
        for (const tableInfo of tableInfos) {
            //winston.debug(JSON.stringify(tableInfo));

            for (const chileTableData of tableInfo.tableData) {
                let rslt = await db[tableInfo.tableName.toUpperCase()].create(chileTableData);

                if (rslt instanceof Error) {
                    throw new rslt;
                }
            }

        }
        winston.info("******************* Query end *************************");
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        winston.error(error.stack);
        rtnResult = error;
    } finally {
        return rtnResult;
    }
};