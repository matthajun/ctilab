const winston = require('../config/winston')(module);
const setDateTime = require('../utils/setDateTime');

const ClickHouse = require('@apla/clickhouse');

//당진 실서버 코드 선언부
const ch = new ClickHouse({ host : (process.env.CH_ADDRESS).replace('http://',''), port: '8124', format: 'CSV'});

const tableName = process.env.CH_L005;
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

module.exports.parseAndInsert = async function(req) {
    let rtnResult = [];
    let query = [];

    for(let list of req.body.list) {
        let value = {};
        value = {...req.header, ...list, ...req.body};
        let event_info  = JSON.stringify(value.event_info).replace(/,/gi,"|");

        const contents = {message_id: value.message_id, tid: '', normal_seq: value.normal_seq, plant_id: value.plant_id, plant_name: value.plant_name,
            machine_no: value.machine_no, manufacturer_name: value.manufacturer_name, log_type: value.log_type, log_category: value.log_category, format:value.format,
            device_id: value.device_id, device_name: value.device_name, loged_time: value.loged_time, event_level: value.event_level, type01: value.type01, type02: value.type02,
            type03: value.type03, code01: value.code01, code02: value.code02, code03: value.code03, value01: value.value01, value02: value.value02, value03: value.value03,
            value04: value.value04, value05: value.value05, value06: value.value06, value07: value.value07, event_info: event_info, stat_time: value.stat_time,
            sent_time: value.sent_time, date_time : ''};

        query.push(contents);
    }

    try {
        const csv_string = jsonToCSV(query);
        const file_name = 'unit_'+setDateTime.setDateTimeforInsert();

        fs.writeFileSync(`.${path.sep}temp${path.sep}` + `${file_name}` + '.csv', csv_string);

        var csvStream = fs.createReadStream(`.${path.sep}temp${path.sep}` + `${file_name}`  + '.csv');
        var clickhouseStream = ch.query(`insert into dti.${tableName} `);

        csvStream.pipe(clickhouseStream)
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
