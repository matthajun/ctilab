const winston = require('../config/winston')(module);
const _ = require('loadsh');
const sequelize = require('sequelize');
const db = require('../models');
const setDateTime = require('../utils/setDateTime');

let tablePrefix = process.env.LOG_TABLE_PREFIX;
let tableName = "";
let masterTableName = "";

module.exports.parseAndInsert = async function(req){
    if(req) {
        //console.log(req.body);
        masterTableName = tablePrefix + req.body.header.message_id;
        const time = setDateTime.setDateTime();
        const reqBodyData = {...req.body.body, ...req.body.header, date_time: time};
        let tableInfos = [];

        tableInfos.push({tableName: masterTableName, tableData: reqBodyData});
        let rtnResult = {};
        try {

            const result = await db.sequelize.transaction(async (t) => {
                winston.info("********************************************************************************");
                winston.info("*******************query start *************************");
                for (const tableInfo of tableInfos) {
                    winston.debug(JSON.stringify(tableInfo));
                    if (!Array.isArray(tableInfo.tableData)) {
                        let rslt = await db[tableInfo.tableName.toUpperCase()].create(tableInfo.tableData, {transaction: t});
                        //rlst =  new Error("임의 발생");
                        if (rslt instanceof Error) {
                            throw new rslt;
                        }
                    } else {
                        for (const chileTableData of tableInfo.tableData) {
                            let rslt = await db[tableInfo.tableName.toUpperCase()].create(chileTableData, {transaction: t});
                            //rslt = new Error("임의 발생");
                            if (rslt instanceof Error) {
                                throw new rslt;
                            }
                        }
                    }
                }
                winston.info("********************************************************************************");
                winston.info("*******************query end *************************");
            });

        } catch (error) {
            // If the execution reaches this line, an error occurred.
            // The transaction has already been rolled back automatically by Sequelize!
            winston.error(error.stack);
            rtnResult = error;
        } finally {
            return rtnResult;
        }
    }
};