const os = require("os");
const hostname = os.hostname();
const _ = require("lodash");
const loopback = require('../server');
const moment = require('moment');
const slogger = require("../../common/logger/serverLogger");
const Schedule = loopback.models['Schedule'];
/*
매분마다 스케줄러 검색하는 방식으로 변경
*/
const ns = require('node-schedule');
let cronExp = makeCronExp(-1, -1, -1, -1, -1, -1);

function makeCronExp(min,hour,day,month,weekday,year) {
    let cronExp = [];

    cronExp.push(min === '-1' || min === null ? '*' : min);
    cronExp.push(hour === '-1' || hour === null ? '*' : hour);
    cronExp.push(day === '-1' || day === null ? '*' : day);
    cronExp.push(month === '-1' || month === null ? '*' : month);
    cronExp.push(weekday === '-1' || weekday === null ? '*' : weekday);

    return cronExp.join(' ');
}

ns.scheduleJob(cronExp, function () {
    "use strict";
    global.slogger.addInfoLog('[schedule]', `env : ${global.env} / hostname : ${hostname}`);

    let datestr = new moment().format('D-H-m-e');
    let day_str = datestr.split('-')[0];
    let hour_str = datestr.split('-')[1];
    let min_str = datestr.split('-')[2];
    let week_str = datestr.split('-')[3];

    let sql = `SELECT * FROM dti.schedule WHERE used = 'on' AND (`;
    sql = sql + `(intv_day = '-1' AND intv_weekday = '-1' AND intv_hour = '-1' AND intv_min = '-1') OR `;
    sql = sql + `(intv_day = '-1' AND intv_weekday = '-1' AND intv_hour = '-1' AND intv_min = '${min_str}') OR `;
    sql = sql + `(intv_day = '-1' AND intv_weekday = '-1' AND intv_hour = '${hour_str}' AND intv_min = '${min_str}') OR `;
    sql = sql + `(intv_day = '-1' AND intv_weekday = '${week_str}' AND intv_hour = '${hour_str}' AND intv_min = '${min_str}') OR `;
    sql = sql + `(intv_day = '${day_str}' AND intv_weekday = '-1' AND intv_hour = '${hour_str}' AND intv_min = '${min_str}')`;

    if (Number(min_str) % 5 === 0) {
        sql += ` OR (intv_min = '*/5')`;
    }

    if (Number(min_str) % 10 === 0) {
        sql += ` or (intv_min = '*/10')`;
    }

    if (Number(min_str) % 30 === 0) {
        sql += ` or (intv_min = '*/30')`;
    }

    sql += ')';

    let dataSource = Schedule.getDataSource().connector;
    let async = require('async');

    dataSource.execute(sql, '', (error, recordsets) => {
        if (error) {
            throw error;
        }

        async.eachSeries(recordsets, (record, innerCallback) => {

            /*
              개발 서버는 파드가 1개 이므로, 모든 스케줄이 작동 해야 함.
              운영 서버는 파드가 3개 이므로, 알람이 아니고 0번 파드가 아닌 경우 작동 하지 않는다.
              따라서, 아래 3개의 경우 IF(OR) 문이 성립 한다.
             */
            const isTest = global.env === 'development';
            const isFirstPod = hostname.substring(hostname.lastIndexOf('-') + 1) === '0';
            const isAlarm = record.api_model === 'alarmSh';

            if (isTest || isFirstPod || isAlarm) {
                if (error) {
                    global.slogger.addErrLog('[schedule]', `${record.id} (${record.title}) is failed.`, error);
                }

                let callback = (error, data) => {
                    let updateData = { last_exc_date : moment().format('YYYY-MM-DD[T]HH:mm:ss') };

                    if (data) {
                        global.slogger.addInfoLog('[schedule]', `${record.id} (${record.title}) is successed.`, data);
                        updateData.last_exc_result = 1;
                    } else {
                        global.slogger.addInfoLog('[schedule]', `${record.id} (${record.title}) has no data.`);
                        updateData.last_exc_result = 0;
                    }

                    Schedule.findById(record.id, (error, instance) => {
                        if (!error && instance) {
                            instance.updateAttributes(updateData, (error) => {
                                if (error) {
                                    error.code = 'dti_exception_205';
                                    global.slogger.addErrLog('ERROR', 'Fail to change schedule last execute time', record.title, error);

                                    return;
                                }
                            });
                        }
                    });
                };

                let param = null;

                try {
                    param = JSON.parse(record.api_param);
                } catch {
                    param = {};
                }

                if (loopback.models.hasOwnProperty(record.api_model) && loopback.models[record.api_model].hasOwnProperty(record.api_method) && _.isFunction(loopback.models[record.api_model][record.api_method])) {
                    global.slogger.addInfoLog('[schedule]', `${record.id} (${record.title}) is executed. ${record.api_model} / ${record.api_method} / ${record.api_param}`);
                    loopback.models[record.api_model][record.api_method](param, callback);

                    innerCallback();
                } else {
                    innerCallback();
                }
            } else {
                innerCallback();
            }
        }, (async_err)=> {
            if (async_err) {
                async_err.code = 'dti_exception_206';
                global.slogger.addErrLog('ASYNC ERROR', async_err);

                innerCallback(async_err);
            }
        });
    });
});
