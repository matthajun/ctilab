const getRequest = require('../utils/getRequestId');

module.exports.KeyChange_h005 = function (table) {
    for(let k of table){
        Object.defineProperty(k, 'unit_id',
            Object.getOwnPropertyDescriptor(k, 'unit'));
        delete k['unit'];

        Object.defineProperty(k, 'make_id',
            Object.getOwnPropertyDescriptor(k, 'make'));
        delete k['make'];

        /*Object.defineProperty(k, 'created_system',
            Object.getOwnPropertyDescriptor(k, 'sanGubun'));
        delete k['sanGubun'];*/
    }
};

module.exports.KeyChange_h005_update = function (data) {
    let unit_id = 'EWP_01_UN_0'+data.unit;
    let make_id = '';

    if(data.make === 'GE') {
        make_id = unit_id + '_' + data.make + '_GT';
    }
    else {
        make_id = unit_id + '_' + data.make;
    }

    let result = {
        unit_id: unit_id,
        make_id: make_id,
        ip: data.ip
    };
    if(data.type === 0)
        result.port = data.port;

    result.sanGubun = data.sanGubun;

    return result;
};

module.exports.KeyChange_h005_update_communi = function (data) {
    let unit_id = 'EWP_01_UN_0'+data.unit;
    let make_id = '';

    if(data.make === 'GE') {
        make_id = unit_id + '_' + data.make + '_GT';
    }
    else {
        make_id = unit_id + '_' + data.make;
    }

    let result = {
        unit_id: unit_id,
        make_id: make_id,
        sanGubun : data.sanGubun,
        protocol_type: data.protocolType,
        protocol_detail: data.detailProtocol,
        src_ip: data.srcIp,
        src_port: data.srcPort,
        dst_ip: data.dstIp,
        dst_port: data.dstPort
    };

    return result;
};