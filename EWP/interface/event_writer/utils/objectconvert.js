const _ = require('loadsh');

module.exports.obConvert = function (ob) {
    let result = _.chain(ob)
        .groupBy('make_id')
        .map(function(v, i) {
            return {
                request_id: _.get(_.find(v, 'request_id'), 'request_id'),
                unit_id: _.get(_.find(v, 'unit_id'), 'unit_id'),
                sanGubun: _.get(_.find(v, 'sanGubun'), 'sanGubun'),
                make_id: i,
                original: _.chain(v)
                    .groupBy('request_id')
                    .map((v, i) => {
                        return {
                            request_id: i,
                            ip: _.get(_.find(v, 'ip'), 'ip'),
                            port: _.get(_.find(v, 'port'), 'port')
                        }
                    }).value()
            }
        })
        .orderBy(['unit_id'])
        .value();

    return result;
};

module.exports.obConvert_connect = function (ob) {
    let result = _.chain(ob)
        .groupBy('make_id')
        .map(function(v, i) {
            return {
                request_id: _.get(_.find(v, 'request_id'), 'request_id'),
                unit_id: _.get(_.find(v, 'unit_id'), 'unit_id'),
                sanGubun: _.get(_.find(v, 'sanGubun'), 'sanGubun'),
                make_id: i,
                original: _.chain(v)
                    .groupBy('request_id')
                    .map((v, i) => {
                        return {
                            protocol_type: _.get(_.find(v, 'protocol_type'), 'protocol_type'),
                            protocol_detail: _.get(_.find(v, 'protocol_detail'), 'protocol_detail'),
                            src_ip: _.get(_.find(v, 'src_ip'), 'src_ip'),
                            src_port: _.get(_.find(v, 'src_port'), 'src_port'),
                            dst_ip: _.get(_.find(v, 'dst_ip'), 'dst_ip'),
                            dst_port: _.get(_.find(v, 'dst_port'), 'dst_port')
                        }
                    }).value()
            }
        })
        .orderBy(['unit_id'])
        .value();

    return result;
};