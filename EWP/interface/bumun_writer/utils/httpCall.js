var request = require("request");
var winston = require('../config/winston')(module);

var https = require('https');

exports.Rest = function (method, url, headers, query, callback) {
    //winston.debug("Rest method / url : " + method + " / " + url);
    //winston.debug("Rest query : " + query);
    if (!headers) {
        headers = {
            //Authorization: global.esAuth,
            'Content-Type': 'application/json',
        };
    }
    if (method.toString().toUpperCase() === 'GET') {
        request({
            uri: url,
            method: method.toString().toUpperCase(),
            headers: headers,
            timeout: 30000,
            strictSSL: false,
            rejectUnauthorized: false,
            followRedirect: true,
            maxRedirects: 5,
            body: query,
            json: true
        }, function (error, response, body) {
            if (error) {
                winston.error("GET ERR : "+ url + query + error);
                return callback("ERROR : " + error);
            } else {
                if (response.statusCode >= 200 && response.statusCode < 300) {
                    return callback(null, body);
                } else {
                    winston.error("GET ERR : " + url + query + response.statusCode);
                    return callback("ERROR[" + response.statusCode + "]" + " : " + body, null);
                }
            }
        });
    } else {
        request({
            uri: url,
            method: method.toString(),
            //headers: headers,
            timeout: 30000,
            strictSSL: false,
            rejectUnauthorized: false,
            followRedirect: true,
            maxRedirects: 5,
            body: query,
            json: true
        }, function (error, response, body) {
            if (error) {
                winston.error("POST RESPONSE ERR : ", body);
                return callback("ERROR : " + error);
            } else {
                if (url.indexOf("/restart?t=5") > 0 && url.indexOf(global.systemServiceUrl) === 0) {
                    if (response.statusCode === 204) {
                        //winston.debug("POST RESPONSE : ", body);
                        return callback(null, body);
                    } else {
                        winston.error("POST RESPONSE : ", response.statusCode, body);
                        return callback("ERROR[" + response.statusCode + "]", null);
                    }
                } else {
                    if (response.statusCode >= 200 && response.statusCode < 300) {
                        //winston.debug("POST RESPONSE : ", body);
                        return callback(null, body);
                    } else {
                        winston.error("POST RESPONSE : ", response.statusCode, body);
                        return callback("ERROR[" + response.statusCode + "]" + " : " + body, null);
                    }
                }

            }
        });
    }
};

exports.Call = function (method, url, query, callback) {
    //winston.debug("method / url : " + method + " / " + url);
    //winston.debug("query : " + query);
    const auth = 'Basic ' +  Buffer.from('admin:1111').toString('base64');
    var headers = {
        //Authorization: global.esAuth,
        'Content-Type': 'application/json'
        ,'Authorization' : auth
    };
    this.Rest(method, url, headers, query, function (err, data) {
        if (err) {
            return callback(err);
        } else {
            return callback(null, data);
        }
    });
};

exports.FastCall = function (method, url, query, callback) {
    winston.debug("method / url : ", method + " / " + url);
    winston.debug("query : ", query);

    var headers = {
        //Authorization: global.esAuth,
        'Content-Type': 'application/json',
    };

    if (method.toString().toUpperCase() == 'GET') {
        request({
            uri: url,
            method: method.toString().toUpperCase(),
            headers: headers,
            timeout: 2000,
            strictSSL: false,
            rejectUnauthorized: false,
            followRedirect: true,
            maxRedirects: 1,
            qs: query
        }, function (error, response, body) {
            if (error) {
                winston.error("GET ERR : ", url, query, error);
                return callback("ERROR : " + error);
            } else {
                if (response.statusCode >= 200 && response.statusCode < 300) {
                    return callback(null, body);
                } else {
                    winston.error("GET ERR : ", url, query, response.statusCode);
                    return callback("ERROR[" + response.statusCode + "]" + " : " + body, null);
                }
            }
        });
    } else {
        request({
            uri: url,
            method: method.toString(),
            headers: headers,
            timeout: 2000,
            strictSSL: false,
            rejectUnauthorized: false,
            followRedirect: true,
            maxRedirects: 1,
            body: query
        }, function (error, response, body) {
            if (error) {
                winston.error("POST RESPONSE ERR : ", body);
                return callback("ERROR : " + error);
            } else {
                if (url.indexOf("/restart?t=5") > 0 && url.indexOf(global.systemServiceUrl) == 0) {
                    if (response.statusCode == 204) {
                        winston.debug("POST RESPONSE : ", body);
                        return callback(null, body);
                    } else {
                        winston.error("POST RESPONSE : ", response.statusCode, body);
                        return callback("ERROR[" + response.statusCode + "]", null);
                    }
                } else {
                    if (response.statusCode >= 200 && response.statusCode < 300) {
                        winston.debug("POST RESPONSE : ", body);
                        return callback(null, body);
                    } else {
                        winston.error("POST RESPONSE : ", response.statusCode, body);
                        return callback("ERROR[" + response.statusCode + "]" + " : " + body, null);
                    }
                }

            }
        });
    }
};

exports.httpReq = (req, callback) => {
    request(req, function (error, res, body) {
        if (error) {  // error
            callback(error, null);
        } else if (res.statusCode < 200 || res.statusCode >= 300) { // fail
            callback(res.body, {'statusCode': res.statusCode, 'body': res.body });
        } else {  // success
            callback(null, res);
        }
    });
};

exports.promise_httpReq = (req) => {
    return new Promise((resolved, rejected) => {
        request(req, function (error, response, body) {
            if (!error) {
                if (response.statusCode < 200 || response.statusCode >= 300) rejected(Error(response.statusCode));
                else resolved(response);
            } else rejected(Error(error));
        })
    });
};


exports.push = function (method, url, query, callback) {
    winston.debug("method / url : ", method + " / " + url);
    winston.debug("query : ", query);

    if (method.toString().toUpperCase() == 'GET') {
        request({
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            uri: url,
            method: method.toString().toUpperCase(),
            strictSSL: false,
            rejectUnauthorized: false,
            agent: false,
            timeout: 10000,
            followRedirect: true,
            maxRedirects: 10,
            qs: query
        }, function (error, response, body) {
            if (error) {
                winston.error("GET ERR : ", error);
                return callback("ERROR : " + error);
            } else {
                if (response.statusCode > 200 || response.statusCode < 300) {
                    return callback(null, body);
                } else {
                    winston.error("GET ERR : ", response.statusCode);
                    return callback("ERROR[" + response.statusCode + "]", null);
                }
            }
        });
    } else {
        request({
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            strictSSL: false,
            rejectUnauthorized: false,
            agent: false,
            uri: url,
            method: method.toString(),
            qs: query
        }, function (error, response, body) {
            winston.debug("POST RESPONSE : ", body);
            if (error) {
                winston.error("POST ERROR : ", error)
                return callback("ERROR : " + error);
            } else {
                if (response.statusCode > 200 || response.statusCode < 300) {
                    return callback(null, body);
                } else {
                    winston.error("POST ERR : ", response.statusCode);
                    return callback("ERROR[" + response.statusCode + "]", null);
                }
            }
        });
    }
};