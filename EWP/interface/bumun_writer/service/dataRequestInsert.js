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
            winston.info("******************* Upsert start *************************");

            let rslt = await db[masterTableName.toUpperCase()].upsert({
                id: Data.id,
                type: Data.type,
                gubun: Data.gubun,
                powerGenId: Data.powerGenId,
                unitId: Data.unitId,
                makeId: Data.makeId,
                deviceId: Data.deviceId,
                startTime: Data.startTime,
                endTime: Data.endTime,
                state: Data.state,
                stateValue: Data.stateValue,
                fstUser: Data.fstUser,
                fstDttm: Data.fstDttm,
                stationId: Data.stationId
            }, {id: Data.id}).then(
                () => {
                    winston.info('upsert 완료!');
                });

            if (rslt instanceof Error) {
                winston.error("************* 데이터요청 업데이트 에러 발생!! **************");
                throw new rslt;
            }

            winston.info("********************************************************************************");
            winston.info("******************* Update end *************************");
        });
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        winston.error("************* 데이터요청 업데이트 에러 발생!! **************");
        winston.error(error.stack);
        rtnResult = error;
    } finally {
        return rtnResult;
    }
};