const winston = require('../config/winston')(module);
const sequelize = require('sequelize');
const db = require('../models');
const schedule = require('node-schedule');
const _ = require('loadsh');

const stixInsert = require('./stixInsert');
const {QueryTypes} = require('sequelize');

module.exports.searchAndInsert = async function() {
    schedule.scheduleJob('20 * * * * *', async function () {
        const tableName = process.env.H007;
        const stix_amly= process.env.STIX_ANOMALY;

        let rtnResult = {};
        try {
            const result = await db.sequelize.transaction(async (t) => {
                winston.info("************************* Query start ******************************");

                let rslt = await db.sequelize.query(
                    'select \'Anomaly\' as flag,keeper_id as nameAgent,send_time as timeStart,send_time as timeEnd,'+
                'unit_id as idOrganizationAgent,make_id as vendorAgent,anomaly_type as category,anomaly_type as score,'+
                'payload as original,packet_time as timeAgent,codeNM as description from dti.kdn_amly_H007 '+
                'inner join dti.motie_cmn_code on dti.kdn_amly_H007.anomaly_type=dti.motie_cmn_code.codeID '+
                'where trans_tag_a = \'C\' and dti.motie_cmn_code.gubunKey = \'anomalyType\''
                    ,{
                        type: QueryTypes.SELECT
                    }
                ).then(async users =>{
                    if(users.length) {
                        let results = {tableName: stix_amly, tableData: users};
                        await stixInsert.ParseandInsert(results);
                        await db[tableName.toUpperCase()].update({trans_tag_a: 'E'},
                            {
                                where: {
                                    trans_tag_a: 'C'
                                }
                            });
                    }
                });
                if (rslt instanceof Error) {
                    throw new rslt;
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