const winston = require('../config/winston')(module);
const sequelize = require('sequelize');
const db = require('../models');
const makereq = require('../utils/makerequest');
const schedule = require('node-schedule');
const _ = require('loadsh');

module.exports.searchAndtransm = async function() {
    schedule.scheduleJob(process.env.SIG_TIME, async function() {
        let rtnResult = {};
        try {
            const result = await db.sequelize.transaction(async (t) => {
                let tableInfo = {};

                let tableName = process.env.SIGNATURE_TABLE;

                let rslt = await db[tableName.toUpperCase()].findAll({where: {state: ['C', 'U', 'D']}}).then(async users => {
                    if (users.length) {
                        for (user of users) {
                            let data = {...user.dataValues};
                            if(data) {
                                winston.info("******************* Signature update!! *************************");
                                tableInfo = {tableName: tableName, tableData: _.cloneDeep(data)};
                                makereq.highrankPush(tableInfo);
                                winston.info("********************* Signature update end *************************");
                            }
                            if(data.state === 'D')
                                await user.update({state: 'DE', trans_tag: 'E'});
                            else
                                await user.update({state: 'E', trans_tag: 'E'});
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