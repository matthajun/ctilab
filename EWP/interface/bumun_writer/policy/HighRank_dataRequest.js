const winston = require('../config/winston')(module);
const sequelize = require('sequelize');
const db = require('../models');
const makereq = require('../utils/makerequest');
const schedule = require('node-schedule');
const _ = require('loadsh');

module.exports.searchAndtransm = async function() {
    schedule.scheduleJob(process.env.REQUEST_TIME, async function() {
        let rtnResult = {};
        try {
            const result = await db.sequelize.transaction(async (t) => {
                let tableInfo = {};

                let tableName = process.env.DATA_REQUEST_TABLE;

                let rslt = await db[tableName.toUpperCase()].findAll({where: {state: '200'}}).then(async users => {
                    if (users.length) {
                        for (user of users) {
                            await user.update({state: '201', stateValue: '200'});
                            let data = {};
                            data = user.dataValues;
                            if(data) {
                                winston.info("******************* DateRequest update!! *************************");
                                tableInfo = {tableName: tableName, tableData: _.cloneDeep(data)};
                                makereq.highrankPush(tableInfo);
                                winston.info("********************* DateRequest update end *************************");
                            }
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