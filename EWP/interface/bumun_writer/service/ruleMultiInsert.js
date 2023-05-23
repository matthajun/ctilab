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

    switch (Data.state) {
        case 'U' :
            try {
                const result = await db.sequelize.transaction(async (t) => {
                    winston.info("******************* Update start *************************");

                    //Data가 단일
                    let rslt = await db[masterTableName.toUpperCase()].upsert({
                        multiId: Data.multiId,
                        stationId: Data.stationId,
                        powerGenId: Data.powerGenId,
                        multiName: Data.multiName,
                        fstUser: Data.fstUser,
                        fstDttm: Data.fstDttm,
                        lstUser: Data.lstUser,
                        lstDttm: Data.lstDttm,
                        multiContent: Data.multiContent,
                        chk: Data.chk,
                        trans_tag: 'E',
                        state: 'E'
                    }, {id: Data.id}).then(
                        () => {
                            winston.info('upsert 완료!');
                        });

                    if (rslt instanceof Error) {
                        winston.error("************* 룰멀티 업데이트 에러 발생!! **************");
                        throw new rslt;
                    }
                });
            } catch (error) {
                // If the execution reaches this line, an error occurred.
                // The transaction has already been rolled back automatically by Sequelize!
                winston.error("************* 룰멀티 업데이트 에러 발생!! **************");
                winston.error(error.stack);
                rtnResult = error;
            } finally {
                return rtnResult;
            }

            break;

        case 'D' :
            try {
                const result = await db.sequelize.transaction(async (t) => {
                    winston.info("******************* Update start *************************");

                    //Data가 단일
                    let rslt = await db[masterTableName.toUpperCase()].upsert({
                        multiId: Data.multiId,
                        stationId: Data.stationId,
                        powerGenId: Data.powerGenId,
                        multiName: Data.multiName,
                        fstUser: Data.fstUser,
                        fstDttm: Data.fstDttm,
                        lstUser: Data.lstUser,
                        lstDttm: Data.lstDttm,
                        multiContent: Data.multiContent,
                        chk: Data.chk,
                        trans_tag: 'E',
                        state: 'DE'
                    }, {id: Data.id}).then(
                        () => {
                            winston.info('upsert 완료!');
                        });

                    if (rslt instanceof Error) {
                        winston.error("************* 룰멀티 업데이트 에러 발생!! **************");
                        throw new rslt;
                    }
                });
            } catch (error) {
                // If the execution reaches this line, an error occurred.
                // The transaction has already been rolled back automatically by Sequelize!
                winston.error("************* 룰멀티 업데이트 에러 발생!! **************");
                winston.error(error.stack);
                rtnResult = error;
            } finally {
                return rtnResult;
            }

            break;

        default:
            winston.info("******************* 룰 멀티 Insert *************************");
            if (Array.isArray(req.body.tableData)) {
                for (tableData of req.body.tableData) {
                    tableData.state = 'E';
                    tableData.trans_tag = 'E';
                }
            } else {
                req.body.tableData.state = 'E';
                tableData.trans_tag = 'E';
            }
            rtnResult = await reqInsert.parseAndInsert(req);

            break;
    }

};