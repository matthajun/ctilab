const winston = require('../config/winston')(module);
const schedule = require('node-schedule');

const exec = require('child_process').exec;
const fs = require('fs');

const setDateTime = require('../utils/setDateTime');

module.exports.Delete = async function() {
    schedule.scheduleJob(process.env.DELETE_TIME, async function() {   //딜리트타임, env에 설정있음
        let rtnResult = {};
        try {
            winston.info('*********************** downloads의 피캡파일을 삭제하는 스케쥴을 실행합니다. ***********************');
            const YearDay = setDateTime.setDateTime_Pcap(2);
            winston.info('*********************** 삭제하는 날짜 : '+ YearDay +' ***********************');
            fs.readdir('./downloads',(err, files) =>{
                let numbering = files.length;
                winston.info('************* downloads 디렉토리의 현재 파일 갯수 : '+ numbering +' *************');

                const DeleteSign = 'rm -rf ./downloads/*'+ YearDay + '*';
                console.log(DeleteSign);

                exec(DeleteSign, function (err, stdout, stderr) {
                    if(!err) {
                        if(numbering !== 0) {
                            fs.readdir('./downloads', (err, files) => {
                                winston.info('*********************** 삭제 성공!! ***********************');
                                winston.info('************* 스케쥴 실행 후 downloads 디렉토리의 현재 파일 갯수 : ' + files.length + ' *************');
                            });
                        }
                    }
                    else {
                        winston.error('*********************** downloads 디렉토리의 파일을 삭제하는데 실패했습니다. ***********************');
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
