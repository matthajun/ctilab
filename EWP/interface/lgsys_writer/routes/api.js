const express = require('express');
const router = express.Router();
const makejson = require('../utils/makejson');
const winston = require('../config/winston')(module);

const L009_ch = require('../clickhouse/L009');
const L011_ch = require('../clickhouse/L011');
const L014 = require('../service/L014');

const Transaction = require('../utils/Transanction');

router.post('/v1', async (req, res, next) => {
    try {
        if(req.body.header.message_id) {
            winston.debug("post id " + req.body.header.message_id);
            const codeId = req.body.header.message_id;

            let result;
            let ch_result = {};
            let ch_bu_result = {};

            switch (codeId) {
                case "L009" :
                    ch_result = await L009_ch.parseAndInsert(req);
                    break;

                case "L011" :
                    ch_result = await L011_ch.parseAndInsert(req);
                    break;

                case "L014" :
                    result = await L014.parseAndInsert(req);
                    break;

                default:
                    throw Error(`{"res_cd":"99"}`);
            }

            if (result instanceof Error) { //Insert가 안되었을때
                throw new Error(result);
            } else if (ch_result instanceof Error) {
                throw new Error(ch_result);
            } else if (ch_bu_result instanceof Error) {
                throw new Error(ch_result);
            } else {
                res.json(makejson.makeResData(null, req));

                if(codeId !== 'L014') {
                    setTimeout(function () {
                        winston.info('seq 전달 값 : '+ JSON.stringify(result));
                        Transaction.Transaction(codeId, req.body.body.tid, result);
                    }, 200);
                }
            }
        }
        else {
            const stix_res = {"body":{"header":{"message_id":"STIX"}}};
            res.json(makejson.makeResData(null, stix_res));
        }
    } catch (err) {
        next(err);
    }
});

module.exports = router;
