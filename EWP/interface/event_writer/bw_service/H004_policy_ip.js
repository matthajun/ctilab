const winston = require('../config/winston')(module);
const sequelize = require('sequelize');

const schedule = require('node-schedule');
const db = require('../models');

module.exports.searchAndInsert = async function() {
    schedule.scheduleJob('54 * * * * *', async function () {
        let rtnResult = {};
        try {
            const result = await db.sequelize.transaction(async (t) => {
                let rslt = await db[process.env.IP_TABLE.toUpperCase()].findAll({attributes: [['make_id', 'make'], 'ip', ['unit_id', 'unit']], where: {trans_tag_bw:'C'}})
                    .then(async users => {
                        if (users.length) {
                            for(user of users){
                                const data = user.dataValues;
                                if(data.make.includes('ABB'))
                                    data.make = 'ABB';
                                else if (data.make.includes('GE_GT'))
                                    data.make = 'GE';
                                data.unit = data.unit.charAt(data.unit.length-1);

                                const tableData = {...data, type: 1, name: '수집 화이트리스트', stationId: 'DS', powerGenId: 'DS_001', fstUser: 'interface', lstUser: 'interface', state: 'I'};

                                await db[process.env.BW_LIST_TABLE.toUpperCase()].findAll({where: {make: data.make, ip: data.ip, state: ['E','I','C'], deploy: 'Y', type: 1}}).
                                then(async users => {
                                    if(!users.length){
                                        winston.info("******************* New Whitelist is found!!! *************************");
                                        await db[process.env.BW_LIST_TABLE.toUpperCase()].create(tableData);
                                    }
                                });

                                await user.update({trans_tag_bw: 'E'});
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