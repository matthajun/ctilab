const winston = require('../config/winston')(module);
const _ = require('loadsh');
const sequelize = require('sequelize');
const db = require('../models');
const setDateTime = require('../utils/setDateTime');

let tablePrefix = process.env.ANOMALY_TABLE_PREFIX;
let tableName = "";
let masterTableName = "";

module.exports.parseAndInsert = async function(req){
    masterTableName =  tablePrefix + req.header.message_id;
    const time = setDateTime.setDateTime();
    const reqBodyData = {...req.body.result, ...req.header, date_time: time};
    const tableInfos = [];
    const reqBodyData_Body = {...req.body};

    tableInfos.push({tableName:masterTableName, tableData:_.cloneDeep(reqBodyData)});

    for (const [key,value] of Object.entries(reqBodyData_Body)){
        if(Array.isArray(value)){
            tableName = `${masterTableName}_${key}`;
            let childTableInfos = [];
            for(let rowData of value){
                childTableInfos.push( {"file_list" : rowData, ...req.header, date_time: time});
            }
            tableInfos.push({tableName ,tableData:childTableInfos});
        }
    }

    let rtnResult = {};
    try {

        const result = await db.sequelize.transaction(async (t) => {
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