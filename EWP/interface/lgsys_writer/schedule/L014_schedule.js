const schedule = require('node-schedule');
const db = require('../models');
const sequelize = require('sequelize');
const makejson = require('../utils/makejson');
const httpcall = require('../utils/httpCall');
const confirmutils = require('../utils/confirmutils');
const L001 = require('../service/L001');

const winston = require('../config/winston')(module);

module.exports.scheduleInsert = () => {
    schedule.scheduleJob(process.env.L014_TIME, async function() {
        let rtnResult = {};
        try {
                let tableName = 'kdn_lgsys_L014';
                let result = {};

                let rslt = await db[tableName.toUpperCase()].findAll({where: {state: 'C'}}).then(users => {
                    if (users.length) {
                        winston.info("******************* L014 Alarm is found!!! *************************");
                        for (user of users) {
                            user.update({state: 'E'});

                            let value = makejson.makeReqData_L003('L003');
                            winston.debug(JSON.stringify(value));
                            httpcall.Call('get', process.env.L003_ADDRESS, value, async function (err, res) {
                                if(res) {
                                    const resData = res;
                                    const resConfirmCode = resData.body.result.checksum;
                                    if(resConfirmCode) {
                                        const localMakeConfirmCode = await confirmutils.makeConfirmCode(resData.body.list);

                                        if (resConfirmCode !== localMakeConfirmCode) {
                                            winston.error(`우리쪽 값 ${localMakeConfirmCode} ,  받은 값 ${resConfirmCode}`);
                                            throw Error('************** CheckSum 값이 일치하지 않아 데이터를 저장하지 않습니다. **************');
                                        }

                                        result = await L001.parseAndInsert(res);

                                        if (result instanceof Error) {
                                            throw new Error(result);
                                        }
                                    }
                                }
                                else{
                                    winston.error('************************* L003 res 값이 없습니다. *************************');
                                }
                            })
                        }
                    }
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