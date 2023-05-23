module.exports.KeyChange_manag_state = function (table) {
    for (let k of table.tableData){
        k['flag'] = 'State';

        Object.defineProperty(k, 'nameAgent',
            Object.getOwnPropertyDescriptor(k, 'operate_info_id'));
        delete k['operate_info_id'];

        Object.defineProperty(k, 'timeAgent',
            Object.getOwnPropertyDescriptor(k, 'send_time'));
        delete k['send_time'];

        delete k['date_time'];  delete k['trans_tag'];
    }
};