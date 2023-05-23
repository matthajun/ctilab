const winston = require('../config/winston')(module);
const _ = require('loadsh');
const sequelize = require('sequelize');
const db = require('../models');
const setDateTime = require('../utils/setDateTime');

let tablePrefix = process.env.ANOMALY_TABLE_PREFIX;
let masterTableName = "";

module.exports.parseAndInsert = async function(req){
    masterTableName =  tablePrefix + req.header.message_id;
    const time = setDateTime.setDateTime();
    const reqBodyData = {...req.body.result, ...req.header, date_time: time, event: req.body.event_cnt};
    const tableInfos = [];

    tableInfos.push({tableName:masterTableName, tableData:_.cloneDeep(reqBodyData)});

    let rtnResult = {};
    try {
        for(const tableInfo of tableInfos){
            winston.debug(JSON.stringify(tableInfo));
            if(!Array.isArray(tableInfo.tableData)){
                let rslt = await db[tableInfo.tableName.toUpperCase()].create(tableInfo.tableData);
                //rlst =  new Error("임의 발생");
                if(rslt instanceof Error){
                    throw new rslt;
                }
            }else{
                for(const chileTableData of tableInfo.tableData){
                    let rslt = await db[tableInfo.tableName.toUpperCase()].create(chileTableData);
                    //rslt = new Error("임의 발생");
                    if(rslt instanceof Error){
                        throw new rslt;
                    }
                }
            }
        }
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        winston.error(error.stack);
        rtnResult =  error;
    } finally {
        return rtnResult;
    }
};
