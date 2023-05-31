'use strict';
const moment = require('moment');
const xss = require('xss');
module.exports = function(server) {
  let remotes = server.remotes();
  let models = server.models;

  const xssFilter = (str) => {
    let rtnValue = str;
    try {
      rtnValue = str.replace(/(\b)(on\S+)(\s*)=|javascript|(<\s*)(\/*)script/ig, '');
      return rtnValue;
    } catch(e) {
      return str;
    }
  };

  remotes.before('**',function(ctx,next,method) {
    try {
      if(ctx.req.remotingContext.params) {
        for (const [key, value] of Object.entries(ctx.req.remotingContext.params)) {
          if(typeof value === 'string') {
            //ctx.req.remotingContext.params[key] = xssFilter(value);
          }
        }
      }

      if(ctx.req.remotingContext.body) {
        for (const [key, value] of Object.entries(ctx.req.remotingContext.body)) {
          if(typeof value === 'string') {
            ctx.req.remotingContext.body[key] = xssFilter(value);
          }
        }
      }

      if(ctx.req.remotingContext.args) {
        for (const [key, value] of Object.entries(ctx.req.remotingContext.args)) {
          if(typeof value === 'string') {
            ctx.req.remotingContext.args[key] = xssFilter(value);
          }
          else if(typeof value === 'object' && key !== 'req') {
            for (const [key1, value1] of Object.entries(value)) {
              if(typeof value1 === 'string') {
                ctx.req.remotingContext.args[key][key1] = xssFilter(value1);
              }
            }
          }
        }
      }
    } catch(e) {
      console.log(e);
    }


    if(ctx.methodString === "account.logout") {
      next();
    }
    else {
      next();
    }

  });
  remotes.after('**',function(ctx,next){
    global.slogger.addInfoLog("Remote after ", "[" + ctx.req.ip + "]" + ctx.methodString, ctx.args);
    //
    ///////////////////////////////////////////////////////////
    ////감사로그 설정
    ///////////////////////////////////////////////////////////
    let username;
    let token = ctx.args.options ? ctx.args.options.accessToken:undefined;
    let pattern = /((?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))/g;
    let ip_value = ctx.req.ip.match(pattern);
    let userRole;

    if(token === undefined) {
      token = ctx.args.options ? ctx.args.options.accessToken:undefined;
    }
    if(token === undefined) {
      token = ctx.req ? ctx.req.accessToken:undefined;
    }
    if(token) {
      try {
        if(ctx.req.accessToken) {
          const now = moment().utcOffset(0).format('YYYY-MM-DD HH:mm:ss');
          const dataSource = models['Account'].getDataSource().connector;
          const query = `update dti.AccessToken set created = '${now}' where id = '${token.id}'`;
          dataSource.execute(query, '', function (err, result) {
            if(result) {
              console.log(result);
            }
            if(err) {
              console.log(err);
            }
          });
        }
      } catch(e) {
        console.log(e);
      }

      models['Account'].findById(token.userId,function(err,user) {
        username = user && user.username;
        userRole = user && user.role;
        try {
          if(userRole === '1') {
            username = user && user.username;
              models['AuditLog'].add(ctx.methodString, ctx.args, ctx.req.ip, 'EXC', username, null, function (err, res) {
              });
              next();
          }
          else {
            models['AuditLog'].add(ctx.methodString, ctx.args, ctx.req.ip, 'EXC', username, null, function (err, res) {
            });
            next();
          }
        } catch(Err) {
          logger.error(Err);
          next();
        }
      });

    }
    else { //login
      if(ctx.methodString === "account.login") {
        username = ctx.args.credentials.username;

        models['Account'].find({where : {username:username}}, function(err,user){
          userRole = user[0].role;
          if(userRole ==='1') {
              models['AuditLog'].add(ctx.methodString, ctx.args, ctx.req.ip, 'EXC', username, null, function(err, res){
              });
              next();
          }
          else {
            models['AuditLog'].add(ctx.methodString, ctx.args, ctx.req.ip, 'EXC', username, null, function(err, res){
            });
            next();
          }
        })
      }
      else {
        next();
      }
    }
  });


  remotes.afterError('**',function(ctx,next){
    global.slogger.addInfoLog("Remote afterError ","["+ctx.req.ip+"]"+ctx.methodString, ctx.error);
    ///////////////////////////////////////////////////////////
    ////감사로그 설정
    ///////////////////////////////////////////////////////////
    let username;
    let token = ctx.args.options ? ctx.args.options.accessToken:undefined;
    if(token === undefined) {
      token = ctx.args.options ? ctx.args.options.accessToken:undefined;
    }
    if(token === undefined) {
      token = ctx.req ? ctx.req.accessToken:undefined;
    }
    if(token) {
      models['Account'].findById(token.userId,function(err,user){
        username = user && user.username;
        models['AuditLog'].add(ctx.methodString, ctx.args, ctx.req.ip, 'ERR', username, null, function(err, res){
        });
      })
    }
    else { //login request
      if(ctx.methodString === "account.login") {
        username = ctx.args.credentials.username;
        console.log(username);
        models['AuditLog'].add(ctx.methodString, ctx.args, ctx.req.ip, 'ERR', username, null, function(err, res){
        });
      }
    }
    next();
  });
};
