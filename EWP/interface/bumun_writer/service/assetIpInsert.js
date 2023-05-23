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
                    winston.info("********************************************************************************");
                    winston.info("******************* Update start *************************");

                    let rslt = await db[masterTableName.toUpperCase()].upsert({id: Data.id, assetId: Data.assetId, assetIp: Data.assetIp, keeperKey: Data.keeperKey,
                        unitId: Data.unitId, makeId: Data.makeId, powerGenId: Data.powerGenId, plantId: Data.plantId, deviceId: Data.deviceId, fstUser: Data.fstUser,
                        fstDttm: Data.fstDttm, lstUser: Data.lstUser,  lstDttm: Data.lstDttm,
                        trans_tag: 'E', state: 'C'},{assetId: Data.assetId}).then(
                        () => {
                            winston.info('upsert 완료!');
                        });

                    if(rslt instanceof Error){
                        winston.error("************* 자산 업데이트 에러 발생!! **************");
                        throw new rslt;
                    }

                    winston.info("********************************************************************************");
                    winston.info("******************* Update end *************************");
                });
            } catch (error) {
                // If the execution reaches this line, an error occurred.
                // The transaction has already been rolled back automatically by Sequelize!
                winston.error("************* 자산 업데이트 에러 발생!! **************");
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

                    let rslt = await db[masterTableName.toUpperCase()].upsert({id: Data.id, assetId: Data.assetId, assetIp: Data.assetIp, keeperKey: Data.keeperKey,
                        unitId: Data.unitId, makeId: Data.makeId, powerGenId: Data.powerGenId, plantId: Data.plantId, deviceId: Data.deviceId, fstUser: Data.fstUser,
                        fstDttm: Data.fstDttm, lstUser: Data.lstUser,  lstDttm: Data.lstDttm,
                        trans_tag: 'E', state: 'D'},{assetId: Data.assetId}).then(
                        () => {
                            winston.info('딜리트 완료!');
                        }
                    );

                    if(rslt instanceof Error){
                        winston.error("************* 자산 딜리트 에러 발생!! **************");
                        throw new rslt;
                    }

                    winston.info("********************************************************************************");
                    winston.info("******************* Delete end *************************");
                });

            } catch (error) {
                // If the execution reaches this line, an error occurred.
                // The transaction has already been rolled back automatically by Sequelize!
                winston.error("************* 자산 업데이트 에러 발생!! **************");
                winston.error(error.stack);
                rtnResult =  error;
            } finally {
                return rtnResult;
            }

            break;

        default:
            if (Array.isArray(req.body.tableData)) {
                for (tableData of req.body.tableData) {
                    tableData.state = 'C';
                    tableData.trans_tag = 'E';
                }
            }
            else {
                req.body.tableData.state = 'C';
                req.body.tableData.trans_tag = 'E';
            }
            rtnResult = await reqInsert.parseAndInsert(req);

            break;
    }
};