const express = require('express');
const router = express.Router();
const makejson = require('../utils/makejson');
const winston = require('../config/winston')(module);

const policyInsert = require('../service/policyInsert');
const communiInsert = require('../service/communiInsert');
const signatureInsert = require('../service/signatureInsert');
const logInsert = require('../service/logInsert');
const datareqInsert = require('../service/dataRequestInsert');

const confirmutils = require('../utils/confirmutils');

router.post('/v1', async (req, res, next) => {
        try {
            let tableName = req.body.tableName;
            winston.debug("*************** Received tableName : " + tableName);
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

            switch (tableName) {
                case 'black_white_list':
                    result = await policyInsert.parseAndInsert(req);
                    break;

                case 'communi_white_list':
                    result = await communiInsert.parseAndInsert(req);
                    break;

                case 'motie_signature':
                    result = await signatureInsert.parseAndInsert(req);
                    break;

                case 'motie_log_system':
                    result = await logInsert.parseAndInsert(req);
                    break;

                case 'motie_data_request':
                    result = await datareqInsert.parseAndInsert(req);
                    break;

                default:
                    winston.error('*************** 정의되지 않은 테이블입니다. *************');
                    break;
            }

            if(result instanceof Error){   //Insert가 안되었을때
                throw new Error(result);
            }else{  //우선은 응답을 날리지만, 필요 없을 부분일 것으로 생각 됨
                res.json(makejson.makeResData(null,req));
            }

        } catch (err) {
            next(err);
        }
});

module.exports = router;