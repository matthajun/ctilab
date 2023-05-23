const express = require('express');
const router = express.Router();
const winston = require('./config/winston')(module);
const makejson = require('./utils/makejson');
const request = require("request");
const fs = require('fs');
const schedule = require('node-schedule');
const db = require('./models');
const path = require('path');

module.exports.searchAndTrans = async function() {
    schedule.scheduleJob("*/10 * * * * *", async function () {
        let rtnResult = {};
        try {
            let tableName = 'kdn_amly_H008_file_list';
            let rslt = await db[tableName.toUpperCase()].findAll({where: {file_tag: 'C', sectValue: 'Y'}}).then(users => {
                if (users.length) {
                    winston.info('********************** 부문시스템에서 요청한 파일을 전송합니다. ************************');
                    for (user of users) {
                        let data = {};
                        data = user.dataValues;

                        const sendReq = request.post({url: process.env.BUMUN_ADDRESS_FILE, agentOptions: {rejectUnauthorized: false
                        }}, function (err, resp, body) {
                            if (err) {
                                console.log(err);
                            }
                        });

                        const form = sendReq.form();
                        form.append('my_file', fs.createReadStream(__dirname + `${path.sep}downloads${path.sep}`+data.file_list), {filename: data.file_list});
                        winston.info('********************** 전송 파일 명 : '+JSON.stringify(data.file_list));
                        user.update({file_tag: 'E'});
                    }
                }
            });
        } catch (e) {
            winston.error(e.stack);
            rtnResult = e;
        } finally {
            return rtnResult;
        }
    })
};