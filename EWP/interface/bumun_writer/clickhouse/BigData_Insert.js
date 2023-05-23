const winston = require('../config/winston')(module);
const setDateTime = require('../utils/setDateTime');

const ClickHouse = require('@apla/clickhouse');

const ch = new ClickHouse({ host : (process.env.CH_ADDRESS).replace('http://',''), port: '8125', format: 'CSV'});

const fs = require('fs');
const path = require('path');

function jsonToCSV(json_data) {
    let json_array = json_data;
    let csv_string = '';

    json_array.forEach((content, index)=>{ let row = '';
        for(let title in content){
            row += (row === '' ? `${content[title]}` : `,${content[title]}`);
        }
        csv_string += (index !== json_array.length-1 ? `${row}\r\n`: `${row}`);
    });
    return csv_string;
}

module.exports.parseAndInsert = async function(req, tableName) {
    let rtnResult = [];
    let query = [];

    try {
        for(let list of req.body.tableData) {
            let value = {};
            let contents = {};
            value = {...req.header, ...list, ...req.body};

            switch(tableName) {
                case 'motie_ai_corr_result_v2':
                    contents = {
                        f_time: value.f_time, f_ip: '', f_type: value.f_type, f_single_rule: value.f_single_rule,
                        f_hash: value.f_hash, f_id: value.f_id, f_milli_time: value.f_milli_time,
                        b_time: value.b_time, b_ip: '', b_type: value.b_type, b_single_rule: value.b_single_rule,
                        b_hash: value.b_hash, b_id: value.b_id, b_milli_time: value.b_milli_time,
                        corr: value.corr, ai_rmse: value.ai_rmse, ai_rmse_scaled: value.ai_rmse_scaled,
                        ai_label: value.ai_label, version: value.version
                    };
                    break;

                case 'motie_ai_single_log':
                    contents = {
                        time: value.time, ip: '', type: value.type, single_rule: value.single_rule,
                        hash: value.hash, id: value.id, milli_time: value.milli_time, version: value.version
                    };
                    break;

                case 'motie_ai_single_packet':
                    contents = {
                        time: value.time, ip: '', type: value.type, single_rule: value.single_rule,
                        hash: value.hash, id: value.id, milli_time: value.milli_time, version: value.version
                    };
                    break;

                case 'motie_ai_op_result':
                    contents = {
                        hash: value.hash, time_line: value.time_line, message_id: value.message_id,
                        operate_info_id: value.operate_info_id, send_time: value.send_time,
                        unit_id: value.unit_id, tag_name: value.tag_name, tag_value: value.tag_value,
                        tag_time: value.tag_time, date_time: value.date_time, trans_tag: value.trans_tag,
                        ai_rmse: value.ai_rmse, ai_rmse_scaled: value.ai_rmse_scaled, ai_label: value.ai_label,
                        ai_threshold: value.ai_threshold, version: value.version
                    };
                    break;

                default:
                    throw new Error('************************** 전송받은 값 중 테이블 이름을 확인하세요 (테이블 명이 없어 작동 오류) **************************');
                    break;
            }

            query.push(contents);
        }

        const csv_string = jsonToCSV(query);
        const file_name = 'unit_'+setDateTime.setDateTimeforInsert();

        fs.writeFileSync(`.${path.sep}temp${path.sep}` + `${file_name}` + '.csv', csv_string);

        let csvStream = fs.createReadStream(`.${path.sep}temp${path.sep}` + `${file_name}`  + '.csv');
        let clickhouseStream = ch.query(`insert into dti.${tableName} `);

        csvStream.pipe(clickhouseStream);

        fs.unlink(`.${path.sep}temp${path.sep}` + `${file_name}`  + '.csv', function (err) {
            if (err) throw err;
            winston.info('successfully deleted ' + `${file_name}`  + '.csv');
        })
    }
    catch (error) {
        // If the execution reaches this line, an error occurred.
        // The transaction has already been rolled back automatically by Sequelize!
        winston.error(error.stack);
        rtnResult = error;
    } finally {
        return rtnResult;
    }
};
