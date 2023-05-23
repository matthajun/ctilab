const winston = require('../config/winston')(module);
const sequelize = require('sequelize');
const db = require('../models');
const setDateTime = require('../utils/setDateTime');

let tablePrefix = process.env.ANOMALY_TABLE_PREFIX;
let masterTableName = "";

module.exports.parseAndInsert = async function(req){
    masterTableName =  tablePrefix + 'H001_process_info';
    const time = setDateTime.setDateTime();
    const reqBodyData = {...req.body.body, ...req.body.header};
    const tableInfos = [];

    for (const [key,value] of Object.entries(reqBodyData)){
        if(Array.isArray(value)){
            let childTableInfos = [];

            for(let rowData of value){
                childTableInfos.push( {...rowData , ...req.body.header, date_time: time});
            }
            tableInfos.push({tableName:masterTableName ,tableData:childTableInfos});
        }
    }

    let rtnResult = {};
    try {
        const result = await db.sequelize.transaction(async (t) => {
            winston.info("********************************************************************************");
            winston.info("*******************query start *************************");
            for(const tableInfo of tableInfos){
                winston.debug(JSON.stringify(tableInfo));
                for(const chileTableData of tableInfo.tableData){
                    let rslt = await db[tableInfo.tableName.toUpperCase()].create(chileTableData,{ transaction: t });
                    //rslt = new Error("임의 발생");
                    if(rslt instanceof Error){
                        throw new rslt;
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
        rtnResult =  error;
    } finally {
        return rtnResult;
    }

};
