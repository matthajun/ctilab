const winston = require('../config/winston')(module);
const setDateTime = require('../utils/setDateTime');

const ClickHouse = require('@apla/clickhouse');
const ch = new ClickHouse({ host : process.env.CH_ADDRESS, port: '8124', format: 'CSV'});

const tableName = process.env.CH_I001;
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
    winston.info('**************** I001_unit go! ');
    let query = [];

    for(let tag_list of req.body.body.tag_list) {
        let value = {};
        value = {...req.body.header, ...tag_list, date_time: setDateTime.setDateTime()};

        const contents = {message_id: value.message_id, operate_info_id: value.operate_info_id, send_time: value.send_time, unit_id: value.unit_id,
            tag_name: value.tag_name, tag_desc: value.tag_desc, date_time: setDateTime.setDateTime()};
        query.push(contents);
    }

    try {
        const csv_string = jsonToCSV(query);
        const file_name = setDateTime.setDateTimeforInsert();
        //console.log(csv_string);
        fs.writeFileSync(`.${path.sep}temp${path.sep}` + `${file_name}` + '.csv', csv_string);

        var csvStream = fs.createReadStream(`.${path.sep}temp${path.sep}` + `${file_name}`  + '.csv');
        var clickhouseStream = ch.query(`insert into dti.${tableName} `);

        csvStream.pipe(clickhouseStream)
    }catch(err){
        console.log(err);
    }
};
