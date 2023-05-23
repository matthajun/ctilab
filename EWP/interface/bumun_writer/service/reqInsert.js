const winston = require('../config/winston')(module);
const sequelize = require('sequelize');
const db = require('../models');

let masterTableName = "";

module.exports.parseAndInsert = async function(req){
    masterTableName =  req.body.tableName;
    const reqBodyData = req.body.tableData;
    const tableInfos = [];

    if (Array.isArray(reqBodyData)){
        for (Data of reqBodyData){
            if (Data.trans_tag)
                delete Data.trans_tag;
        }
    }
    else {
        if (reqBodyData.trans_tag)
            delete reqBodyData.trans_tag;
    }

    tableInfos.push({tableName: masterTableName, tableData: reqBodyData});

    let rtnResult = {};
    try {
        const result = await db.sequelize.transaction(async (t) => {
            winston.info("********************************************************************************");
            winston.info("*******************query start *************************");
            for(const tableInfo of tableInfos){
                winston.debug(JSON.stringify(tableInfo));
                if(!Array.isArray(tableInfo.tableData)){ //tableData가 단일
                    let rslt = await db[tableInfo.tableName.toUpperCase()].create(tableInfo.tableData,{ transaction: t });
                    //rlst =  new Error("임의 발생");
                    if(rslt instanceof Error){
                        throw new rslt;
                    }
                }else { //tableData가 Array
                    for (const chileTableData of tableInfo.tableData) {
                        if(chileTableData.trans_tag && !chileTableData.state) {
                            delete chileTableData.trans_tag;
                        }
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
        rtnResult =  error;
    } finally {
        return rtnResult;
    }

};