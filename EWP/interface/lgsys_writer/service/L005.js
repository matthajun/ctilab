const winston = require('../config/winston')(module);
const _ = require('loadsh');
const sequelize = require('sequelize');
const db = require('../models');
const setDateTime = require('../utils/setDateTime');

let tablePrefix = process.env.LOG_TABLE_PREFIX;
let tableName = "";
let masterTableName = "";
let tranArray = [];

module.exports.parseAndInsert = async function(req){
    if(req) {
        masterTableName = tablePrefix + req.header.message_id;
        const time = setDateTime.setDateTime();
        const reqBodyData = {...req.body, ...req.header};
        let tableInfos = [];

        if (req.body.list) {
            for (const [key, value] of Object.entries(reqBodyData)) {
                if (Array.isArray(value)) {
                    tableName = `${masterTableName}`;
                    let childTableInfos = [];

                    for (let rowData of value) {
                        for (const [k, v] of Object.entries(rowData)) {
                            if (k === 'event_info') {
                                rowData[k] = JSON.stringify(v);
                            }
                        }
                        childTableInfos.push({
                            ...rowData, ...req.header, ...req.body, ...req.body.result,
                            date_time: time
                        });
                    }
                    if(tableName === 'kdn_lgsys_L013') {
                        tableInfos.push({tableName: 'kdn_lgsys_L005', tableData: childTableInfos});
                    }
                    else {
                        tableInfos.push({tableName, tableData: childTableInfos});
                    }
                }
            }
        } else {
            winston.error('**********************  '+req.header.message_id+'  body.list 가 없습니다. *****************************');
        }

        let rtnResult = {};
        try {

            const result = await db.sequelize.transaction(async (t) => {
                let rslt = {};
                winston.info("******************* "+req.header.message_id+" query start *************************");
                for (const tableInfo of tableInfos) {
                    //winston.debug(JSON.stringify(tableInfo));
                    if (!Array.isArray(tableInfo.tableData)) {
                        rslt = await db[tableInfo.tableName.toUpperCase()].create(tableInfo.tableData, {transaction: t});
                    } else {
                        for (const chileTableData of tableInfo.tableData) {
                            rslt = await db[tableInfo.tableName.toUpperCase()].create(chileTableData, {transaction: t});
                            //rslt = new Error("임의 발생");
                            if (rslt instanceof Error) {
                                throw new rslt;
                            }
                            else {
                                tranArray.push(chileTableData.normal_seq);
                            }
                        }
                    }
                }
                winston.info("******************* "+req.header.message_id+" query end *************************");
            });

        } catch (error) {
            // If the execution reaches this line, an error occurred.
            // The transaction has already been rolled back automatically by Sequelize!
            winston.error(error.stack);
            rtnResult = error;
        } finally {
            if(Object.keys(rtnResult).length) {
                return rtnResult;
            }
            else{
                return tranArray;
            }
        }
    }
};