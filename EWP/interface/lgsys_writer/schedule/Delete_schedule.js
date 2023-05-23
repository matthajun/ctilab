const winston = require('../config/winston')(module);
const schedule = require('node-schedule');

const exec = require('child_process').exec;
const fs = require('fs');

module.exports.Delete = async function() {
    schedule.scheduleJob("10 0 */2 * * *", async function() {
        let rtnResult = {};
        try {
            winston.info('*********************** temp 디렉토리의 파일을 삭제하는 스케쥴을 실행합니다. ***********************');

            fs.readdir('./temp',(err, files) =>{
                let numbering = files.length;
                winston.info('************* temp 디렉토리의 현재 파일 갯수 : '+ numbering +' *************');

                exec("rm -rf ./temp/*", function (err, stdout, stderr) {
                    if(!err) {
                        if(numbering !== 0) {
                            fs.readdir('./temp', (err, files) => {
                                winston.info('*********************** 삭제 성공!! ***********************');
                                winston.info('************* 스케쥴 실행 후 temp 디렉토리의 현재 파일 갯수 : ' + files.length + ' *************');
                            });
                        }
                    }
                    else {
                        winston.error('*********************** temp 디렉토리의 파일을 삭제하는데 실패했습니다. ***********************');
                        winston.error(err.stack);

                        return err;
                    }
                })
            });
        } catch (error) {
            winston.error(error.stack);
            rtnResult = error;
        } finally {
            return rtnResult;
        }
    })
};