const schedule = require('node-schedule');
const db = require('../models');

const winston = require('../config/winston')(module);
const { Op } = require("sequelize");
const setDateTime = require('../utils/setDateTime');

module.exports.scheduleInsert = () => {
    schedule.scheduleJob('19 19 4 * * *', async function() {  //삭제 스케쥴 설정(매일 04:19:19 작동)
        let rtnResult = {};
        try {
            let tableName = 'kdn_amly_H009';
            let two_month_time = setDateTime.setDateTime_H009(2); // 2달전 데이터 삭제 설정 부분

            let rslt = await db[tableName.toUpperCase()].destroy({where: {date_time: {[Op.lt]: two_month_time}}}).then(() => {
                winston.info('********** '+two_month_time+' 이전의 Pcap(패킷 전수) 데이터 - H009 테이블 를 삭제합니다. ************************')
            });
        }
        catch (error) {
            // If the execution reaches this line, an error occurred.
            // The transaction has already been rolled back automatically by Sequelize!
            winston.error(error.stack);
            rtnResult = error;
        } finally {
            return rtnResult;
        }
    })
};