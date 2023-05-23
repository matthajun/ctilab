const moment = require('moment');

module.exports.setDateTime = function () {
    return moment().format("YYYYMMDDHHmmss");
};

module.exports.setDateTime_whatago = function (mm) {
    let a = moment().subtract(mm,'minutes');
    return a.format("YYYY-MM-DD HH:mm:ss");
};

module.exports.setDateTime_Twoago = function () {
    let a = moment().subtract(1,'minutes');
    return a.format("YYYY-MM-DD HH:mm:ss");
};

module.exports.setDateTimeforHistory = function () {
    return moment().format("YYYY.MM.DD, HH:mm:ss");
};

module.exports.setDateTime_H009 = function (mm) {
    let a = moment().subtract(mm, 'month');
    return a.format('YYYYMMDDHHmmss')
};



//시간 임의요청할 시 사용!
module.exports.setDateTime_1121 = function (day, mm) {
    let a = moment().subtract(day, 'day').subtract(mm, 'minutes');
    return a.format('YYYY-MM-DD HH:mm:ss');
};

module.exports.setDateTime_1121_plus = function (day) {
    let a = moment().subtract(day, 'day');
    return a.format('YYYY-MM-DD HH:mm:ss');
};

module.exports.setDateTimeforHighHistory = function (month) {
    let a = moment().subtract(month, 'month');
    return a.format('YYYY-MM-DD HH:mm:ss');
};
