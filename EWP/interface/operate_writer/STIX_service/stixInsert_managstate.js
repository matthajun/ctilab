const winston = require('../config/winston')(module);
const sequelize = require('sequelize');
const schedule = require('node-schedule');
const KeyChange = require('../utils/KeyChange');

const stixInsert = require('./stixInsert');
const db = require('../models');

module.exports.searchAndInsert = async function() {
    schedule.scheduleJob('35 * * * * *', async function () {
        const tableName = process.env.I003;
        const event_tableName = process.env.STIX_STATE;

        let rtnResult = {};
        try {

            const result = await db.sequelize.transaction(async (t) => {
                let rslt = db[tableName.toUpperCase()].findAll({where: {trans_tag_s: 'C'}}).then(users => {
                    if(users.length){
                        let childInfos = [];

                        for(user of users) {
                            user.update({trans_tag_s: 'E'});
                            childInfos.push(user.dataValues);
                        }
                        let results = {tableName: event_tableName, tableData: childInfos};
                        KeyChange.KeyChange_manag_state(results);
                        stixInsert.ParseandInsert(results);
                        winston.info("**************************** STIX state Complete *****************************");
                    }
                });

                if (rslt instanceof Error) {
                    throw new rslt;
                }
            })

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
