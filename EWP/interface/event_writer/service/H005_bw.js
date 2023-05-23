const winston = require('../config/winston')(module);
const _ = require('loadsh');
const sequelize = require('sequelize');
const db = require('../models');
const setDateTime = require('../utils/setDateTime');

let masterTableName = "";

module.exports.parseAndInsert = async function(req, tableName){
    masterTableName = tableName;
    const time = setDateTime.setDateTime();
    const tableInfos = [];

    for (const [key,value] of Object.entries(req.body)){
        if(Array.isArray(value)){
            let childTableInfos = [];
            for(let rowData of value){
                for(const[k,v] of Object.entries(rowData)){
                    if(Array.isArray(v)){
                        rowData[k] = v.toString();
                    }
                }
                childTableInfos.push( {...rowData , ...req.header, ...req.body, date_time:time});
            }
            tableInfos.push({tableName ,tableData:childTableInfos});
        }
    }

    let rtnResult = {};
    try {

        const result = await db.sequelize.transaction(async (t) => {
            winston.info("******************* Query start *************************");
            for(const tableInfo of tableInfos){
                //winston.debug(JSON.stringify(tableInfo));
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
        });

    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        winston.error(error.stack);
        rtnResult = error;
    } finally {
        return rtnResult;
    }
};
