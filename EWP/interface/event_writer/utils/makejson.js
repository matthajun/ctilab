const confirmutils = require('./confirmutils');
const rescodes = require('./rescodes');
const _ = require('loadsh');
const winston = require('../config/winston')(module);
const setDateTime = require('./setDateTime');
const getRequest = require('./getRequestId');

module.exports.makeReqData = function (id){
    let reqData = {};
    let reqBody = {};

    const time = setDateTime.setDateTime();

    const reqHeaderData = {"message_id": id, "keeper_id": process.env.KEEPER_ID, "send_time": time};
    reqHeaderData.confirm_code = confirmutils.makeConfirmCode(reqBody);

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeReqData_Body = function (id , Body){
    let reqData = {};
    let reqBody = Body;

    const time = setDateTime.setDateTime();

    const reqHeaderData = {"message_id": id, "keeper_id": process.env.KEEPER_ID, "send_time": time};
    reqHeaderData.confirm_code = confirmutils.makeConfirmCode(reqBody);

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeReqData_H004 = function (id, policy_type){
    let reqData = {};
    let reqBody = {"policy_type": policy_type };

    const time = setDateTime.setDateTime();

    const reqHeaderData = {"message_id": id, "keeper_id": process.env.KEEPER_ID, "send_time": time};
    reqHeaderData.confirm_code = confirmutils.makeConfirmCode(reqBody);

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeReqData_H005_bl = function (obj, created_type){
    let reqData = {};

    const time = setDateTime.setDateTime();

    let Array = [];
    for (let o of obj.original){
        Array.push({ip: o.ip, port: o.port});
    }

    if(obj.sanGubun)
        obj.sanGubun = String(obj.sanGubun);

    let reqHeaderData = {"message_id": 'H005', "keeper_id": process.env.KEEPER_ID, "send_time": time};

    const reqBody = {request_id: getRequest.getRequestId('H005'), unit_id: obj.unit_id, make_id: obj.make_id, created_system: obj.sanGubun, created_type: created_type, policy_type: '3',
        policy_detail_type: 'single', policy_ip: [], policy_bl: Array, policy_connect: [], start_time: '', end_time: ''};

    reqHeaderData.confirm_code = confirmutils.makeConfirmCode(reqBody);

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeReqData_H005_wh = function (obj, created_type){
    let reqData = {};

    const time = setDateTime.setDateTime();

    let Array = [];
    for (let o of obj.original){
        Array.push({ip: o.ip});
    }

    if(obj.sanGubun)
        obj.sanGubun = String(obj.sanGubun);

    let reqHeaderData = {"message_id": 'H005', "keeper_id": process.env.KEEPER_ID, "send_time": time};

    const reqBody = {request_id: getRequest.getRequestId('H005'), unit_id: obj.unit_id, make_id: obj.make_id, created_system: obj.sanGubun, created_type: created_type, policy_type: '1',
        policy_detail_type: 'single', policy_ip: Array, policy_bl: [], policy_connect: [], start_time: '', end_time: ''};

    reqHeaderData.confirm_code = confirmutils.makeConfirmCode(reqBody);

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeReqData_H005_connect= function (obj, created_type){
    let reqData = {};

    const time = setDateTime.setDateTime();

    let Array = [];
    for (let o of obj.original){
        Array.push({...o});
    }

    if(obj.sanGubun)
        obj.sanGubun = String(obj.sanGubun);

    let reqHeaderData = {"message_id": 'H005', "keeper_id": process.env.KEEPER_ID, "send_time": time};

    const reqBody = {request_id: getRequest.getRequestId('H005'), unit_id: obj.unit_id, make_id: obj.make_id, created_system: obj.sanGubun, created_type: created_type, policy_type: '2',
        policy_detail_type: 'single', policy_ip: [], policy_bl: [], policy_connect: Array, start_time: '', end_time: ''};

    reqHeaderData.confirm_code = confirmutils.makeConfirmCode(reqBody);

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeReqData_H008 = function (id, body){
    let reqData = {};

    let unit_id = 'EWP_01_UN_0'+body.unitId;
    let make_id = '';

    if(body.makeId === 'GE') {
        make_id = unit_id + '_' + body.makeId + '_GT';
    }
    else {
        make_id = unit_id + '_' + body.makeId;
    }

    let reqBody = {
        unit_id: unit_id ,
        make_id: make_id,
        start_time: setDateTime.changeFormat(body.startTime),
        end_time: setDateTime.changeFormat(body.endTime)
    };

    const time = setDateTime.setDateTime();

    const reqHeaderData = {"message_id": id, "keeper_id": process.env.KEEPER_ID, "send_time": time};
    reqHeaderData.confirm_code = confirmutils.makeConfirmCode(reqBody);

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeReqData_H008forTest = function (id, unit, make, start_time, end_time){
    let reqData = {};

    //unit_id, 제조사 make_id
    let unit_id = 'EWP_01_UN_0'+unit;
    let make_id = '';

    if(make === 'GE') {
        make_id = unit_id + '_' + make + '_GT';
    }
    else {
        make_id = unit_id + '_' + make;
    }

    let reqBody = {
        unit_id: unit_id ,
        make_id: make_id,
        start_time: start_time,
        end_time: end_time
    };

    const time = setDateTime.setDateTime();

    const reqHeaderData = {"message_id": id, "keeper_id": process.env.KEEPER_ID, "send_time": time};
    reqHeaderData.confirm_code = confirmutils.makeConfirmCode(reqBody);

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeReqData_H014 = function (id, body, send_type){
    let reqData = {};

    //unit_id, 제조사 make_id
    let unit_id = 'EWP_01_UN_0'+body.unitId;
    let make_id = '';
    if(body.makeId === 'GE') {
        make_id = unit_id + '_' + body.makeId + '_GT';
    }
    else {
        make_id = unit_id + '_' + body.makeId;
    }

    let reqBody = {
        request_id: getRequest.getRequestId('H014'),
        unit_id: unit_id ,
        make_id: make_id,
        send_type: send_type,
        start_time: setDateTime.changeFormat(body.startTime),
        end_time: setDateTime.changeFormat(body.endTime)
    };

    const time = setDateTime.setDateTime();

    const reqHeaderData = {"message_id": id, "keeper_id": process.env.KEEPER_ID, "send_time": time};
    reqHeaderData.confirm_code = confirmutils.makeConfirmCode(reqBody);

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeReqData_H014_Transaction = function (id, start_time, end_time){
    let reqData = {};

    //unit_id, 제조사 make_id

    let reqBody = {
        request_id: getRequest.getRequestId('H014'),
        send_type: '2',
        start_time: start_time,
        end_time: end_time
    };

    const time = setDateTime.setDateTime();

    const reqHeaderData = {"message_id": id, "keeper_id": process.env.KEEPER_ID, "send_time": time};
    reqHeaderData.confirm_code = confirmutils.makeConfirmCode(reqBody);

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeResData = function (err, req, seq){
    let resData={};
    let resBody={};
    const time = setDateTime.setDateTime();

    let reqHeaderData = {};

    //헤더 부분
    if(req) {
        reqHeaderData = _.cloneDeep(req.body.header);
    }
    else
        reqHeaderData = {"message_id":"", "keeper_id":"EWP_01_01"};

    //바디 부분
    if(!err && !(seq instanceof Error)){
        resBody = {"result":{"res_cd":"00","res_msg":"정상처리"}};
    }
    else {
        let errMessage;
        let errResult;
        try{
            errMessage = JSON.parse(err.message);
            if(errMessage.res_cd){
                errResult = errMessage;
            }else{
                errResult = {"res_cd":"99"};
            }
        }catch (e) {
            //winston.error(err.stack, {e});
            errResult = {"res_cd":"99"};
        }

        resBody["result"] = errResult;
        resBody.result["res_msg"] = rescodes[resBody.result.res_cd];
    }

    reqHeaderData.send_time = time;

    // if(req.body.header.message_id === 'H007') {
    //     resBody.receive_anomaly = seq;
    // }
    // else if(req.body.header.message_id === 'H015') {
    //     resBody.send_type = req.body.body.send_type;
    //     if(seq) {
    //         resBody.receive_anomaly = seq;
    //     }
    // }

    // 인터페이스 내부 오류 발생시 응답 킷 값에 undefined
    if (seq instanceof Error){
        resBody.receive_anomaly = undefined;
    }
    else {
        if(req.body.header.message_id === 'H007') {
            resBody.receive_anomaly = seq;
        }
        else if(req.body.header.message_id === 'H015') {
            resBody.send_type = req.body.body.send_type;
            if(seq) {
                resBody.receive_anomaly = seq;
            }
        }
    }

    reqHeaderData.confirm_code = confirmutils.makeConfirmCode(resBody);

    resData.header = reqHeaderData;
    resData.body = resBody;
    winston.info(JSON.stringify(resData));
    return resData;
};
