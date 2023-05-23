const winston = require('../config/winston')(module);
const _ = require('loadsh');
const sequelize = require('sequelize');
const db = require('../models');
const setDateTime = require('../utils/setDateTime');

let tableName = "";
let masterTableName = "";
let tranArray = [];

module.exports.parseAndInsert = async function(req){
    if(req) {
        masterTableName = 'motie_fail_L005';
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

                    tableInfos.push({tableName, tableData: childTableInfos});
                }
            }
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