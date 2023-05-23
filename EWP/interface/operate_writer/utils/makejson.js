const confirmutils = require('./confirmutils');
const rescodes = require('./rescodes');
const _ = require('loadsh');
const winston = require('../config/winston')(module);
const setDateTime = require('./setDateTime');

module.exports.makeReqData = function (id){
    let reqData = {};
    let reqBody = {};

    const time = setDateTime.setDateTime();

    const reqHeaderData = {"message_id": id, "keeper_id": process.env.KEEPER_ID, "send_time": time};
    reqHeaderData.confirm_code = confirmutils.makeConfirmCode(JSON.stringify(reqBody));

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
