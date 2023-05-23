const H004 = require('../schedule/H004_req');
const H010 = require('../schedule/H010_req');

const schedule = require('node-schedule');

module.exports.Initialize = function (){
    schedule.scheduleJob(process.env.INITIAL_TIME, function() { //하루에 두 번씩 요청
        H010.ResInsert();
        H004.ResInsert('10');
    });
};
