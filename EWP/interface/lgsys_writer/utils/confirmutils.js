const CRC32 = require('crc-32');
const fs = require('fs');

module.exports.makeConfirmCode  = function (strData){
    if(strData) {
        let a = CRC32.str(JSON.stringify(strData));

        let b = a >>> 0;
        /*console.log(0, JSON.stringify(strData));
        console.log(1,a);
        console.log(2,b);
        console.log(3,b.toString(16));*/
        return b.toString(16);
    }
    else {
        return ''
    }
};