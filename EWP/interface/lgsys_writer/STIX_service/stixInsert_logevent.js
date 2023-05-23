const winston = require('../config/winston')(module);
const sequelize = require('sequelize');

const schedule = require('node-schedule');

const stixInsert = require('./stixInsert');
const db = require('../models');
const {QueryTypes} = require('sequelize');

module.exports.searchAndInsert = async function() {
    schedule.scheduleJob(process.env.STIX_TIME, async function () {
        const tableName = process.env.L005;
        const event_tableName = process.env.STIX_EVENT;

        let rtnResult = {};
        try {
            const result = await db.sequelize.transaction(async (t) => {
                winston.info("*******************query start *************************");

                let rslt = await db.sequelize.query(
                    'select \'Event\' as flag, plant_id as nameOperator, machine_no as nameUnit, manufacturer_name as vendorAgent,' +
                    'log_type as nameModule, log_category as categoryModule, device_id as idOrganizationAgent, device_name as nameAgent,' +
                    'loged_time as timeAgent, event_level as levelRisk, \'\' as nameAttack, sent_time as timeAttackStart, sent_time as timeAttackEnd,' +
                    'dti.motie_asset_ip.assetIp as ipAgent from dti.kdn_lgsys_L005 ' +
                    'inner join dti.motie_asset_ip on dti.kdn_lgsys_L005.device_id=dti.motie_asset_ip.deviceId where trans_tag_e= \'C\';'
                    , {
                        type: QueryTypes.SELECT
                    }
                ).then(async users => {
                    if(users.length) {
                        let results = {tableName: event_tableName, tableData: users};
                        await stixInsert.ParseandInsert(results);
                        await db[tableName.toUpperCase()].update({trans_tag_e: 'E'},
                            {
                                where: {
                                    trans_tag_e: 'C'
                                }
                            });
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