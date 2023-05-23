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
    let state = '200';

    try {
        const result = await db.sequelize.transaction(async (t) => {
            winston.info("******************* Upsert start *************************");

            //피캡파일 요청 시 부문 플래그값 예외처리
            if(Data.gubun === 'MORE_P'){
                Data.sectValue = 'Y'
            }

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
                state: state,
                stateValue: Data.stateValue,
                fstUser: Data.fstUser,
                fstDttm: Data.fstDttm,
                stationId: Data.stationId,
                sectValue: Data.sectValue
            }, {id: Data.id}).then(
                () => {
                    winston.info('upsert 완료!');
                });

            if (rslt instanceof Error) {
                winston.error("************* 데이터요청 업데이트 에러 발생!! **************");
                throw new rslt;
            }
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