const winston = require('../config/winston')(module);
const sequelize = require('sequelize');
const db = require('../models');
const reqInsert = require('./reqInsert');
const _ = require('loadsh');

let masterTableName = "";

module.exports.parseAndInsert = async function(req){
    winston.debug(JSON.stringify(req.body.tableData));
    masterTableName =  req.body.tableName;
    const Datas = req.body.tableData;
    let rtnResult = {};
    let state;

    if(Array.isArray(Datas)) {
        for(Data of Datas) {
            if (Data.state === 'DE')
                state = 'DE';
            else
                state = 'E';
        }
    }
    else {
        if (Datas.state === 'DE')
            state = 'DE';
        else
            state = 'E';

    }

    try {
        if(Array.isArray(Datas)) {
            for (Data of Datas) {
                const result = await db.sequelize.transaction(async (t) => {
                    winston.info("********************************************************************************");
                    winston.info("******************* Update start *************************");
                    //Data가 단일
                    let rslt = await db[masterTableName.toUpperCase()].upsert({
                        id: Data.id,
                        column: Data.column,
                        keyword: Data.keyword,
                        description: Data.description,
                        state: state,
                        user: Data.user,
                        trans_tag: 'E',
                        dttm: Data.dttm,
                        deploy: Data.deploy,
                        sanGubun: Data.sanGubun
                    }, {id: Data.id}).then(
                        () => {
                            winston.info('upsert 완료!');
                        });

                    if (rslt instanceof Error) {
                        winston.error("************* 정책 업데이트 에러 발생!! **************");
                        throw new rslt;
                    }

                    winston.info("******************* Update end *************************");
                });
            }
        }
        else{
            const result = await db.sequelize.transaction(async (t) => {
                winston.info("********************************************************************************");
                winston.info("******************* Update start *************************");
                //Data가 단일
                let rslt = await db[masterTableName.toUpperCase()].upsert({
                    id: Datas.id,
                    column: Datas.column,
                    keyword: Datas.keyword,
                    description: Datas.description,
                    state: state,
                    user: Datas.user,
                    trans_tag: 'E',
                    dttm: Datas.dttm,
                    deploy: Datas.deploy,
                    sanGubun: Datas.sanGubun
                }, {id: Datas.id}).then(
                    () => {
                        winston.info('upsert 완료!');
                    });

                if (rslt instanceof Error) {
                    winston.error("************* 정책 업데이트 에러 발생!! **************");
                    throw new rslt;
                }

                winston.info("******************* Update end *************************");
            });
        }
    } catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        winston.error("************* 정책 업데이트 에러 발생!! **************");
        winston.error(error.stack);
        rtnResult = error;
    } finally {
        return rtnResult;
    }
};