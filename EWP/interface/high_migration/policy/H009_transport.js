const winston = require('../config/winston')(module);
const sequelize = require('sequelize');
const db = require('../models');
const makereq = require('../utils/makerequest');
const schedule = require('node-schedule');
const _ = require('loadsh');
const makejason = require('../utils/makejson');

const tableName = 'kdn_amly_H008_file_list';

module.exports.searchAndtransm = async function() {
    schedule.scheduleJob(process.env.H009_TIME, async function() {
        let rtnResult = {};
        let array = [];

        try {
            let rslt = await db[tableName.toUpperCase()].findAll({where: {sectValue: 'Y', trans_tag:'C'}}).then(async users => {
                if (users.length) {
                    winston.info("******************* H009, 피캡파일 정보를 부문시스템으로 전송합니다. *************************");
                    for (user of users) {
                        let data = {};
                        data = user.dataValues;
                        //console.log(data);
                        let transData = makejason.makeReqData_H009(data);
                        //console.log(transData);
                        array.push(transData);
                        user.update({trans_tag: 'E'});
                    }

                    let tableInfo = {tableName: 'kdn_amly_H009', tableData: array};
                    //console.log(tableInfo)
                    makereq.highrankPush(tableInfo);
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