const winston = require('../config/winston')(module);
const sequelize = require('sequelize');
const db = require('../models');
const makereq = require('../utils/makerequest');
const schedule = require('node-schedule');
const _ = require('loadsh');

module.exports.searchAndtransm = async function() {
    schedule.scheduleJob(process.env.LOG_TIME, async function() {
        let rtnResult = {};
        try {
            const result = await db.sequelize.transaction(async (t) => {
                let tableInfo = {};

                let tableName = process.env.LOG_SYSTEM_TABLE;

                let rslt = await db[tableName.toUpperCase()].findAll({where: {state_level: 'D'}}).then(users => {
                    if (users) {
                        for (user of users) {
                            let data = {};
                            data = user.dataValues;
                            if(data) {
                                winston.info("******************* LOG_INFO Deleted!! ************************");
                                tableInfo = {tableName: tableName, tableData: _.cloneDeep(data)};
                                makereq.highrankPush(tableInfo);
                            }
                            user.update({state_level: 'DE', state_limit: 'DE'});
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