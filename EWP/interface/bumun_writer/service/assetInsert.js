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

                    let rslt = await db[masterTableName.toUpperCase()].upsert({assetId: Data.assetId, assetNm: Data.assetNm, stationId:Data.stationId, powerGenId: Data.powerGenId,
                        hostInfo:Data.hostInfo, mnufcturCor: Data.mnufcturCor, assetType: Data.assetType, assetProtocol: Data.assetProtocol, assetSnNum: Data.assetSnNum, assetFirmwareVer: Data.assetFirmwareVer,
                        assetModelNm: Data.assetModelNm, assetPosition: Data.assetPosition, assetHogiCode: Data.assetHogiCode, assetHighClassCode: Data.assetHighClassCode, assetClassCode: Data.assetClassCode,
                        responsibilityUser: Data.responsibilityUser, operatorUser: Data.operatorUser, operatorDeptId: Data.operatorDeptId, acquireDate: Data.acquireDate, assetUseYsno: Data.assetUseYsno,
                        assetMacAddr: Data.assetMacAddr, assetImportanceId: Data.assetImportanceId, os: Data.os, fstUser: Data.fstUser, fstDttm: Data.fstDttm, lstUser: Data.lstUser,  lstDttm: Data.lstDttm,
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

                    let rslt = await db[masterTableName.toUpperCase()].upsert({assetId: Data.assetId, assetNm: Data.assetNm, stationId:Data.stationId, powerGenId: Data.powerGenId,
                        hostInfo:Data.hostInfo, mnufcturCor: Data.mnufcturCor, assetType: Data.assetType, assetProtocol: Data.assetProtocol, assetSnNum: Data.assetSnNum, assetFirmwareVer: Data.assetFirmwareVer,
                        assetModelNm: Data.assetModelNm, assetPosition: Data.assetPosition, assetHogiCode: Data.assetHogiCode, assetHighClassCode: Data.assetHighClassCode, assetClassCode: Data.assetClassCode,
                        responsibilityUser: Data.responsibilityUser, operatorUser: Data.operatorUser, operatorDeptId: Data.operatorDeptId, acquireDate: Data.acquireDate, assetUseYsno: Data.assetUseYsno,
                        assetMacAddr: Data.assetMacAddr, assetImportanceId: Data.assetImportanceId, os: Data.os, fstUser: Data.fstUser, fstDttm: Data.fstDttm, lstUser: Data.lstUser,  lstDttm: Data.lstDttm,
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
                }
            }
            else {
                req.body.tableData.state = 'C';
            }
            rtnResult = await reqInsert.parseAndInsert(req);

            break;
    }
};