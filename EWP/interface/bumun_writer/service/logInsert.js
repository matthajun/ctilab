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
                        state_level: 'E', state_limit: 'E', trans_tag: 'E', stateValue: Data.stateValue, deploy: Data.deploy, sanGubun: Data.sanGubun},{id: Data.id}).then(
                        () => {
                            winston.info('upsert 완료!');
                        });

                    if(rslt instanceof Error){
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
                        state_level: 'DE', state_limit: 'DE', trans_tag: 'E', stateValue: Data.stateValue, sanGubun: Data.sanGubun},{id: Data.id}).then(
                        () => {
                            winston.info('딜리트 완료!');
                        }
                    );

                    if(rslt instanceof Error){
                        winston.error("************* 정책 딜리트 에러 발생!! **************");
                        throw new rslt;
                    }

                    winston.info("********************************************************************************");
                    winston.info("******************* Delete end *************************");
                });

            } catch (error) {
                // If the execution reaches this line, an error occurred.
                // The transaction has already been rolled back automatically by Sequelize!
                winston.error("************* 정책 업데이트 에러 발생!! **************");
                winston.error(error.stack);
                rtnResult =  error;
            } finally {
                return rtnResult;
            }

            break;

        case 'C' :
            try {
                const result = await db.sequelize.transaction(async (t) => {
                    winston.info("********************************************************************************");
                    winston.info("******************* Creation start *************************");

                    //Data가 단일
                    let rslt = await db[masterTableName.toUpperCase()].upsert({id: Data.id, stationId:Data.stationId, powerGenId: Data.powerGenId, assetNm: Data.assetNm,
                        cpuNotice:Data.cpuNotice, cpuWarning: Data.cpuWarning, memoryNotice: Data.memoryNotice, memoryWarning: Data.memoryWarning, diskNotice: Data.diskNotice, diskwarning: Data.diskwarning,
                        levelLow: Data.levelLow, levelHight: Data.levelHight, content: Data.content, fstUser: Data.fstUser, lstUser: Data.lstUser, fstDttm: Data.fstDttm, lstDttm: Data.lstDttm,
                        state_level: 'E', state_limit: 'E', trans_tag: 'E', stateValue: Data.stateValue, sanGubun: Data.sanGubun},{id: Data.id}).then(
                        () => {
                            winston.info('생성 완료!');
                        }
                    );

                    if(rslt instanceof Error){
                        winston.error("************* 정책 생성 에러 발생!! **************");
                        throw new rslt;
                    }

                    winston.info("********************************************************************************");
                    winston.info("******************* Creation end *************************");
                });

            } catch (error) {
                // If the execution reaches this line, an error occurred.
                // The transaction has already been rolled back automatically by Sequelize!
                winston.error("************* 정책 생성 에러 발생!! **************");
                winston.error(error.stack);
                rtnResult =  error;
            } finally {
                return rtnResult;
            }

            break;

        default:
            if (Array.isArray(req.body.tableData)) {
                for (tableData of req.body.tableData) {
                    tableData.state_limit = 'E';
                    tableData.state_level = 'E';
                }
            }
            else {
                req.body.tableData.state_limit = 'E';
                req.body.tableData.state_level = 'E';
            }
            rtnResult = await reqInsert.parseAndInsert(req);

            break;
    }
};