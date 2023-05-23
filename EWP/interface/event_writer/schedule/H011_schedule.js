const schedule = require('node-schedule');
const db = require('../models');
const sequelize = require('sequelize');

const H010 = require('../schedule/H010_req');
const winston = require('../config/winston')(module);

module.exports.scheduleInsert = () => {
    schedule.scheduleJob(process.env.H011_TIME, async function() {
        let rtnResult = {};

        try {
            const result = await db.sequelize.transaction(async (t) => {
                let tableName = process.env.H011;

                let rslt = await db[tableName.toUpperCase()].findAll({where: {state: 'C'}}).then(users => {
                    if (users.length) {
                        winston.info("******************* H011 Alarm is found!!! *************************");
                        for (user of users) {
                            H010.ResInsert();
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