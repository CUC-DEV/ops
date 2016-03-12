$(document).bind("mobileinit", function(){
	$.mobile.ajaxEnabled=false;
	$.extend($.mobile , {
  	defaultPageTransition: "none"
  });
});

function initKey() {
	setMaxDigits(MODULE.length/2+3);
	KEY = new RSAKeyPair(EMPOENT, "", MODULE);
}

function login() {
	if (($("#userid").val() == "") || ($("#passwd").val() == "")) {
 		alert(LMSG.msg1);
 	} else {
 		$("#ar_connect").attr("value", LMSG.msg2);
 		$("#ar_connect").button("refresh");
 		var rsa = new RSAKey();
  	rsa.setPublic(MODULE, EMPOENT);
		var passwd =  rsa.encrypt($("#passwd").val());
		if (passwd) {
			passwd = linebrk(hex2b64(passwd), 64);
            console.log(passwd);
			$.get(
				"/connect/ws/ws_login.jsp",
				{
					_dc: (new Date()).getTime(),
					act: 2,
					userid: $("#userid").val(),
					passwd: passwd
				},
				function(json) {
					if(json.success) {
						CONNECT_TIME = json.startTime;
						var conn_method = $("input[name='conn_method']:checked").val();
						if (conn_method == null) {
							connectInternet();
						} else if (conn_method == 1) {
							connectCampus(1);
						} else if (conn_method == 2) {
							connectCampus(2);
						}
					} else {
						alert(json.msg);
					}
					$("#ar_connect").attr("value", LMSG.msg3);
 					$("#ar_connect").button("refresh");
				},
				"json"
			);
		} else {
			alert("����ʧ�ܣ���ʹ�þɰ���¼");
		}
	}
}

function logout(waittime) {
	$.get(
		"/connect/ws/ws_login.jsp",
		{
			_dc: (new Date()).getTime(),
			act: 3,
			waittime: waittime
		},
		function(json) {
			if (json.success) {
				unBindUnload();
				window.location.href = "./index.jsp";
			}
		},
		"json"
	);
}

function disconnect() {
	disconnectCampus();
	disconnectInternet();
	logout(1000); //Ϊ���öϿ����������Ƚ���,�ȴ�1sʱ��
}

function connectCampus(conn_method) {
	$("#sp_campus").html(LMSG.msg4);
	$.get(
		"/connect/ws/ws_action.jsp",
		{
			_dc: (new Date()).getTime(),
			act: 2
		},
		function(json) {
			if (json.success) {
				$("#sp_campus").html(LMSG.msg5);
				hideConnect();
				$("#tr_onlinetime").show();
				startTimer();
				saveCookie();
				if (conn_method == 2) { //ͬʱ���ӻ�����
					connectInternet();
				}
			} else {
				alert(json.msg+":"+getIcType(json.ic_type));
			}
		},
		"json"
	)
}

function disconnectCampus() {
	$.get(
		"/connect/ws/ws_action.jsp",
		{
			_dc: (new Date()).getTime(),
			act: 3
		},
		function(json) {
			showConnect();
			hideStatus();
		},
		"json"
	)
}

function connectInternet() {
	$("#sp_internet").html(LMSG.msg6);
	$.get(
		"/connect/ws/ws_action.jsp",
		{
			_dc: (new Date()).getTime(),
			act: 4
		},
		function(json) {
			if (json.success) {
				$("#sp_internet").html(LMSG.msg7);
				startTimer();
				saveCookie();
				hideConnect();
				showStatus();
				if (IsMobile) {
					setTimeout("window.location.reload()", 1000);
				}
			} else {
				alert(json.msg+":"+getIcType(json.ic_type));
			}
		},
		"json"
	)
}

function disconnectInternet() {
	$.get(
		"/connect/ws/ws_action.jsp",
		{
			_dc: (new Date()).getTime(),
			act: 5
		},
		function(json) {
			showConnect();
			hideStatus();
		},
		"json"
	)
}

