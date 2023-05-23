const schedule = require('node-schedule');
const httpcall = require('../utils/httpCall');
const H008 = require('../service/H008');
const makejson = require('../utils/makejson');
const db = require('../models');
const sequelize = require('sequelize');
const setDateTime = require('../utils/setDateTime');
const winston = require('../config/winston')(module);
const _ = require('loadsh');

const timer = ms => new Promise(res => setTimeout(res, ms));

module.exports.scheduleInsert = () => {
    schedule.scheduleJob("31 */2 * * * *", async function() {
        const before_time = setDateTime.setDateTime_ago(2);
        const long_before_time = setDateTime.setDateTime_ago(3);

        const units = process.env.HOGI_NUMBER.split(',');
        const make = ['GE', 'ABB'];

        for(u of units) {
            for (m of make) {
                let data = makejson.makeReqData_H008forTest('H008', u, m, long_before_time, before_time);
                //winston.info(JSON.stringify(data));

                httpcall.Call('post', process.env.ANOMAL_ADDRESS, data, async function (err, res) {
                    if (res) {
                        res.body.result.contents = JSON.stringify(data.body);
                        H008.parseAndInsert(res);
                    } else {
                        winston.error('************************ H008 Pcap 요청의 응답이 없습니다. ************************');
                    }

                    if (err) {
                        winston.error("****************** H008 Pcap 요청 송신 에러!**********************");
                        console.log(err);
                        return;
                    }
                });
                await timer(500);
            }
        }
    })
};