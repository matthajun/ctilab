const winston = require('../config/winston')(module);
const sequelize = require('sequelize');
const schedule = require('node-schedule');

const stixInsert = require('./stixInsert');
const db = require('../models');
const {QueryTypes} = require('sequelize');

module.exports.searchAndInsert = async function() {
    schedule.scheduleJob('22 * * * * *', async function () {
        const tableName = process.env.H007;
        const event_tableName = process.env.STIX_EVENT;

        let rtnResult = {};
        try {

            const result = await db.sequelize.transaction(async (t) => {
                winston.info("************************* Query start ******************************");

                let rslt = await db.sequelize.query(
                    'SELECT \'Event\' as flag, packet_time as timeAgent, keeper_id as nameAgent, make_id as vendorAgent, unit_id as idOrganizationAgent, ' +
                'anomaly_type as name, packet_time as timeAttackStart, packet_time as timeAttackEnd, src_ip as ipAttacker, dst_ip as ipVictim, ' +
                'src_mac as macAttacker, dst_mac as macVictim, src_port as portAttacker, dst_port as portVictim, protocol_type as protocol, ' +
                'anomaly_type as levelRisk FROM dti.kdn_amly_H007 where trans_tag_e = \'C\' '
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