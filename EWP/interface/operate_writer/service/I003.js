const winston = require('../config/winston')(module);
const _ = require('loadsh');
const sequelize = require('sequelize');
const db = require('../models');
const setDateTime = require('../utils/setDateTime');

let tablePrefix = process.env.MANAG_TABLE_PREFIX;
let tableName = "";
let masterTableName = "";

module.exports.parseAndInsert = async function(req){
    masterTableName =  tablePrefix + req.body.header.message_id;
    const time = setDateTime.setDateTime();
    let tableInfos = [];

    let disk_usage;
    let cpu_usage;
    let memory_usage;
    let memory_capacity;

    for (const [key,value] of Object.entries(req.body.body)){

        tableName = `${masterTableName}_${key}`;

        switch(key) {
            case 'disk_info':
                let a = 0;
                let b = 0;
                for (let rowData of value){
                    a += Number(rowData.total_size);
                    b += Number(rowData.use_size);
                }
                disk_usage = b/a*100;

                let childTableInfos2 = [];
                for(let rowData of value){
                    for(const[k,v] of Object.entries(rowData)){
                        if(Array.isArray(v)){
                            rowData[k] = v.toString();
                        }
                    }
                    childTableInfos2.push( {...rowData , ...req.body.header, date_time:time});
                }
                tableInfos.push({tableName ,tableData:childTableInfos2});
                break;

            case 'cpu_info':
                cpu_usage = value.usage;
                break;

            case 'memory_info':
                memory_usage = value.usage;
                memory_capacity = value.capacity;
                break;
        }
    }

    const usageBodyData = {...req.body.body, ...req.body.header, date_time:time, usageCPU: cpu_usage, usageMemory: memory_usage, Memory_capacity: memory_capacity, usageDisk: disk_usage};
    tableInfos.push({tableName:masterTableName, tableData:_.cloneDeep(usageBodyData)});

    let rtnResult = {};
    try {
        const result = await db.sequelize.transaction(async (t) => {
            winston.info("********************************************************************************");
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