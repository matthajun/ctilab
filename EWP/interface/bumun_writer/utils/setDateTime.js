var moment = require('moment');

module.exports.setDateTime = function () {
    return moment().format("YYYYMMDDHHmmss");
};

module.exports.setDateTimeforHistory = function () {
    return moment().format("YYYY.MM.DD, HH:mm:ss");
};

module.exports.setDateTimeforEvent = function () {
    return moment().format("YYYY-MM-DD HH:mm:ss");
};

module.exports.setDateTimeforInsert = function () {
    return moment().format("YYYY.MM.DD_HHmmssms");
};

module.exports.setDateTime_1121 = function (day, mm) {
    let a = moment().subtract(day, 'day').subtract(mm, 'minutes');
    return a.format('YYYY-MM-DD HH:mm:ss');
};