function getInfo() {
	$.get(
		"/connect/ws/ws_action.jsp",
		{
			_dc: (new Date()).getTime(),
			act: 6
		},
		function(json) {
			if (json.success) {
				var bridge = json.bridge;
				var keeper = json.keeper;
				if (bridge) {
					if (bridge.ic_type == 1) {
						$("#sp_campus").html(LMSG.msg5);
					} else {
						$("#sp_campus").html(LMSG.msg8+getIcType(bridge.ic_type));
						stopTimer();
					}
				} else { //bridge Ϊ�ձ�ʾ������ip
					$("#sp_campus").html(LMSG.msg5);
				}
				if (keeper) {
					if (keeper.ic_type == 1) {
						$("#sp_internet").html(LMSG.msg7);
						switch(keeper.ip_status) {
							case 132: {
								$("#td_charge").html(LMSG.msg9);
							}
							break;
							case 133: {
								$("#td_charge").html(LMSG.msg10);
							}
							break;
							case 130: //Ĭ��
							default: {
								$("#td_charge").html(LMSG.msg11);
							}
						}
						if ((keeper.out_bytes != null) && (keeper.in_bytes != null)) {
							$("#td_flux").html(LMSG.msg12+formatSize(keeper.out_bytes)+LMSG.msg13+formatSize(keeper.in_bytes));
						}
						if (keeper.allow_flux != null) {
							if (keeper.allow_flux == -1) {
								$("#td_allowflux").html(LMSG.msg10);
							} else {
								$("#td_allowflux").html(formatSize(keeper.allow_flux));
							}
						}
					} else {
						$("#sp_internet").html(LMSG.msg14+getIcType(keeper.ic_type));
						if ((json.hasLogin) && ((bridge == null) || (bridge.ic_type == 1))) { //�е�¼��Ϣ������������ip��������ip�ѵ�¼У԰��
							$("#sp_internet").append("<br><input type=button value='"+LMSG.msg15+"' onclick='javascript:connectInternet();'>");
						}
						if (bridge == null) { //��������ip,��ֹͣȡ��Ϣ
							stopTimer();
						}
					}
					if (json.hasLogin) {
						listIps();
					}
					//alert("keeper:"+json.keeper.ic_type+", "+json.keeper.ip_status+", "+json.keeper.allow_flux+", "+json.keeper.in_bytes+", "+json.keeper.out_bytes);
				}
			} else {
				stopTimer();
				alert(json.msg);
			}
		},
		"json"
	)
}

function listIps() {
	$("#ul_online").empty();
	$("#ul_online").append("<li data-role='list-divider'>���˺Ż�������IP��ַ��½</li>");
	$.get(
		"/connect/ws/ws_action.jsp",
		{
			_dc: (new Date()).getTime(),
			act: 7
		},
		function(json) {
			if (json.success) {
				var ips = new Array();
				if (json.kpips.length > 0) {
					for (var i=0; i<json.kpips.length; i++) {
						var str = "";
						var ip = json.kpips[i];
						ips[ips.length] = ip;
					}
				}
				if (json.bgips.length > 0) {
					for (var i=0; i<json.bgips.length; i++) {
						var str = "";
						var ip = json.bgips[i];
						var flag = 1;
						for (var j=0; j<ips.length; j++) {
							if (ips[j].userIp == ip.userIp) {
								flag = 0;
								break;
							}
						}
						if (flag == 1) {
							ips[ips.length] = ip;
						}
					}
				}

				if (ips.length > 0) {
					var count = 0;
					for (var i=0; i<ips.length; i++) {
						var str = "";
						var ip = ips[i];
						if (MYIP != ip.ipstr) {
							count++;
							str += "<li><a href='#'>";
							str += "<h3>"+ip.ipstr;
							if ((ip.status & 2) > 0) {
								str += "["+LMSG.msg16+"]</h3>";
							} else if ((ip.status & 1) > 0) {
								str += "["+LMSG.msg17+"]</h3>";
							}


							str += "<p>"+ip.startTimeCal+"</p>";
							str += "<a href='javascript:void(0)' onclick='javascript:kickIp(\""+ip.ipstr+"\");' class='blue_link'>"+LMSG.msg18+"</a></li>";
							$("#ul_online").append(str);
						}
					}
					if (count > 0) {
						$("#div_online").show();
						$("#ul_online").listview("refresh");
					} else {
						$("#div_online").hide();
					}
				} else {
					$("#div_online").hide();
				}
			} else {
				alert(json.msg);
			}
		},
		"json"
	);
}

