const setdatetime = require('./setDateTime');

//H005,H014 RequestID 채번
module.exports.getRequestId = function (message_id) {
    const id_prefix = message_id;
    const time = setdatetime.setDateTime();

    let serialNumber = 1000 + Math.floor(Math.random() * 9000);

    return id_prefix + time + String(serialNumber);
};