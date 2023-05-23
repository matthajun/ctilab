const schedule = require('node-schedule');
const db = require('../models');
const sequelize = require('sequelize');

//const H004 = require('../schedule/H004_req');
const winston = require('../config/winston')(module);
const httpcall = require('../utils/httpCall');
const H004 = require('../service/H004');
const makejson = require('../utils/makejson');

module.exports.scheduleInsert = () => {
    schedule.scheduleJob(process.env.H006_TIME, async function() {
        let rtnResult = {};

        try {
            const result = await db.sequelize.transaction(async (t) => {
                let tableName = process.env.H006;

                let rslt = await db[tableName.toUpperCase()].findAll({where: {state: 'C'}}).then(users => {
                    if (users.length) {
                        winston.info("******************* H006 Alarm is found!!! *************************");
                        for (user of users) {
                            let policy_type = user.dataValues.policy_type;
                            //H004.ResInsert(policy_type);
                            let value = makejson.makeReqData_H004('H004', policy_type);

                            httpcall.Call('post', process.env.ANOMAL_ADDRESS, value, async function (err, res) {
                                if(res) {
                                    H004.parseAndInsert(res);
                                }
                                else{
                                    winston.error('************************ H004 응답이 없습니다. ************************');
                                }
                                if (err) {
                                    winston.error("****************** H004 송신 에러!**********************");
                                }
                            });

                            user.update({state: 'E'});
                        }
                    }
                });
            });

        } catch (error) {
            // If the execution reaches this line, an error occurred.
            // The transaction has already been rolled back automatically by Sequelize!
            winston.error(error.stack);
            rtnResult = error;
        } finally {
            return rtnResult;
        }
    })
};