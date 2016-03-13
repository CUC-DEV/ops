const http = require( "http" );
const request = require( "superagent" );
const charset = require( "superagent-charset" );
charset( request );
const winston = require( "winston" );
const logger = new winston.Logger( {
    transports: [
        new ( winston.transports.File )( {
            name: "info-file",
            filename: "autoConnect.log",
            handleExceptions: true,
            level: "debug",
            json: false
        } ),
        new winston.transports.Console( {
            level: "info",
            handleExceptions: true,
            json: false,
            colorize: true
        } )
    ],
    exitOnError: false
} );

//Overwrite info function to add date for every log
var infoFunc = logger.info;
logger.info = function() {
    var args = Array.prototype.slice.call( arguments );
    if ( args.length < 2 ) {
        args.unshift( "[" + new Date().toLocaleString() + "]" );
    } else {
        args[ 0 ] = "[" + new Date().toLocaleString() + " " + args[ 0 ] + "]";
    }
    infoFunc.apply( logger, args );
};
var totalTry = 0;
const maxTotalTry = 10;
var sessionCookies = [];
const account = "201010013082";

//Var passwd='qiuzihe654321';
const MODULE = "8099df2c3f092c05cccb6f24d5173860bf1772d7f7b8b60f5079a1b80700045d6f1b1c06d8b664515a4add8f3925e4fb053da7cd567b6be7c0d9f11218cf4e91";
const EMPOENT = "10001";
const encryptPwd = "PpW0BXegCg5Me+vRQ8cSLcXDMSw2eySHzG4J+lPUSOi6zqGPufwmc3bY4gs9eQxk\n2Z/0R9ck7dK+166EI5qL/A==";

function get( endpoint, data, logword, addCookies, ignoreResBody ) {
    logger.info( "################## " + logword.toUpperCase() + " ###################" );
    return new Promise( function( resolve, reject ) {
        data._dc = ( new Date() ).getTime();
        logger.info( "REQUEST PARAM", JSON.stringify( data ) );
        var req = request.get( endpoint )
            .query( data )
            .charset( "gbk" )
            .accept( "json" )
            .set( "X-Requested-With", "XMLHttpRequest" )
            .set( "Connection", "keep-alive" )
            .set( "User-Agent", "Mozilla/5.0(Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 Safari/537.36" );
        if ( addCookies ) {
            logger.info( "COOKIE SENT", sessionCookies.join( "; " ) );
            req.set( "Cookie", sessionCookies.join( "; " ) );
        }
        req.end( function( err, res ) {
            logger.info( "ENDPOINT", endpoint );
            logger.info( "HEADER", JSON.stringify( res.headers ) );
            if ( err ) {
                logger.error( "ERROR", error );
                reject( err );
            } else {
                if ( ignoreResBody ) {
                    logger.silly( "BODY", res.text );
                } else {
                    logger.info( "BODY", res.text );
                }
                if ( Array.isArray( res.headers[ "set-cookie" ] ) && res.headers[ "set-cookie" ].length ) {
                    var cookie = res.headers[ "set-cookie" ][ 0 ];
                    logger.info( "NEW COOKIE FROM SEVER", res.headers[ "set-cookie" ] );
                    sessionCookies.push( cookie.split( ";" )[ 0 ] );
                }
                resolve( res );
            }
        } );
    } );
}

function autoConnect() {
    get( "https://account.cuc.edu.cn/connect/201303/index.jsp\?locale\=zh", {}, "init", false, true )
        .then( res => get( "https://account.cuc.edu.cn/notice/msg.jsp", { act: 0 }, "msg", false, true ) )
        .then( res => get( "https://account.cuc.edu.cn/connect/ws/ws_login.jsp", { act: 2, userid: account, passwd: encryptPwd }, "login", true ) )
        .then( res => get( "https://account.cuc.edu.cn/connect/ws/ws_action.jsp", { act: 4 }, "connect", true ) )
        .then( keepAlive );
}

function keepAlive( res ) {
    if ( !res.text.success ) {
        reconnect();
    } else {
        get( "https://account.cuc.edu.cn/connect/ws/ws_action.jsp", { act: 6 }, "alive", true, true )
            .then( res => {
                var json = JSON.parse( res.text );
                logger.info( "ALIVE RESPONSE BODY", JSON.stringify( res.text ) );
                if ( json.success && json.hasLogin ) {
                    logger.info( "ALIVE", "keep" );
                    setTimeout( keepAlive, 60000 );
                } else {
                    reconnect();
                }
            } );
    }
}

function reconnect() {
    if ( totalTry < maxTotalTry ) {
        totalTry++;
        var waitingTime = Math.pow( 2, totalTry );
        logger.info( "ALIVE", "reconnect in " + waitingTime + " minutes" );
        sessionCookies = [];
        setTimeout( autoConnect, waitingTime * 60000 );
    } else {
        logger.info( "ALIVE", "exit : up to max(" + maxTotalTry + ") attempt times" );
        process.exit();
    }
}

autoConnect();
