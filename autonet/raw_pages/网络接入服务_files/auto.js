var http = require('http');
var request = require('superagent');
var Promise = require('promise');
var charset = require('superagent-charset');
charset(request);
var winston = require('winston');
var logger = new winston.Logger({
    transports: [
        new (winston.transports.File)({
        name: 'info-file',
        filename: 'autoConnect.log',
        handleExceptions: true,
        level: 'debug',
        json: false,
        }),
        new winston.transports.Console({
            level: 'info',
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

var infoFunc = logger.info;
logger.info = function(){
    var args = Array.prototype.slice.call(arguments);
    if(args.length <2){
        args.unshift('['+ new Date().toLocaleString()+']');
    }else{
         args[0] = '['+ new Date().toLocaleString()+ ' ' + args[0]+ ']';
    }
    infoFunc.apply(logger, args);
}

var sessionCookies = [];
var account='201010013082';
//var passwd='qiuzihe654321';
var MODULE = "8099df2c3f092c05cccb6f24d5173860bf1772d7f7b8b60f5079a1b80700045d6f1b1c06d8b664515a4add8f3925e4fb053da7cd567b6be7c0d9f11218cf4e91";
var EMPOENT = "10001";
var encryptPwd = "PpW0BXegCg5Me+vRQ8cSLcXDMSw2eySHzG4J+lPUSOi6zqGPufwmc3bY4gs9eQxk\n2Z/0R9ck7dK+166EI5qL/A=="
function get(endpoint, data, prefix, cookies, ignoreResInfo, json){
    logger.info("################## "+prefix.toUpperCase()+" ###################");
    return new Promise(function (resolve, reject) {
        data['_dc'] = (new Date()).getTime();
        logger.info("REQUEST PARAM", JSON.stringify(data));
        var req = request.get(endpoint)
        .query(data)
        .charset('gbk')
        .accept('json')
        .set('X-Requested-With','XMLHttpRequest')
        .set('Connection','keep-alive')
        .set('User-Agent','Mozilla/5.0(Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 Safari/537.36');
        if(cookies){
            logger.info('COOKIE SENT', cookies);
            req.set('Cookie', cookies);
        }
        req.end(function(err,res) {
            logger.info("ENDPOINT", endpoint);
            if (err) {
                logger.error("ERROR", error);
                reject(err);
            }
            else{
                if(ignoreResInfo){
                    logger.silly( "BODY" , res.text);
                }else{
                    logger.info( "BODY" , res.text);
                }
            logger.info("HEADER", JSON.stringify(res.headers));
            if(Array.isArray(res.headers['set-cookie']) && res.headers['set-cookie'].length){
                var cookie = res.headers['set-cookie'][0];
                logger.info("NEW COOKIE", res.headers['set-cookie']);
                sessionCookies.push(cookie.split(";")[0]);
            }
            resolve(res);
            }
        });
    })
}
        
function automateConnectCUCnet(){
    get("https://account.cuc.edu.cn/connect/201303/index.jsp\?locale\=zh",{},'init', null, true)
    .then(res => get("https://account.cuc.edu.cn/notice/msg.jsp", {act:0}, 'msg', null, true))
    .then(res => get("https://account.cuc.edu.cn/connect/ws/ws_login.jsp", { act: 2, userid: account, passwd: encryptPwd}, 'login', sessionCookies.join("; ")))
    .then(res => get("https://account.cuc.edu.cn/connect/ws/ws_action.jsp", {act:4}, 'connect', sessionCookies.join("; ")))
    .then(keepAlive);
}

function keepAlive(res){
   get("https://account.cuc.edu.cn/connect/ws/ws_action.jsp", {act:6}, 'alive', sessionCookies.join("; "))
   .then(res=>{
       var json = JSON.parse(res.text);
       logger.debug("ALIVE RESPONSE BODY", res.text);
       if(json.success && json.hasLogin){
           logger.info("ALIVE", "keep");
           setTimeout(keepAlive, 60000);
       }else{
           logger.info("ALIVE","reconnect");
           sessionCookies = [];
           automateConnectCUCnet();
       }
   })
}

automateConnectCUCnet();