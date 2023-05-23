const schedule = require('node-schedule');
const httpcall = require('../utils/httpCall');
const H014 = require('../service/H014');
const makejson = require('../utils/makejson');
const db = require('../models');
const sequelize = require('sequelize');
const setDateTime = require('../utils/setDateTime');
const winston = require('../config/winston')(module);
const _ = require('loadsh');
const makereq = require('../utils/makerequest');

module.exports.scheduleInsert = () => {
    schedule.scheduleJob(process.env.H014_TIME, async function() {
        let rtnResult = {};

        try {
            const result = await db.sequelize.transaction(async (t) => {
                let tableName = process.env.DATA_REQUEST_TABLE;

                let rslt = await db[tableName.toUpperCase()].findAll({where: {gubun:'MORE_E', state:'200'}})
                    .then(async users => {
                    if (users.length) {
                        winston.info("******************* H014 Request is found!!! *************************");
                        for (user of users) {
                            let data = {};
                            data = {...user.dataValues};

                            let value = makejson.makeReqData_H014('H014', data, '1');
                            winston.debug(JSON.stringify(value));

                            httpcall.Call('post', process.env.ANOMAL_ADDRESS, value, async function (err, res) {
                                if(res) {
                                    res.body.result.contents = JSON.stringify(value.body);
                                    await H014.parseAndInsert(res);

                                    if(res.body.result.res_cd === '00') {
                                        await user.update({state: '201', stateValue: '201'});
                                        user.dataValues.state = '201'; user.dataValues.stateValue = '201';
                                        winston.info('************** 상태값 201로 업데이트! ****************');
                                    }
                                    else if (res.body.result.res_cd === '51'){
                                        await user.update({state: '201', stateValue: '204'});
                                        user.dataValues.state = '201'; user.dataValues.stateValue = '204';
                                        winston.info('************** 상태값 204로 업데이트! ****************');
                                    }
                                    else if (res.body.result.res_cd === '99'){
                                        await user.update({state: '201', stateValue: '408'});
                                        user.dataValues.state = '201'; user.dataValues.stateValue = '408';
                                        winston.info('************** 상태값 408로 업데이트! ****************');
                                    }
                                    else {
                                        await user.update({state: '201', stateValue: '404'});
                                        user.dataValues.state = '201'; user.dataValues.stateValue = '404';
                                    }
                                }
                                else{
                                    let error_res = {header:{message_id:'H014', keeper_id:'EWP_01_01', send_time: setDateTime.setDateTime()},
                                        body:{result:{res_cd: '500', res_msg: '이상행위탐지시스템 응답 없음.', contents: JSON.stringify(value.body)}}};
                                    H014.parseAndInsert(error_res);

                                    await user.update({state: '500', stateValue: '404'});
                                    user.dataValues.state = '500'; user.dataValues.stateValue = '404';
                                    winston.info('************** 상태값 500로 업데이트! ****************');
                                    winston.error('*************************** 응답이 없습니다. ****************************');
                                }
                            });
                            setTimeout(function() {
                                //부문으로 생성,업데이트
                                winston.debug('*************** H014 부문으로 전송 ***************');
                                winston.debug(JSON.stringify(user.dataValues));
                                let tableInfo = {tableName: 'motie_data_request', tableData: user.dataValues};
                                //makereq.highrankPush(tableInfo);  //부문전송금지(11.02)
                            },400)
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