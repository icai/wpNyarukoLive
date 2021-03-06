<?php
// error_reporting(E_ALL); 
// ini_set('display_errors', '1');
include_once "../../../nyarukolive-config.php";
define("NYARUKOLIVE_ERROR", "[NYA-L+ERR]");
define("NYARUKOLIVE_UPDATE_FREQUENCY", 5);
date_default_timezone_set('PRC');
// header('Content-Type: text/plain; charset=utf-8');
header('Content-Type: application/json; charset=utf-8');
header('X-Powered-By: wpNyarukoLive');
nyarukoLiveAPI($table_prefix);
// api: 1=发送弹幕 2=获取播放状态和弹幕
function nyarukoLiveAPI($table_prefix) {
    $starttime = explode(' ',microtime());
    if (isset($_POST["api"])) {
        $api = intval($_POST["api"]);
        $array = null;
        switch ($api) {
            case 1:
                $array = nyarukoLiveAPISendBarrage($table_prefix);
                break;
            case 2:
                $array = nyarukoLiveAPIGetStatus($table_prefix);
                break;
            default:
                break;
        }
        if ($array == null) {
            //header('HTTP/1.1 403 Forbidden');
            //die();
            $array = array('code' => -1, 'msg' => '不可识别的接入方式。');
        }
         //程序运行时间
        $endtime = explode(' ',microtime());
        $thistime = $endtime[0]+$endtime[1]-($starttime[0]+$starttime[1]);
        $thistime = round($thistime,3);
        $array['api'] = $api;
        $array['returntime'] = time();
        $array['calctime'] = $thistime;
        echo json_encode($array);
    } else {
        header('HTTP/1.1 403 Forbidden');
        die();
        // die(json_encode(array('code' => -403, 'msg' => 'Forbidden')));
    }
}
function nyarukoLiveAPIGetStatus($table_prefix) {
    $gstatus = [];
    $statinfo = array('code' => 0, 'msg' => 'status');
    if (isset($_POST["liveid"])) {
        $gstatus["liveid"] = intval($_POST["liveid"]);
        $statinfo["liveid"] = $gstatus["liveid"];
    } else {
        return showerror(array('code' => -2, 'msg' => '直播序号配置错误'));
    }
    if (isset($_POST["token"]) && strlen($_POST["token"]) == 128) {
        $gstatus["token"] = htmlentities($_POST["token"]);
    } else {
        return showerror(array('code' => -8, 'msg' => '会话配置错误'));
    }
    if (isset($_POST["browsertoken"]) && strlen($_POST["browsertoken"]) == 64) {
        $gstatus["browsertoken"] = htmlentities($_POST["browsertoken"]);
    } else {
        return showerror(array('code' => -9, 'msg' => '会话设备配置错误'));
    }
    //验证token `type`,`time`,`usetime`
    $tokenvifdbcmd = "SELECT `type` FROM `".$table_prefix."live_audiences` WHERE (`token`='".$gstatus["token"]."') AND (`browsertoken`='".$gstatus["browsertoken"]."') AND (`type`='0') ORDER BY `time` DESC LIMIT 1;";
    $tokenvif = nyalivedb($tokenvifdbcmd);
    if ($tokenvif == NYARUKOLIVE_ERROR || count($tokenvif) < 2 || $tokenvif["type"] != 0) {
        return showerror(array('code' => -10, 'msg' => '会话验证失败'));
    }
    //取得是否正在直播
    $islivecmd = "SELECT `action`,`ip`,`cmode` FROM `".$table_prefix."live_channels` WHERE `liveid`='".$gstatus["liveid"]."';";
    $islivevif = nyalivedb($islivecmd);
    if ($tokenvif == NYARUKOLIVE_ERROR) {
        return showerror(array('code' => -12, 'msg' => '直播间状态查询失败。'));
    }
    $ban = isban($islivevif["ip"],$table_prefix);
    if ($ban[0]) {
        $binfo = "";
        if ($ban[2]) $binfo = $ban[2];
        return showerror(array('code' => -13, 'msg' => ('直播间被屏蔽。'+$binfo)));
    }
    //-2强停 -1停止 1播放 2强播
    $statinfo["isplaying"] = 0;
    if ($islivevif["cmode"] == 0) {
        if ($islivevif["action"] == 1) {
            $statinfo["isplaying"] = 1;
        } else {
            $statinfo["isplaying"] = -1;
        }
    } else if ($islivevif["cmode"] == 1) {
        $statinfo["isplaying"] = 2;
    } else {
        $statinfo["isplaying"] = -2;
    }
    //取弹幕
    $statinfo["blockbullet"] = 0;
    if (isset($_POST["blockbullet"])) $statinfo["blockbullet"] = intval($_POST["blockbullet"]);
    if ($statinfo["blockbullet"] == 0 && $statinfo["isplaying"] > 0) {
        $statinfo["oldbarrageid"] = 0;
        if (isset($_POST["oldbarrageid"])) {
            $statinfo["oldbarrageid"] = intval($_POST["oldbarrageid"]);
        }
        $statinfo["frequency"] = NYARUKOLIVE_UPDATE_FREQUENCY;
        if (isset($_POST["frequency"])) {
            $statinfo["frequency"] = intval($_POST["frequency"]);
        }
        $statinfo["limit"] = 100;
        if (isset($_POST["limit"])) {
            $gstatuslimit = intval($_POST["limit"]);
            if ($gstatuslimit <= 500) {
                $statinfo["limit"] = $gstatuslimit;
            }
        }
        $statinfo["name"] = "";
        if (isset($_POST["name"])) {
            $statinfo["name"] = htmlentities($_POST["name"]);
        } else {
            //return showerror(array('code' => -14, 'msg' => '请输入用户名，至少三位。'));
        }
        $statinfo["email"] = "";
        $mailcmd = "";
        $mailpattern = "/^([0-9A-Za-z\\-_\\.]+)@([0-9a-z]+\\.[a-z]{2,3}(\\.[a-z]{2})?)$/i";
        if (isset($_POST["email"]) && preg_match($mailpattern,$_POST["email"])) {
            $statinfo["email"] = htmlentities($_POST["email"]);
            $mailcmd = " AND (`email`<>'".$statinfo["email"]."')";
        } else {
            //return showerror(array('code' => -15, 'msg' => '邮箱未填写或格式不正确。'));
        }
        $barragecmd = "SELECT `id`,`name`,`email`,`url`,`date`,`content`,`style` FROM `".$table_prefix."live_commenting` WHERE (`liveid`=".$statinfo["liveid"].") AND (`id`>".$statinfo["oldbarrageid"].")".$mailcmd." AND (`date`>=DATE_SUB(NOW(),INTERVAL ".$statinfo["frequency"]." SECOND)) ORDER BY `date` LIMIT ".$statinfo["limit"].";";
        $barrages = nyalivedb($barragecmd,true);
        if ($barrages == NYARUKOLIVE_ERROR) {
            return showerror(array('code' => -16, 'msg' => '获取弹幕失败。'));
        }
        $statinfo["barrages"] = $barrages;
    }
    return $statinfo;
}
function nyarukoLiveAPISendBarrage($table_prefix) {
    $bulletcomment = [];
    $userinfo = [];
    $ban = isban($info["ip"],$table_prefix);
    if ($ban[0]) {
        return showerror(array('code' => -14, 'msg' => ('当前IP地址无法发送弹幕。'+$ban[2])));
    }
    if (isset($_POST["liveid"])) {
        $bulletcomment["liveid"] = intval($_POST["liveid"]);
    } else {
        return showerror(array('code' => -2, 'msg' => '直播序号配置错误'));
    }
    if (isset($_POST["name"]) && strlen($_POST["name"]) > 0 && mb_strlen($_POST["name"],'utf8') <= 16) {
        $bulletcomment["name"] = htmlentities($_POST["name"]);
        $userinfo["name"] = $_POST["name"];
    } else {
        return showerror(array('code' => -3, 'msg' => '用户名不符合要求'));
    }
    $mailpattern = "/^([0-9A-Za-z\\-_\\.]+)@([0-9a-z]+\\.[a-z]{2,3}(\\.[a-z]{2})?)$/i";
    if (isset($_POST["email"]) && strlen($_POST["email"]) > 0 && strlen($_POST["email"]) <= 32 && preg_match($mailpattern,$_POST["email"])) {
        $bulletcomment["email"] = htmlentities($_POST["email"]);
        $userinfo["email"] = $_POST["email"];
    } else {
        return showerror(array('code' => -4, 'msg' => '电子邮件输入不符合要求'));
    }
    if (isset($_POST["url"]) && strlen($_POST["url"]) >= 0 && strlen($_POST["url"]) <= 64) {
        $bulletcomment["url"] = htmlentities($_POST["url"]);
        $userinfo["url"] = $_POST["url"];
    } else {
        return showerror(array('code' => -5, 'msg' => '个人网址输入不符合要求'.strlen($_POST["url"])));
    }
    if (isset($_POST["content"]) && strlen($_POST["content"]) > 0 && mb_strlen($_POST["content"],'utf8') <= 32) {
        $bulletcomment["content"] = htmlentities($_POST["content"]);
        $userinfo["content"] = $_POST["content"];
    } else {
        return showerror(array('code' => -6, 'msg' => '弹幕输入不符合要求'));
    }
    if (isset($_POST["style"]) && strlen($_POST["style"]) > 0 && strlen($_POST["style"]) < 16) {
        $bulletcomment["style"] = htmlentities($_POST["style"]);
        $userinfo["style"] = $_POST["style"];
    } else {
        return showerror(array('code' => -7, 'msg' => '弹幕样式配置错误'));
    }
    if (isset($_POST["token"]) && strlen($_POST["token"]) == 128) {
        $bulletcomment["token"] = htmlentities($_POST["token"]);
    } else {
        return showerror(array('code' => -8, 'msg' => '会话配置错误'));
    }
    if (isset($_POST["browsertoken"]) && strlen($_POST["browsertoken"]) == 64) {
        $bulletcomment["browsertoken"] = htmlentities($_POST["browsertoken"]);
    } else {
        return showerror(array('code' => -9, 'msg' => '会话设备配置错误'));
    }
    //`type`,`time`,`usetime`
    $tokenvifdbcmd = "SELECT `type`,`usetime` FROM `".$table_prefix."live_audiences` WHERE (`token`='".$bulletcomment["token"]."') AND (`browsertoken`='".$bulletcomment["browsertoken"]."') AND (`type`='0') ORDER BY time DESC LIMIT 1;";
    $tokenvif = nyalivedb($tokenvifdbcmd);
    if ($tokenvif == NYARUKOLIVE_ERROR || count($tokenvif) < 3 || $tokenvif["type"] != 0) {
        return showerror(array('code' => -10, 'msg' => '会话验证失败'));
    }
    $senttime = time() - strtotime($tokenvif["usetime"]);
    if ($senttime < 5) {
        return showerror(array('code' => -11, 'msg' => '发送不宜频繁，过几秒再试。'));
    }
    // ip 发送IPphp ua 浏览器UAPHP wpuserid WP用户IDphp
    // $current_user = wp_get_current_user();
    // 没有登录：if ( 0 == $current_user->ID )
    $bulletcomment["ua"] = htmlentities($_SERVER['HTTP_USER_AGENT']);
    $bulletcomment["wpuserid"] = 0;//$current_user->ID;
    $userinfo["wpuserid"] = $bulletcomment["wpuserid"];
    $cliip = getip();
    if (preg_match('/^[0-9a-zA-Z.:]+$/',$cliip)) {
        $bulletcomment["ip"] = strtoupper($cliip);
    }
    $sqlkeys = [];
    $sqlvals = [];
    foreach ($bulletcomment as $key => $value) {
        array_push($sqlkeys,$key);
        array_push($sqlvals,$value);
    }
    $sqlkeysstr = "(`".implode("`,`", $sqlkeys)."`)";
    $sqlvalsstr = "('".implode("','", $sqlvals)."')";
    $dbcmd = "INSERT INTO `".$table_prefix."live_commenting` ".$sqlkeysstr." VALUES ".$sqlvalsstr.";";
    if (nyalivedb($dbcmd) == NYARUKOLIVE_ERROR) {
        return showerror(array('code' => -100, 'msg' => '数据库连接失败。'));
    }
    $dbcmd = "UPDATE `".$table_prefix."live_audiences` SET `usetime` = CURRENT_TIMESTAMP WHERE `".$table_prefix."live_audiences`.`token` = '".$bulletcomment["token"]."';";
    if (nyalivedb($dbcmd) == NYARUKOLIVE_ERROR) {
        return showerror(array('code' => -100, 'msg' => '数据库连接失败。'));
    }
    $jsonarr = array('code' => 0, 'msg' => "弹幕发送成功。");
    $returnarr = array_merge($jsonarr,$userinfo);
    return $returnarr;
}
function nyalivedb($sql,$multi=false) {
    $con = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
    $con->query('set names utf8;');
    if($result = $con->query($sql)){
        if ($multi) {
            $row = "";
            if (!is_bool($result)) {
                $row = $result->fetch_all();
            }
        } else {
            $row = "";
            if (!is_bool($result)) {
                $row = $result->fetch_array();
            }
        }
        return $row;
    }else{
        // return showerror(array('code' => -999, 'msg' => mysqli_error($con)));
        return NYARUKOLIVE_ERROR;
    }
    $con->close();
}
function showerror($errinfo) {
    // header('HTTP/1.1 403 Forbidden');
    header('Content-Type: application/json; charset=utf-8');
    die(json_encode($errinfo));
}
function getip() {
    static $realip;
    if(isset($_SERVER)){
        if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])){
            $realip = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } else if (isset($_SERVER['HTTP_CLIENT_IP'])){
            $realip = $_SERVER['HTTP_CLIENT_IP'];
        } else {
            $realip = $_SERVER['REMOTE_ADDR'];
        }
    } else {
        if (getenv('HTTP_X_FORWARDED_FOR')){
            $realip = getenv('HTTP_X_FORWARDED_FOR');
        } else if (getenv('HTTP_CLIENT_IP')){
            $realip = getenv('HTTP_CLIENT_IP');
        } else {
            $realip = getenv('REMOTE_ADDR');
        }
    }
    return $realip;
}
function isban($ip,$table_prefix) {
    $dbinfos = nyalivedb("SELECT `id`,`note` FROM `".$table_prefix."live_ban` WHERE (`ban`='".$ip."') AND (`type`=0) AND (`start`<NOW()) AND (`end`>NOW()) AND (`enable`=1) ORDER BY `start`;",false);
    if (!is_null($dbinfos) && count($dbinfos) > 0) {
        $nowban = $dbinfos[0];
        return [true,$nowban->id,$nowban->note];
    } else {
        return [false];
    }
}
?>