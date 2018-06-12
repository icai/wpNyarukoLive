var video = document.getElementById('nyarukolive_video');
var videosrc = document.getElementById('nyarukolive_videosrc');
var pauseboxi = document.getElementById('nyarukolive_playbtn');
var pauseboxi2 = document.getElementById('nyarukolive_btnplayi');
var nyarukolivediv = document.getElementById('nyarukolive');
var sendbtn = document.getElementById('nyarukolive_sendbtn');
var sendwaittimer = document.getElementById('nyarukolive_sendbtn');
var btndanmusentwait = document.getElementById('nyarukolive_btndanmusentwait');
var btndanmusent = document.getElementById('nyarukolive_btndanmusent');
var player = null;
var ready = false;
var playing = false;
var nyarukolive_playermode = 0;
var nyarukolive_flv = "";
var nyarukolive_hls = "";
var nyarukolive_protocol = "";
var nyarukolive_timezone = 10000;
var isfullScreen = false;
var nyarukolive_barragecache = [];
var nyarukolive_updatebarragespeed = 300;
var nyarukolive_updatestatusspeed = 5000;
var nyarukolive_oldbarrageid = 0;
var nyarukolive_update_frequency = 5;
var nyarukolive_dmnum = 0;
var nyarukolive_dmW = 0;
var nyarukolive_dmH = 26;//防错弹幕初始高，根据字号，字体修改
var nyarukolive_dmTop = 10;//弹幕初始top
var nyarukolive_dmspacing = 5;//弹幕行距
var nyarukolive_dmObj = [];
var nyarukolive_dmtime = 5000;//弹幕速度
function nyarukolive_loadconfig(config) {
    if (config["pcode"] && config["pinfo"]) {
        console.log("wpNyarukoLive Status", config["pcode"], config["pinfo"]);
        return 1;
    }
    if (config["mode"]) nyarukolive_playermode = parseInt(config["mode"]);
    if (config["flv"]) nyarukolive_flv = config["flv"];
    if (config["hls"]) nyarukolive_hls = config["hls"];
    if (nyarukolive_playermode == 0 && nyarukolive_flv == "" && nyarukolive_hls == "") {
        return 2;
    } else if (nyarukolive_playermode == 1 && nyarukolive_flv == "") {
        return 3;
    } else if ((nyarukolive_playermode == 2 || nyarukolive_playermode == 3) && nyarukolive_hls == "") {
        return 4;
    }
    if (config["protocol"]) nyarukolive_protocol = config["protocol"];
    if (config["pluginurl"]) nyarukolive_pluginurl = config["pluginurl"];
    if (config["timezone"]) nyarukolive_timezone = parseInt(config["timezone"]);
    return 0;
}
function nyarukolive_selectmode(nmode) {
    mode = nmode;
    if (mode == 0) {
        autoselectmode();
    } else if (mode == 1) {
        console.log("flv mode",nyarukolive_flv);
        player = flvjs.createPlayer({
            type: 'flv',
            url: nyarukolive_flv
        });
        player.attachMediaElement(video);
        player.load();
        nyarukolive_videoready();
    } else if (mode == 2) {
        console.log("hls mode");
        player = new Hls();
        player.loadSource(nyarukolive_hls);
        player.attachMedia(video);
        player.on(Hls.Events.MANIFEST_PARSED,function() {
            nyarukolive_videoready();
        });
    } else if (mode == 3) {
        mode = 3;
        console.log("hls+ mode");
        videosrc.src = nyarukolive_hls;
        player = videojs('nyarukolive_video',{
            bigPlayButton : false,
            textTrackDisplay : false,
            posterImage: false,
            errorDisplay : true,
            controlBar : false
        },function(){
            nyarukolive_videoready();
        });
    }
}
function nyarukolive_videoready() {
    ready = true;
    console.log("ready.");
    // playpausebtn();
}
function nyarukolive_playpausebtn() {
    // if (ready) {
        if (playing) {
            console.log("pause");
            // pauseboxi.style.display='block';
            if (mode == 2) {
                video.pause();
            } else {
                player.pause();
            }
            pauseboxi.style.display='block';
            pauseboxi2.src = nyarukolive_pluginurl+"lib/baseline-play_arrow-24px.svg";
        } else {
            console.log("play");
            // pauseboxi.style.display='none';
            if (mode == 2) {
                video.play();
            } else {
                player.play();
            }
            pauseboxi.style.display='none';
            pauseboxi2.src = nyarukolive_pluginurl+"lib/baseline-pause-24px.svg";
        }
        playing = !playing;
    // } else {
    //     console.log("no ready");
    // }
}
function nyarukolive_error(err) {
    document.getElementById('nyarukolive').innerHTML = '<div id="nyarukolive_errorinfo" class="nyarukolive_errordig"><p><b>直播播放器加载失败</b></p><p>错误代码：'+err+'</p></div>';
}
function chkhttps() {
    var newurl = "";
    var newprotocol = "";
    if (nyarukolive_protocol == "https" && document.location.protocol != "https:") {
        newurl = window.location.href.replace(/http:/, "https:");
        newprotocol = "S";
    } else if (nyarukolive_protocol == "http" && document.location.protocol != "http:") {
        newurl = window.location.href.replace(/https:/, "http:");
    }
    if (newurl != "") {
        document.getElementById('nyarukolive').innerHTML = '<div id="nyarukolive_errorinfo" class="nyarukolive_warndig"><p><b>正在配置传输协议</b></p><p>正在配置 HTTP'+newprotocol+' ...</p></div>';
        setTimeout("window.location.href='"+newurl+"';",1000);
        return false;
    }
    return true;
}
function nyarukolive_showalert(text) {
    if ($("#nyarukolive_alert").length > 0) {
        $("#nyarukolive_alert").stop();
        $("#nyarukolive_alert").remove();
    }
    var nyarukolive_alertbox = document.getElementById("nyarukolive_alertbox");
    nyarukolive_alertbox.innerHTML = '<div id="nyarukolive_alert">'+text+'</div>';
    $("#nyarukolive_alert").fadeOut(3000,function() {
        $("#nyarukolive_alert").remove();
    });
}
function updatetime() {
    if (btndanmusent.style.display == "none") {
        var newsec = parseInt(btndanmusentwait.innerText) - 1;
        if (newsec <= 0) {
            btndanmusentwait.innerText = nyarukolive_update_frequency+" ";
            btndanmusentwait.style.display = "none";
            btndanmusent.style.display = "inline-block";
        } else {
            btndanmusentwait.innerText = newsec+" ";
        }
    }
    var dt = new Date();
    var localtimestr = (updatetimezero(dt.getHours()) + ":" + updatetimezero(dt.getMinutes()) + ":" + updatetimezero(dt.getSeconds()));
    if (document.getElementById('nyarukolive_ltime')) document.getElementById('nyarukolive_ltime').innerText = localtimestr;
    if (nyarukolive_timezone != 10000) {
        var def = dt.getTimezoneOffset()/60;
        var gmt = (dt.getHours() + def);
        var ending = ":" + updatetimezero(dt.getMinutes()) + ":" + updatetimezero(dt.getSeconds());
        var gmtadd = gmt + nyarukolive_timezone;
        var wtime = updatetimecheck24((gmtadd > 24) ? (gmtadd - 24) : gmtadd,gmtadd);
        var wtimestr = (updatetimezero(wtime) + ending);
        if (document.getElementById('nyarukolive_wtime')) document.getElementById('nyarukolive_wtime').innerText = wtimestr;
    }
}
function updatetimezero(num) {
    return ((num <= 9) ? ("0" + num) : num);
}
function updatetimecheck24(hour) {
    var newhour = (hour >= 24) ? hour - 24 : hour;
    if (newhour < 0) { newhour += 24; }
    else if (newhour > 24) { newhour -= 24; }
    return newhour;
}
function swmenu(vmenuid,noclose = false) {
    var vmenuname = ["nyarukolive_menu","nyarukolive_usermenu"];
    var nyarukolivemenu = document.getElementById(vmenuname[vmenuid]);
    if (vmenuid == 1) document.getElementById("nyarukolive_danmunick").blur();
    if (nyarukolivemenu.style.display != "block") {
        nyarukolivemenu.style.display = "block";
        if (vmenuid == 1) document.getElementById("nyarukolive_dmuname").focus();
    } else {
        if (!noclose) nyarukolivemenu.style.display = "none";
    }
}
function saveguestname() {
    var guestname = document.getElementById("nyarukolive_dmuname").value;
    var guestmail = document.getElementById("nyarukolive_dmumail").value;
    var guesturl = document.getElementById("nyarukolive_dmuurl").value;
    if (guestname == "" || guestmail == "") {
        nyarukolive_showalert("用户名和电子邮件均不能为空。");
    } else {
        setCookie('nyarukolive_guestname',guestname,365);
        setCookie('nyarukolive_guestmail',guestmail,365);
        setCookie('nyarukolive_guesturl',guesturl.replace(":", ")"),365);
    }
    document.getElementById("nyarukolive_danmunick").value = guestname;
    swmenu(1);
}
function loadguestname($isonlyload = false) {
    var guestname = getCookie('nyarukolive_guestname');
    var guestmail = getCookie('nyarukolive_guestmail');
    var guesturl = getCookie('nyarukolive_guesturl').replace(")", ":");
    if ($isonlyload) {
        return [guestname,guestmail,guesturl];
    }
    document.getElementById("nyarukolive_dmuname").value = guestname;
    document.getElementById("nyarukolive_danmunick").value = guestname;
    document.getElementById("nyarukolive_dmumail").value = guestmail;
    document.getElementById("nyarukolive_dmuurl").value = guesturl;
    swmenu(1);
}
function sendBulletCommentChk() {
    var guestinfos = loadguestname(true);
    var isok = true;
    // for (var i = 0; i < guestinfos.length; i++) {
    //     if (guestinfos[i] != cleartext(guestinfos[i],true)) isok = false;
    // }
    if (guestinfos[0] == "" || guestinfos[1] == "") isok = false;
    if (!isok) {
        document.getElementById("nyarukolive_danmuchat").blur();
        nyarukolive_showalert("请先输入用户信息，点对勾保存");
        swmenu(1,true);
    }
}
function changemodebtn() {

}
function getStatus() {
    var guestinfo = loadguestname(true);
    var gstatus = {
        "api":2,
        "liveid":nyarukolive_config["liveid"],
        "blockbullet":document.getElementById("nyarukolive_blockbullet").value,
        "oldbarrageid":nyarukolive_oldbarrageid,
        "frequency":nyarukolive_update_frequency,
        "limit":50,
        "token":nyarukolive_config["token"],
        "email":guestinfo[1],
        "browsertoken":nyarukolive_config["browsertoken"]
    };
    $.post(nyarukolive_config["api"],gstatus,function(result){
        if (result && result != "") {
            var dmjson = null;
            if (typeof(result) == "object") {
                dmjson = result;
            } else {
                dmjson = $.parseJSON(result);
            }
            if (dmjson.code == 0 && dmjson.isplaying > 0 && dmjson.liveid == nyarukolive_config["liveid"]) {
                dmjson.barrages.forEach(nowdm => {
                    var nowbarrageid = parseInt(nowdm[0]);
                    if (nowbarrageid > nyarukolive_oldbarrageid) {
                        nyarukolive_oldbarrageid = nowbarrageid;
                    }
                });
                nyarukolive_barragecache = dmjson.barrages;
            }
        }
    });
}
function updatestatus() {
    if (nyarukolive_barragecache.length > 0) {
        nyarukolive_sendDanMu(nyarukolive_barragecache[0][5]);
        nyarukolive_barragecache.splice(0,1);
    }
}
function sendBulletComment(iskey=false) {
    if (iskey) {
        if(event.keyCode != 13){
            return;
        }
    }
    var guestinfo = loadguestname(true);
    var danmuchat = document.getElementById("nyarukolive_danmuchat");
    var content = danmuchat.value;
    if (!cleartext(danmuchat,false,true,true)) {
        nyarukolive_showalert("输入中包括不支持的符号");
        return;
    }
    if (content == "") {
        nyarukolive_showalert("弹幕内容不能为空");
        return;
    }
    if (btndanmusent.style.display == "none") {
        nyarukolive_showalert("发送太频繁了，休息一下");
        return;
    }
    var bulletcomment = {
        "api":1,
        "liveid":nyarukolive_config["liveid"],
        "name":guestinfo[0],
        "email":guestinfo[1],
        "url":guestinfo[2],
        "content":content,
        "style":"0:0",
        "token":nyarukolive_config["token"],
        "browsertoken":nyarukolive_config["browsertoken"]
    };
    $.post(nyarukolive_config["api"],bulletcomment,function(result){
        if (result && result != "") {
            var nrjson = null;
            if (typeof(result) == "object") {
                nrjson = result;
            } else {
                nrjson = $.parseJSON(result);
            }
            var jcode = nrjson.code;
            var jmsg = nrjson.msg;
            if (nrjson && typeof(nrjson) == "object") {
                if (jcode == 0) {
                    //nyarukolive_showalert(jmsg); //OK
                    nyarukolive_sendDanMu(nrjson.content,true);
                    danmuchat.value = "";
                } else {
                    sendBulletCommentFail(jmsg);
                }
            } else {
                sendBulletCommentFail("");
            }
        } else {
            sendBulletCommentFail("");
        }
    });
    btndanmusent.style.display = "none";
    btndanmusentwait.innerText = nyarukolive_update_frequency+" ";
    btndanmusentwait.style.display = "inline-block";
}
function sendBulletCommentFail(errinfo) {
    var einfo = "弹幕发送失败。";
    if (errinfo != "") {
        einfo += errinfo;
    }
    nyarukolive_showalert(einfo);
}
function cleartext(thistbox,isstring = false,usefullchar = false,norevalue=false) {
    //new RegExp("[`~!@#$^&*()=|{}':;'\",\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？%+_]")
    var pattern = new RegExp("[`~!@#^&*()|{}':;'\"\\[\\]<>/]");
    if (isstring) {
        if (thistbox == "") return thistbox;
        var svalue = thistbox;
        return svalue.replace(pattern, '');
    } else if (usefullchar && !isstring) {
        if (norevalue) {
            if (thistbox.value != thistbox.value.replace(pattern, '')) {
                thistbox.style.color = '#F00';
                return false;
            } else {
                thistbox.style.color = '';
                return true;
            }
        } else {
            thistbox.value = thistbox.value.replace(pattern, '');
        }
    } else {
        var svalue = thistbox.value;
        var sid = thistbox.id;
        // var keychar = ;
        var rs = "";
        var patterns = [new RegExp("[`~!#$^&*()=|{}';',\\[\\]<>?~！#￥……&*（）——|{}【】‘；：”“'。，、？]")];
        if (sid != "nyarukolive_dmumail") {
            patterns.push(new RegExp("[@]"));
        }
        if (sid != "nyarukolive_dmuurl") {
            patterns.push(new RegExp("[:/]"));
        }
        for (var i = 0; i < svalue.length; i++) {
            var sub = svalue.substr(i, 1);
            for (var j = 0; j < patterns.length; j++) {
                sub = sub.replace(patterns[j], '');
            }
            rs += sub;
        }
        thistbox.value = rs;
    }
}
function setCookie(c_name,value,expiredays)
{
    var exdate=new Date();
    exdate.setDate(exdate.getDate()+expiredays);
    document.cookie=c_name+ "=" +escape(value)+((expiredays==null) ? "" : ";expires="+exdate.toGMTString());
}
function getCookie(c_name)
{
    if (document.cookie.length>0)
    {
        c_start=document.cookie.indexOf(c_name + "=");
        if (c_start!=-1) { 
            c_start=c_start + c_name.length+1;
            c_end=document.cookie.indexOf(";",c_start);
            if (c_end==-1) c_end=document.cookie.length;
            return unescape(document.cookie.substring(c_start,c_end));
        }
    }
    return ""
}
function requestFullScreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
        isfullScreen = true;
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
        isfullScreen = true;
    } else if (element.webkitRequestFullScreen) {
        element.webkitRequestFullScreen();
        isfullScreen = true;
    } else {
        console.log("未能进入全屏");
    }
}
function exitFullscreen(element) {
    if (element.exitFullscreen) {
        element.exitFullscreen();
        isfullScreen = false;
    } else if (element.mozCancelFullScreen) {
        element.mozCancelFullScreen();
        isfullScreen = false;
    } else if (element.webkitCancelFullScreen) {
        element.webkitCancelFullScreen();
        isfullScreen = false;
    } else {
        console.log("未能退出全屏");
    }
}
function fullScreen() {
    if (isfullScreen) {
        exitFullscreen(document);
        console.log("exitFullscreen");
    } else {
        requestFullScreen(nyarukolivediv);
        console.log("requestFullScreen");
    }
}
function removeWpNyarukoNPlayer() {
    if (typeof(yashitheme) != "undefined" && yashitheme == "wpnyarukof") {
        nyarukoplayer_stop();
        // $("#homepage_title1").remove();
        $("#homepage_title2").remove();
        // $("#homepage_titleb").remove();
        // $("#homepage_topimgbox").remove();
        // $("#homepage_title").remove();
        // $(".nyarukoplayer").remove();
    }
}
function setbrowsertoken() {
    var browsertoken = getCookie("nyarukolive_browsertoken");
    if (browsertoken != nyarukolive_config["browsertoken"]) {
        setCookie("nyarukolive_browsertoken",nyarukolive_config["browsertoken"],365);
    }
}
function wpnyarukoliveinit() {
    setbrowsertoken();
    if (typeof(nyarukolive_config) == "undefined") nyarukolive_error(1);
    nyarukolive_lconf = nyarukolive_loadconfig(nyarukolive_config);
    if (nyarukolive_lconf == 0) {
        if (chkhttps()) {
            nyarukolive_selectmode(nyarukolive_playermode);
            updatetime();
            setInterval("updatetime()",1000);
            updatestatus();
            setInterval("updatestatus()",nyarukolive_updatebarragespeed);
            //getStatus();
            setInterval("getStatus()",nyarukolive_updatestatusspeed);
        }
    } else if (nyarukolive_lconf != 1) {
        nyarukolive_error(nyarukolive_lconf);
    }
    console.log("Loading Video ...OK");
    removeWpNyarukoNPlayer();
}
if (typeof(yashitheme) != "undefined" && yashitheme == "wpnyarukof") {
    if (wpnyarukolive_ready) {
        wpnyarukolive_ready = false;
    } else {
        wpnyarukoliveinit();
    }
} else {
    wpnyarukoliveinit();
}
//弹幕
Array.prototype.remove = function(val) {
	var index = this.indexOf(val);
	if (index > -1) {
		this.splice(index, 1);
	}
};
function nyarukolive_sortNumber(a,b) 
{
	return a - b;
}
function nyarukolive_sendDanMu(textval,selfsend=false) {
	var backW = $("#nyarukolive_danmubox").width();
	var dmid = 'dm' + nyarukolive_dmnum++;
    var str = textval;
    var dmT = nyarukolive_dmTop;
    var dmTarr = [];
    if(nyarukolive_dmObj.length > 0){
        nyarukolive_dmObj.forEach(function(obj,i){
            var isif = backW - obj.position().left;
            // console.log($(this).position().left,backW,isif,nyarukolive_dmW);
            if(isif < (obj.width()*2)){//控制同行两弹幕的间距
                dmTarr.push(obj.position().top);
            }else{
                nyarukolive_dmObj.remove(obj);
            }
        });
    }
    // console.log('-----------------');
    dmTarr.sort(nyarukolive_sortNumber);
    // console.log(dmTarr);
    if(dmTarr.length > 0){
        dmTarr.forEach(function(obi,i){
            if(obi == dmT){
                dmT += nyarukolive_dmspacing + nyarukolive_dmH;
            }
        });
    }
    var addnewclass = 'span';
    if(selfsend){
        addnewclass += ' nyarukolive_selfdanmu'
    }
    $("<span class='nyarukolive_danmu' id='"+dmid+"'></span>").appendTo("#nyarukolive_danmubox").text(str).addClass(addnewclass).siblings().removeClass("span");
    nyarukolive_dmObj.push($("#"+dmid));
    nyarukolive_dmW = $("#"+dmid).width();
    nyarukolive_dmH = $("#"+dmid).height()
    $("#"+dmid).css({left: backW+'px'});
    $("#"+dmid).css({top: dmT+'px'});
    if($("#"+dmid) > backW){
        $("#"+dmid).css({left: backW+'px'});
    }
    $("#"+dmid).css({top: dmT+'px'});
    $('.nyarukolive_danmu').animate({left:-nyarukolive_dmW},nyarukolive_dmtime,'linear',function(){
        $(this).remove();
        nyarukolive_dmObj.remove($(this));
    });
}