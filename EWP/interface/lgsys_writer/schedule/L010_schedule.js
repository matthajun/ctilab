const schedule = require('node-schedule');
const httpcall = require('../utils/httpCall');
const L004 = require('../service/L004');
const makejson = require('../utils/makejson');
const db = require('../models');
const sequelize = require('sequelize');
const setDateTime = require('../utils/setDateTime');
const winston = require('../config/winston')(module);
const _ = require('loadsh');
const makereq = require('../utils/makerequest');

module.exports.scheduleInsert = () => {
    schedule.scheduleJob(process.env.L010_TIME, async function() {
        let rtnResult = {};
        let signature_array = [];

        try {
            const result = await db.sequelize.transaction(async (t) => {
                let tableName = process.env.SIGNATURE_TABLE;
                let rslt = await db[tableName.toUpperCase()].findAll({attributes: ['id', 'column', 'keyword', 'description', 'state', 'user', 'deploy', 'dttm', 'sanGubun'],
                    where: {state: ['C','U','D']}})
                    .then(async users => {
                        if (users.length) {
                            winston.info("******************* L010 Request is found!!! *************************");
                            for (user of users) {
                                let data = {...user.dataValues};
                                let result = {};

                                if (data.state === 'C') {
                                    let child_data = {who: data.sanGubun, column: data.column.toLowerCase(), keyword: data.keyword, description: data.description, status: data.deploy, deleted: 10 };
                                    signature_array.push(child_data);
                                    await user.update({state: 'E'});
                                }
                                else if (data.state === 'U') {
                                    let tableInfo = {tableName: 'motie_signature', tableData: data};
                                    //makereq.highrankPush(tableInfo);  //부문전송금지(11.02)

                                    let child_data = {who: data.sanGubun, column: data.column.toLowerCase(), keyword: data.keyword, description: data.description, status: data.deploy, deleted: 10 };
                                    signature_array.push(child_data);
                                    await user.update({state: 'E'});
                                }
                                else if (data.state === 'D') {
                                    result = await user.update({state: 'DE'});
                                    data.state = 'DE';

                                    if (result instanceof Error) {
                                        throw new Error(result);
                                    }
                                    else {
                                        let tableInfo = {tableName: 'motie_signature', tableData: data};
                                        //makereq.highrankPush(tableInfo);  //부문전송금지(11.02)
                                    }

                                    let child_data = {who: data.sanGubun, column: data.column.toLowerCase(), keyword: data.keyword, description: data.description, status: data.deploy, deleted: 20 };
                                    signature_array.push(child_data);
                                }
                            }

                            let value = makejson.makeReqData_L010('L010', signature_array);
                            winston.debug(JSON.stringify(value));

                            httpcall.Call('POST', process.env.L010_ADDRESS, value, async function (err, res) {
                                if (res) {
                                    let history = {...res};
                                    history.body.contents = JSON.stringify(value);
                                    L004.parseAndInsert(history);
                                } else {
                                    winston.error('************************* res 값이 없습니다. *************************');
                                    let history = {header:{message_id: 'L010'}, body:{result:{}, res_cd: '500', res_msg: '로그 분석 시스템 응답 없음', contents: JSON.stringify(value.body),
                                            sent_time: setDateTime.setDateTime(), date_time: setDateTime.setDateTime()}};
                                    L004.parseAndInsert(history);
                                    console.log(err);
                                }
                                if (err) {
                                    winston.error("****************** L010 송신 에러!**********************");
                                    console.log(err);
                                }
                            });
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