function kickIp(cip) {
	if (confirm(LMSG.msg19+cip+LMSG.msg20)) {
		$.get(
			"/connect/ws/ws_action.jsp",
			{
				_dc: (new Date()).getTime(),
				act: 8,
				cip: cip
			},
			function(json) {
				if (json.success) {
					listIps();
				} else {
					alert(json.msg);
				}
			},
			"json"
		);
	}
}

function keepAlive() {
	var alivetime = parseInt($("#alivetime").val());
	if (alivetime > 0) {
		$("#alivetime").val(0);
		$.get(
			"/connect/keepactive.jsp",
			{
				_dc: (new Date()).getTime(),
				"s": alivetime
			},
			function (data) {

			},
			"json"
		);
	}
}

function getNotice() {
	$.get(
		"/notice/msg.jsp",
		{
			_dc: (new Date()).getTime(),
			"act": 0
		},
		function (data) {
			if (data.success) {
				if (data.total > 0) {
					var msg = data.msgs[0];
					var pre_time = $.cookie('INFO_TIMESTAMP');
					if (pre_time < msg.timestampLong) {
						$("#notice_timestamp").val(msg.timestampLong);
						$("#div_notice_content").html(msg.content);
						$("#div_notice").popup("open");
					}
				}
			}
		},
		"json"
	);
}

function setSessionTime() {
	SetSession = 1;
	$("#div_mobileinfo").popup("open");
}

function startTimer() {
	keepAlive();
	getNotice();
	getInfo();
	if (TIMER_NOTICE == 0) {
		TIMER_NOTICE = setInterval("getNotice()", 60000);
	}
	if (TIMER_GETINFO == 0) {
		TIMER_GETINFO = setInterval("getInfo()", 60000);
	}
	if (TIMER_ONLINETIME == 0) {
		TIMER_ONLINETIME = setInterval("dispTime()", 1000);
	}
	bindUnload();
}

function stopTimer() {
	clearInterval(TIMER_NOTICE);
	TIMER_NOTICE = 0;
	clearInterval(TIMER_GETINFO);
	TIMER_GETINFO = 0;
	clearInterval(TIMER_ONLINETIME);
	TIMER_ONLINETIME = 0;
	$("#ar_reconnect").parent().show();
	unBindUnload();
}

function dispTime() {
	var duration = (new Date()).getTime() - CONNECT_TIME;
	if (duration < 0) {
		$("#td_onlinetime").html("00:00:00");
	}	else {
		duration = Math.floor(duration/1000);
		s1=Math.floor(duration/3600);
		s2=Math.floor((duration-s1*3600)/60);
		s3=duration-s1*3600-s2*60;
		$("#td_onlinetime").html((s1 <10 ? "0"+s1 : s1) +":"+ (s2 < 10 ? "0"+s2 : s2) +":"+ (s3 < 10 ? "0"+s3 : s3));
	}
}

function hideConnect() {
	$("#tr_connmethod").hide();
	$("#tr_passwd").hide();
	$("#tr_settime").hide();
	$("#tr_cookie").hide();
	$("#ar_connect").parent().hide();
	$("#ar_disconnect").parent().show();
}

function showConnect() {
	$("#tr_connmethod").show();
	$("#tr_passwd").show();
	$("#tr_settime").show();
	$("#tr_cookie").show();
	$("#ar_connect").parent().show();
	$("#ar_disconnect").parent().hide();
}

function hideStatus() {
	$("#tr_onlinetime").hide();
	$("#tr_charge").hide();
	$("#tr_flux").hide();
	$("#tr_allowflux").hide();
}

