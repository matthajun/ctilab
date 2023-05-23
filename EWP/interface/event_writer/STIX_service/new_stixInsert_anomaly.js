const winston = require('../config/winston')(module);
const Sequelize = require('sequelize');
const db = require('../models');
const schedule = require('node-schedule');

const stixInsert = require('./stixInsert');
const {QueryTypes} = require('sequelize');
const setDateTime = require('../utils/setDateTime');
const Op = Sequelize.Op;

module.exports.searchAndInsert = async function() {
    schedule.scheduleJob('20 * * * * *', async function () {
        const stix_amly= process.env.STIX_ANOMALY;
        const tableName = process.env.H007;
        let seqs = [];

        let rtnResult = {};
        try {
            let rslt = await db.sequelize.query(
                `select \'Anomaly\' as flag, anomaly_seq, keeper_id as nameAgent,send_time as timeStart,send_time as timeEnd, ` +
                `unit_id as idOrganizationAgent,make_id as vendorAgent,anomaly_type as category, ` +
                `payload as original,packet_time as timeAgent,codeNM as description from dti.kdn_amly_H007 ` +
                `inner join dti.motie_cmn_code on dti.kdn_amly_H007.anomaly_type=dti.motie_cmn_code.codeID ` +
                `where trans_tag_a = \'C\'`
                ,{
                    type: QueryTypes.SELECT
                }
                ).then(async users =>{
                    if(users.length) {
                        winston.info("************************* Query start (Anomaly) ******************************");
                        let results = {tableName: stix_amly, tableData: users};
                        await stixInsert.ParseandInsert(results);

                        for(user of users){
                            seqs.push(user.anomaly_seq);
                        }

                        let max_seq = Math.max.apply(null,seqs);
                        await db[tableName.toUpperCase()].update({trans_tag_a: 'E'},
                            {
                                where: {
                                    trans_tag_a: 'C',
                                    anomaly_seq: {
                                        [Op.lte]: max_seq
                                    }
                                }
                            });
                    }
                    else {
                        winston.info("************************* STIX 이벤트 데이터가 없습니다. (Anomaly) ******************************");
                    }
                });
            if (rslt instanceof Error) {
                throw new rslt;
            }

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