const winston = require('../config/winston')(module);
const sequelize = require('sequelize');

const schedule = require('node-schedule');
const db = require('../models');

module.exports.searchAndInsert = async function() {
    schedule.scheduleJob('35 */5 * * * *', async function () {
        let rtnResult = {};
        try {
            winston.info("******************* 보안정책, 통신기반 테이블간 이동 시작 *************************");
            const result = await db.sequelize.transaction(async (t) => {
                let rslt = await db[process.env.COMMUNI_TABLE.toUpperCase()].findAll({attributes: [['make_id', 'make'], ['unit_id', 'unit'],
                        ['protocol_type', 'protocolType'], ['protocol_detail', 'detailProtocol'], ['src_ip', 'srcIp'], ['src_port', 'srcPort'],
                        ['dst_ip', 'dstIp'], ['dst_port', 'dstPort']], where: {trans_tag_bw:'C'}})
                    .then(async users => {
                        if (users.length) {
                            for(user of users){
                                const data = user.dataValues;
                                if(data.make.includes('ABB'))
                                    data.make = 'ABB';
                                else if (data.make.includes('GE_GT'))
                                    data.make = 'GE';
                                data.unit = data.unit.charAt(data.unit.length-1);

                                switch (data.protocolType) {
                                    case 'ARP':
                                        data.protocolType = '1';
                                        break;

                                    case 'IPv4':
                                        data.protocolType = '2';
                                        break;

                                    case 'LLDP':
                                        data.protocolType = '3';
                                        break;

                                    case 'tcp':
                                        data.protocolType = '4';
                                        break;

                                    case 'TCP':
                                        data.protocolType = '4';
                                        break;

                                    case 'udp':
                                        data.protocolType = '5';
                                        break;

                                    case 'icmp':
                                        data.protocolType = '6';
                                        break;
                                }

                                const tableData = {...data, name: '수집 화이트리스트', stationId: 'DS', powerGenId: 'DS_001', fstUser: 'interface', lstUser: 'interface', state: 'I'};
                                //console.log(tableData);
                                await db[process.env.COMMUNI_LIST_TABLE.toUpperCase()].findAll({where: {make: data.make, unit:data.unit, protocolType: data.protocolType,
                                        srcIp: data.srcIp, srcPort:data.srcPort, dstIp: data.dstIp, dstPort: data.dstPort, state: ['E','I','C']}}).
                                then(async users => {
                                    if(!users.length){
                                        winston.info("******************* New CommuniWhitelist is found!!! *************************");
                                        await db[process.env.COMMUNI_LIST_TABLE.toUpperCase()].create(tableData); //인서트
                                    }
                                });

                                await user.update({trans_tag_bw: 'E'});
                            }
                        }
                    });

            });
            winston.info("******************* 보안정책, 통신기반 테이블간 이동 끝! *************************");
        } catch (error) {
            // If the execution reaches this line, an error occurred.
            // The transaction has already been rolled back automatically by Sequelize!
            winston.error(error.stack);
            rtnResult = error;
        } finally {
            return rtnResult;
        }
    })
};
