const winston = require('../config/winston')(module);
const schedule = require('node-schedule');
const httpcall = require('../utils/httpCall');
const makejson = require('../utils/makejson');

const sequelize = require('sequelize');
const db = require('../models');
const setTime = require('../utils/setDateTime');

exports.SelectTransmit = () => {
    schedule.scheduleJob('5 */5 * * * *', function() {
        const tableName = process.env.STIX_ANOMALY;

        const result = db.sequelize.transaction(async (t) => {
            let rslt = await db[tableName.toUpperCase()].findAll({where: {trans_tag : 'C'}}).then(users => {
                if(users){
                    for (user of users) {
                        user.update({trans_tag: 'E'});
                        let selectedData = user.dataValues;
                        let value = makejson.makeSTIXData_anomaly(selectedData);

                        httpcall.Call('post', process.env.SANGWI_ADDRESS, value, async function (err, res) {
                            let data = {
                                date_time: setTime.setDateTimeforHistory(),
                                tableName: 'Anomaly',
                                tableData: JSON.stringify(value)
                            };
                            await db['MOTIE_STIX_HISTORY'].create(data);
                        });
                    }
                }
            });
            if(rslt instanceof Error){
                throw new Error(rslt);
            }
        });
    })
};