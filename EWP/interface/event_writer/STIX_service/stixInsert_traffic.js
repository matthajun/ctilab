const winston = require('../config/winston')(module);
const sequelize = require('sequelize');
const schedule = require('node-schedule');

const stixInsert = require('./stixInsert');
const db = require('../models');

module.exports.searchAndInsert = async function() {
    schedule.scheduleJob('26 * * * * *', async function () {
        const tableName = process.env.H012;
        const event_tableName = process.env.STIX_TRAFFIC;

        let rtnResult = {};
        try {
            const result = await db.sequelize.transaction(async (t) => {
                winston.info("************************* Query start ******************************");

                let rslt = await db[tableName.toUpperCase()].findAll({attributes: [['send_time', 'timeAgent'],
                         ['keeper_id', 'nameAgent'], ['make_id', 'vendorAgent'], ['unit_id', 'idOrganizationAgent'], ['packet_cnt', 'ppsTotal'],
                        ['inbound_cnt', 'bpsTotal'], ['packet_byte', 'inData'], ['inbound_byte', 'inPacket']], where: {trans_tag_t: 'C'}}).then(async users => {
                    if(users.length){
                        for(user of users) {
                            let data = {...user.dataValues};
                            data.flag = 'Traffic';
                            if(data.nameAgent === 'EWP_01_01') {
                                data.ipAgent = process.env.ANOMAL_ADDRESS.split('/')[2].split(':')[0];
                                data.location = '당진화력발전소';
                                data.original = '';
                            }
                            if(!data.outData)
                                data.outData = '';
                            if(!data.outPacket)
                                data.outPacket = '';

                            let results = {tableName: event_tableName, tableData: data};

                            let rslt = await stixInsert.ParseandInsert(results);
                            if (rslt instanceof Error){
                                throw new rslt;
                            }
                            else {
                                user.update({trans_tag_t: 'E'})
                            }
                        }
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