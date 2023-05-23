const winston = require('../config/winston')(module);
const sequelize = require('sequelize');
const db = require('../models');
const makereq = require('../utils/makerequest');
const schedule = require('node-schedule');
const _ = require('loadsh');

Array.prototype.division = function (n) {
    let arr = this;
    let len = arr.length;
    let cnt = Math.floor(len / n) + (Math.floor(len % n) > 0 ? 1 : 0);
    let tmp = [];

    for (let i = 0; i < cnt; i++) {
        tmp.push(arr.splice(0, n));
    }

    return tmp;
};

module.exports.searchAndtransm = async function() {
    schedule.scheduleJob(process.env.HIGHRANK_TIME, async function() {
        let rtnResult = {};
        try {
            const tableNames = process.env.TABLE_NAMES.split(',');

            for (tableName of tableNames) {
                const result = await db.sequelize.transaction(async (t) => {
                    let tableInfo = {};

                    let rslt = await db[tableName.toUpperCase()].findAll({where: {trans_tag: 'C'}}).then(users => {
                        if (users.length) {
                            let childTable = [];
                            for (user of users) {
                                user.update({trans_tag: 'E'});
                                childTable.push(user.dataValues);
                            }

                            if(childTable.length > 40){
                                winston.info('********************************'+tableName+' 테이블의 Value 갯수가 40개가 넘었습니다. ********************************')
                                let motherTable = childTable.division(40);

                                for(let daughtTable of motherTable){
                                    tableInfo = {tableName: tableName, tableData: _.cloneDeep(daughtTable)};
                                    makereq.highrankPush(tableInfo);
                                }
                            }
                            else if (childTable.length){
                                tableInfo = {tableName: tableName, tableData: _.cloneDeep(childTable)};
                                makereq.highrankPush(tableInfo);
                            }
                        }
                    });
                });
            }
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
