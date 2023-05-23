const winston = require('../config/winston')(module);
const sequelize = require('sequelize');
const db = require('../models');
const reqInsert = require('./reqInsert');
const _ = require('loadsh');

let masterTableName = "";

module.exports.parseAndInsert = async function(req){
    winston.debug(JSON.stringify(req.body.tableData));
    masterTableName =  req.body.tableName;
    const Data = req.body.tableData;
    let rtnResult = {};

    try {
        const result = await db.sequelize.transaction(async (t) => {
            winston.info("********************************************************************************");
            winston.info("******************* Update start *************************");

            //Data가 단일
            let rslt = await db[masterTableName.toUpperCase()].upsert({
                id: Data.id,
                column: Data.column,
                keyword: Data.keyword,
                description: Data.description,
                state: Data.state,
                user: Data.user,
                trans_tag: 'E',
                dttm: Data.dttm,
                deploy: Data.deploy,
                sanGubun: Data.sanGubun
            }, {id: Data.id}).then(
                () => {
                    winston.info('upsert 완료!');
                });

            if (rslt instanceof Error) {
                winston.error("************* 정책 업데이트 에러 발생!! **************");
                throw new rslt;
            }

            winston.info("********************************************************************************");
            winston.info("******************* Update end *************************");
        });
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        winston.error("************* 정책 업데이트 에러 발생!! **************");
        winston.error(error.stack);
        rtnResult = error;
    } finally {
        return rtnResult;
    }
};