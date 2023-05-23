const moment = require('moment');

module.exports.setDateTime = function () {
    return moment().format("YYYYMMDDHHmmss");
};

module.exports.setDateTime_ago = function (mm) {
    let a = moment().subtract(mm,'minutes');
    return a.format('YYYYMMDDHHmm')
};

module.exports.changeFormat = function (time) {
    return moment(time).format('YYYYMMDDHHmm')
};

module.exports.setDateTimeforHistory = function () {
    return moment().format("YYYY.MM.DD, HH:mm:ss");
};

module.exports.setDateTime_dayago = function (mm) {
    let a = moment().subtract(mm,'days');
    return a.format('YYYYMMDDHHmm')
};

//트랜잭션 임의요청시에 사용하는 함수들 dayago3, dayago2
module.exports.setDateTime_dayago3 = function (mm) {
    let a = moment().subtract(mm,'days');
    return a.format('YYYYMMDD0000')
};

module.exports.setDateTime_dayago2 = function (mm) {
    let a = moment().subtract(mm,'days');
    return a.format('YYYYMMDD2359')
};

//피캡파일 삭제 날짜 추가 (2달전으로 날짜 설정)
module.exports.setDateTime_Pcap = function (mm) {
    let a = moment().subtract(mm, 'month');
    return a.format('YYYY-MM-DD')
};

module.exports.setDateTime_H009 = function (mm) {
    let a = moment().subtract(mm, 'month');
    return a.format('YYYYMMDDHHmmss')
};

module.exports.setDateTimeforAnomalyHistory = function (mm) {
    let a = moment().subtract(mm, 'month');
    return a.format('YYYY-MM-DD HH:mm:ss')
};

// 중복 제거시 셀렉트 쿼리에 사용하는 함수! (22.07.27에 추가)
module.exports.setDateTime_220727 = function (day, mm) {
    let a = moment().subtract(day, 'day').subtract(mm, 'minutes');
    return a.format('YYYYMMDDHHmmss');
};

//H007에 밀리초까지 저장하기 위해 함수 추가 (22.07.27에 추가)
module.exports.setDateTime_milli = function () {
    return moment().format("YYYYMMDDHHmmssSSS");
};
