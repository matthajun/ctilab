const confirmutils = require('./confirmutils');
const rescodes = require('./rescodes');
const _ = require('loadsh');
const winston = require('../config/winston')(module);
const setDateTime = require('./setDateTime');

module.exports.makeReqData = function (id){
    let reqData = {};

    const reqHeaderData = {"message_id": id, "logger_id": ''};

    reqData.header = reqHeaderData;
    return reqData;
};

module.exports.makeReqData_L001 = function (id, page){
    let reqData = {};

    const before_time = setDateTime.setDateTime_ago(5);
    const long_before_time = setDateTime.setDateTime_ago(10);
    const reqHeaderData = {"message_id": id, "logger_id": ''};
    const reqBody = {"loaded_start_time": long_before_time, "loaded_end_time": before_time, 'page': page};

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeReqData_L002 = function (id){
    let reqData = {};
    let format_array = [];

    const reqHeaderData = {"message_id": id, "logger_id": ''};
    const reqBody = {"format_array": format_array };

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeReqData_L003 = function (id){
    let reqData = {};
    let plant_id_array = ["DS_001"];
    let device_id_array = [];

    const reqHeaderData = {"message_id": id, "logger_id": ''};
    const reqBody = {"plant_id_array": plant_id_array, "device_id_array": device_id_array};

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeReqData_L004 = function (plant_id, device_id, level_low, level_high, who ){
    let reqData = {};
    let plant_id_array = [plant_id];
    let device_id_array = [device_id];

    const reqHeaderData = {"message_id": 'L004', "logger_id": ''};
    const reqBody = {"who": who,"plant_id_array": plant_id_array, "device_id_array": device_id_array,
            "log_type_array": [], "log_category_array": [], "log_event_level_low" : level_low,
            "log_event_level_high": level_high, "simplicity": 0};

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeReqData_L005 = function (id, page){
    let reqData = {};

    const before_time = setDateTime.setDateTime_ago(3);
    const long_before_time = setDateTime.setDateTime_ago(4);
    const reqHeaderData = {"message_id": id, "logger_id": ''};
    const reqBody = {"stat_start_time": long_before_time, "stat_end_time": before_time, 'page': page};

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeReqData_L006 = function (id, body){
    let reqData = {};

    let plant_id_array = ["DS_001"];
    let device_id_array = [body.deviceId];

    const reqHeaderData = {"message_id": id, "logger_id": ''};
    const reqBody = {//"seq": '', "alarm_log": {"seq":'', "device_id": ''},
        "plant_id_array": plant_id_array,
        "device_id_array": device_id_array, "log_type_array": [], "log_category_array": [],
        "loged_start_time": setDateTime.changeFormat(body.startTime), "loged_end_time": setDateTime.changeFormat(body.endTime),
        "simplicity":1 };

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeReqData_L007 = function (id, body){
    let reqData = {};

    let plant_id_array = ["DS_001"];
    let device_id_array = [body.deviceId];

    const reqHeaderData = {"message_id": id, "logger_id": ''};
    const reqBody = {"plant_id_array": plant_id_array,
        "device_id_array": device_id_array, "log_type_array": [], "log_category_array": [],
        "stat_start_time": setDateTime.changeFormat(body.startTime), "stat_end_time": setDateTime.changeFormat(body.endTime),
        "log_event_level_low" : 30, "log_event_level_high": -1 };

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeReqData_L008 = function (id, device_array){
    let reqData = {};

    const reqHeaderData = {"message_id": id, "logger_id": ''};
    const reqBody = {"device_array": device_array};

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeReqData_L010 = function (id, data){
    let reqData = {};

    const reqHeaderData = {"message_id": id, "logger_id": ''};
    const reqBody = {signature_array: data};

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeReqData_L012 = function (id, page){
    let reqData = {};

    const before_time = setDateTime.setDateTime_ago(1);
    const long_before_time = setDateTime.setDateTime_ago(6);
    const reqHeaderData = {"message_id": id, "logger_id": ''};
    const reqBody = {"stat_start_time": long_before_time, "stat_end_time": before_time, 'page': page};

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeReqData_L013 = function (id){
    let reqData = {};

    const reqHeaderData = {"message_id": id, "logger_id": ''};

    reqData.header = reqHeaderData;
    return reqData;
};

module.exports.makeReqData_L015 = function (id, tid, seq_array){
    let reqData = {};

    const reqHeaderData = {"message_id": id, "logger_id": ''};
    const reqBodyData = {"tid": tid, "seq_array": seq_array};

    reqData.header = reqHeaderData;
    reqData.body = reqBodyData;

    return reqData;
};

module.exports.makeReqData_L005_retry = function (id, data){
    let reqData = {};

    const before_time = data.stat_end_time;
    const long_before_time = data.stat_start_time;
    const page = data.page;
    const reqHeaderData = {"message_id": id, "logger_id": ''};
    const reqBody = {"stat_start_time": long_before_time, "stat_end_time": before_time, 'page': page};

    reqData.header = reqHeaderData;
    reqData.body = reqBody;
    return reqData;
};

module.exports.makeResData = function (err, req){
    let resData={};
    let resBody={};
    const reqHeaderData = _.cloneDeep(req.body.header);
    if(!err){
        resBody = {"result":{"res_cd":"00","res_msg":"정상처리"}};
    }else{
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
            winston.error(err.stack, {e});
            errResult = {"res_cd":"99"};
        }

        resBody["result"] = errResult;
        resBody.result["res_msg"] = rescodes[resBody.result.res_cd];
    }
    if(req.body.header.message_id[0] !== 'L') {
        reqHeaderData.confirm_code = confirmutils.makeConfirmCode(JSON.stringify(resBody));
    }
    resData.header = reqHeaderData;
    resData.body = resBody;
    return resData;
};