function showStatus() {
	$("#tr_onlinetime").show();
	$("#tr_charge").show();
	$("#tr_flux").show();
	$("#tr_allowflux").show();
}

function saveCookie() {
	var saveuid = (($("#saveuid").attr("checked") == null) ? "false" : "true");
	var savepsw = (($("#savepsw").attr("checked") == null) ? "false" : "true");
	if (saveuid || savepsw) {
		var rsa = new RSAKey();
  	rsa.setPublic(MODULE, EMPOENT);
		var passwd =  rsa.encrypt($("#passwd").val());
		if (passwd) {
			passwd = linebrk(hex2b64(passwd), 64);
			$.get(
				"/connect/cookie_act.jsp",
				{
					_dc: (new Date()).getTime(),
					act: 1,
					saveuid: saveuid,
					savepsw: savepsw,
					userid: $("#userid").val(),
					passwd: passwd
				},
				function(json) {
					if(!json.success) {
						alert(json.msg);
					}
				},
				"json"
			);
		} else {
			alert("����ʧ�ܣ���ʹ�þɰ���¼");
		}
	}
}

function clearCookie() {
	$.get(
		"/connect/cookie_act.jsp",
		{
			_dc: (new Date()).getTime(),
			act:2
		},
		function(json) {
			if (json.success) {
				$("#userid").val("");
				$("#passwd").val("");
				$("#saveuid").removeAttr("checked").checkboxradio("refresh");
				$("#savepsw").removeAttr("checked").checkboxradio("refresh");
			}
		},
		"json"
	);
}

function getIcType(ic_type) {
	var str = LMSG.msg21;
	switch(ic_type) {
		case -1: {
			str = LMSG.msg22;
		}
		break;
		case 1: {
			str = LMSG.msg23;
		}
		break;
		case 15: {
			str = LMSG.msg24;
		}
		break;
		case 31: {
			str = LMSG.msg25;
		}
		break;
		case 47: {
			str = LMSG.msg25;
		}
		break;
		case 63: {
			str = LMSG.msg26;
		}
		break;
		case 79: {
			str = LMSG.msg27;
		}
		break;
		case 95: {
			str = LMSG.msg28;
		}
		break;
		case 111: {
			str = LMSG.msg29;
		}
		break;
		case 143: {
			str = LMSG.msg30;
		}
		break;
		case 159: {
			str = LMSG.msg31;
		}
		break;
		case 175: {
			str = LMSG.msg32; //"������������";
		}
		break;
		case 191: {
			//str = "���˺�ͬʱ�����ߵ�IP����3��";  //���ε�¼������������Ϣ
			str = LMSG.msg33; //
		}
		break;
		case 223: {
			str = LMSG.msg34;
		}
		break;
		case 239: {
			str = LMSG.msg35;
		}
		break;
		case 255: {
			str = LMSG.msg36;
		}
		break;
	}
	return str;
}

function bindUnload() {
	$(window).bind("beforeunload", function() {
		return LMSG.msg37;
	});
}

function unBindUnload() {
	$(window).unbind("beforeunload");
}

function formatFloat(num, pos) {
  return Math.round(num * Math.pow(10, pos)) / Math.pow(10, pos);
}

function formatSize(size) {
	var kbyte = 1024;
	var mbyte = 1024*kbyte;
	var gbyte = 1024*mbyte;
	if (size <= 0) {
		return "0";
	} else if ((size > 0) && (size < 0.1*kbyte)) {
		return size + "B";
	} else if ((size > 0.1*kbyte) && (size < 0.1*mbyte)) {
		return formatFloat((size / kbyte), 2) + "KB";
	} else if ((size >= 0.1*mbyte) && (size < 0.1*gbyte)) {
		return formatFloat((size / mbyte), 2) + "MB";
	} else if (size >= 0.1*gbyte) {
		return formatFloat((size / gbyte), 2) + "GB";
	} else {
		return size;
	}
}
