const winston = require('../config/winston')(module);
const _ = require('loadsh');
const sequelize = require('sequelize');
const db = require('../models');
const setDateTime = require('../utils/setDateTime');

let masterTableName = "";

module.exports.parseAndInsert = async function(req){
    masterTableName =  'motie_fail_H007';
    const time = setDateTime.setDateTime();
    const reqBodyData = {...req.body.body, ...req.body.header, date_time: time};
    const tableInfos = [];

    tableInfos.push({tableName:masterTableName, tableData:_.cloneDeep(reqBodyData)});

    let rtnResult = {};
    try {
        const result = await db.sequelize.transaction(async (t) => {
            winston.info("*******************query start *************************");
            for(const tableInfo of tableInfos){
                winston.debug(JSON.stringify(tableInfo));
                if(!Array.isArray(tableInfo.tableData)){
                    let rslt = await db[tableInfo.tableName.toUpperCase()].create(tableInfo.tableData,{ transaction: t });
                    //rlst =  new Error("임의 발생");
                    if(rslt instanceof Error){
                        throw new rslt;
                    }
                }else{
                    for(const chileTableData of tableInfo.tableData){
                        let rslt = await db[tableInfo.tableName.toUpperCase()].create(chileTableData,{ transaction: t });
                        //rslt = new Error("임의 발생");
                        if(rslt instanceof Error){
                            throw new rslt;
                        }
                    }
                }
            }
            winston.info("*******************query end *************************");
        });
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        winston.error(error.stack);
        rtnResult = error;
    } finally {
        if(rtnResult instanceof Error)
            return rtnResult;
    }
};