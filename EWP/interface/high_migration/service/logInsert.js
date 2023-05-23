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

    switch (Data.state_level) {
        case 'U' :
            try {
                const result = await db.sequelize.transaction(async (t) => {
                    winston.info("********************************************************************************");
                    winston.info("******************* Update start *************************");

                    //Data가 단일
                    let rslt = await db[masterTableName.toUpperCase()].upsert({id: Data.id, stationId:Data.stationId, powerGenId: Data.powerGenId, assetNm: Data.assetNm,
                        cpuNotice:Data.cpuNotice, cpuWarning: Data.cpuWarning, memoryNotice: Data.memoryNotice, memoryWarning: Data.memoryWarning, diskNotice: Data.diskNotice, diskwarning: Data.diskwarning,
                        levelLow: Data.levelLow, levelHight: Data.levelHight, content: Data.content, fstUser: Data.fstUser, lstUser: Data.lstUser, fstDttm: Data.fstDttm, lstDttm: Data.lstDttm,
                        state_level: 'U', state_limit: 'U', trans_tag: 'E', sanGubun: Data.sanGubun},{id: Data.id}).then(
                        () => {
                            winston.info('upsert 완료!');
                        });

                    if(rslt instanceof Error){
                        winston.error("************* 로그임계치 업데이트 에러 발생!! **************");
                        throw new rslt;
                    }

                    winston.info("********************************************************************************");
                    winston.info("******************* Update end *************************");
                });
            } catch (error) {
                // If the execution reaches this line, an error occurred.
                // The transaction has already been rolled back automatically by Sequelize!
                winston.error("************* 로그임계치 업데이트 에러 발생!! **************");
                winston.error(error.stack);
                rtnResult =  error;
            } finally {
                return rtnResult;
            }

            break;

        case 'D' :
            try {
                const result = await db.sequelize.transaction(async (t) => {
                    winston.info("********************************************************************************");
                    winston.info("******************* Delete start *************************");

                    //Data가 단일
                    let rslt = await db[masterTableName.toUpperCase()].upsert({id: Data.id, stationId:Data.stationId, powerGenId: Data.powerGenId, assetNm: Data.assetNm,
                        cpuNotice:Data.cpuNotice, cpuWarning: Data.cpuWarning, memoryNotice: Data.memoryNotice, memoryWarning: Data.memoryWarning, diskNotice: Data.diskNotice, diskwarning: Data.diskwarning,
                        levelLow: Data.levelLow, levelHight: Data.levelHight, content: Data.content, fstUser: Data.fstUser, lstUser: Data.lstUser, fstDttm: Data.fstDttm, lstDttm: Data.lstDttm,
                        state_level: 'DE', state_limit: 'DE', trans_tag: 'E', sanGubun: Data.sanGubun},{id: Data.id}).then(
                        () => {
                            winston.info('딜리트 완료!');
                        }
                    );

                    if(rslt instanceof Error){
                        winston.error("************* 로그임계치 딜리트 에러 발생!! **************");
                        throw new rslt;
                    }

                    winston.info("********************************************************************************");
                    winston.info("******************* Delete end *************************");
                });

            } catch (error) {
                // If the execution reaches this line, an error occurred.
                // The transaction has already been rolled back automatically by Sequelize!
                winston.error("************* 로그임계치 업데이트 에러 발생!! **************");
                winston.error(error.stack);
                rtnResult =  error;
            } finally {
                return rtnResult;
            }

            break;

        default:
            if (Array.isArray(req.body.tableData)) {
                for (tableData of req.body.tableData) {
                    tableData.state_limit = 'C';
                    tableData.state_level = 'C';
                    tableData.trans_tag = 'E';
                }
            }
            else {
                req.body.tableData.state_limit = 'C';
                req.body.tableData.state_level = 'C';
                tableData.trans_tag = 'E';
            }
            rtnResult = await reqInsert.parseAndInsert(req);

            break;
    }
};