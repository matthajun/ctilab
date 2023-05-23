const express = require('express');
const router = express.Router();
const winston = require('../config/winston')(module);
const makejson = require('../utils/makejson');

const reqInsert = require('../service/reqInsert');

const result_Insert = require('../clickhouse/corr_result_Insert');
const log = require('../clickhouse/log_Insert');
const packet = require('../clickhouse/packet_Insert');
const op_result = require('../clickhouse/op_result_Insert');

const bigData_Insert = require('../clickhouse/BigData_Insert');

const confirmutils = require('../utils/confirmutils');

const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, process.env.DOWNLOAD_PATH)
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
const uploader = multer({storage: storage});

router.post('/v1', async (req, res, next) => {
    try {
        let tableName = req.body.tableName;
        //let tableData = req.body.tableData;
        winston.debug("Received tableName : " + tableName + ", 받은 건 수 : " + (req.body.tableData).length);

        //운영정보 데이터들의 경우 로그를 남기지 않음 + 대용량의 경우에도 로그를 남기지 않는다.
        if(tableName !== 'motie_ai_op_result' && !req.body.bigData_tag){
            winston.debug(JSON.stringify(req.body));
        }

        let result =  {};

        //confirm_code check 실행
        const reqData = req.body;
        const reqConfirmCode = reqData.confirm_code;
        const localMakeConfirmCode = await confirmutils.makeConfirmCode(reqData.tableData);
        if (reqConfirmCode !== localMakeConfirmCode) {
            winston.error(`우리쪽 값 ${localMakeConfirmCode} ,  받은 값 ${reqConfirmCode}`);
            const errCode = "93";
            throw Error(`{"res_cd":"${errCode}"}`);
        }

        if (req.body.bigData_tag && req.body.bigData_tag === 'Y') { //데이터 전송 건수가 1만건 이상일 경우 (22/03/22에 추가됨)
            winston.info("*************** 대용량 데이터가 수신되었습니다. : " + tableName + "  |  총 건수: "
                + req.body.bigData_cnt + " ***************");

            result = await bigData_Insert.parseAndInsert(req, tableName);
        }
        //데이터 전송 건수가 1만건 이하일 경우 (기존 코드)
        else {
            switch (tableName) {
                case 'motie_ai_corr_result_v2':
                    result = await result_Insert.parseAndInsert(req);
                    break;

                case 'motie_ai_single_log':
                    result = await log.parseAndInsert(req);
                    break;

                case 'motie_ai_single_packet':
                    result = await packet.parseAndInsert(req);
                    break;

                case 'motie_ai_op_result':
                    result = await op_result.parseAndInsert(req);
                    break;

                //보안정책 및 데이터 요청 관련 중지, 주석처리 (21.11)
                // case 'black_white_list':
                //     winston.debug("*************** Received Data : " + JSON.stringify(tableData));
                //     result = await policyInsert.parseAndInsert(req);
                //     break;
                //
                // case 'communi_white_list':
                //     winston.debug("*************** Received Data : " + JSON.stringify(tableData));
                //     result = await communiInsert.parseAndInsert(req);
                //     break;
                //
                // case 'motie_signature':
                //     winston.debug("*************** Received Data : " + JSON.stringify(tableData));
                //     result = await signaureInsert.parseAndInsert(req);
                //     break;
                //
                // case 'motie_log_system':
                //     winston.debug("*************** Received Data : " + JSON.stringify(tableData));
                //     result = await logInsert.parseAndInsert(req);
                //     break;
                //
                // case 'motie_asset':
                //     winston.debug("*************** Received Data : " + JSON.stringify(tableData));
                //     result = await assetInsert.parseAndInsert(req);
                //     break;
                //
                // case 'motie_asset_ip':
                //     winston.debug("*************** Received Data : " + JSON.stringify(tableData));
                //     result = await assetIpInsert.parseAndInsert(req);
                //     break;
                //
                // case 'motie_data_request':
                //     winston.debug("*************** Received Data : " + JSON.stringify(tableData));
                //     result = await dataRequestInsert.parseAndInsert(req);
                //     break;
                //
                // case 'motie_rule_single':
                //     winston.debug("*************** Received Data : " + JSON.stringify(tableData));
                //     result = await ruleSingle.parseAndInsert(req);
                //     break;
                //
                // case 'motie_rule_multi':
                //     winston.debug("*************** Received Data : " + JSON.stringify(tableData));
                //     result = await ruleMulti.parseAndInsert(req);
                //     break;
                //
                // case 'motie_rule_mapping':
                //     winston.debug("*************** Received Data : " + JSON.stringify(tableData));
                //     result = await ruleMap.parseAndInsert(req);
                //     break;

                default:
                    result = await reqInsert.parseAndInsert(req);
                    break;
            }
        }

        if(result instanceof Error){   //Insert관련하여 오류 발생시 에러 throw
            throw new Error(result);
        }else{  //단위시스템에 대한 응답
            if (req.body.bigData_tag && req.body.bigData_tag === 'Y') {
                res.json(makejson.makeResData(null, req, 'Y'));
            }
            else{
                res.json(makejson.makeResData(null, req));
            }
        }

    } catch (err) {
        next(err);
    }
});

router.post('/pcap', uploader.single('my_file'), async (req, res, next)=> { // Pcap 파일수신코드, 21.11부터 사용안됨
    try {
        let result = {};

        winston.info('******************** pcap 파일을 수신하여 저장합니다. file is downloading.********************');
        winston.info(req.file.filename);

        if(result instanceof Error){
            throw new Error(result);
        }else{
            res.json({error:false});
        }

    } catch(err) {
        res.json({error:true});
        next(err);
    }
});

module.exports = router;
