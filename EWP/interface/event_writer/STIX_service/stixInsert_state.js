const winston = require('../config/winston')(module);
const sequelize = require('sequelize');
const schedule = require('node-schedule');

const stixInsert = require('./stixInsert');
const db = require('../models');
const {QueryTypes} = require('sequelize');

module.exports.searchAndInsert = async function() {
    schedule.scheduleJob('24 * * * * *', async function () {
        const tableName = process.env.H002;
        const event_tableName = process.env.STIX_STATE;

        let rtnResult = {};
        try {
            await db.sequelize.transaction(async (t) => {
                let rslt = await db[tableName.toUpperCase()].findAll({attributes: [['send_time', 'timeAgent'],
                        ['keeper_id', 'nameAgent'], 'usageCPU', 'usageMemory', 'usageDisk'], where: {trans_tag_s: 'C'},
                        transaction: t}).then(async users => {
                            if(users.length) {
                                winston.info("************************* STIX_STATE Query start ******************************");
                                for(user of users) {
                                    let data = {...user.dataValues};

                                    data.flag = 'State';
                                    if(data.nameAgent === 'EWP_01_01') {
                                        data.ipAgent = process.env.ANOMAL_ADDRESS.split('/')[2].split(':')[0];
                                        data.location = '당진화력발전소';
                                        data.idOrganizationAgent = '';
                                        data.original = '';
                                    }


                                    let results = {tableName: event_tableName, tableData: data};

                                    let rslt = await stixInsert.ParseandInsert(results);
                                    if (rslt instanceof Error){
                                        throw new rslt;
                                    }
                                    else {
                                        user.update({trans_tag_s: 'E'})
                                    }
                                }
                                winston.info("************************* STIX_STATE Query End ******************************");
                            }
                })
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