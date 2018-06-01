<?php
/* 
返回值：[<状态码>,<状态描述>]
- 0：成功（新增）。
- 1：成功（更新）。
- -1：没有输入当前直播状态。
- -2：查询条目是否存在时出现数据库错误。
- -3：缺少 id, app, appname 其中之一。
*/
// ini_set('display_errors',1);
// error_reporting(-1);
header('Content-type: application/json');
define("NYARUKOLIVE_ERROR", "[NYA-L+ERR]");
include "../wp-config.php";
nyalivealicb($table_prefix);
function nyalivealicb($table_prefix) {
    $sqlkeys = [];
    $sqlvals = [];
    $updateid = -1;
    if (isset($_GET["action"])) {
        array_push($sqlkeys,"action");
        if ($_GET["action"] == "publish_done") {
            array_push($sqlvals,0);
        } else if ($_GET["action"] == "publish") {
            array_push($sqlvals,1);
        } else {
            array_push($sqlvals,2);
        }
    } else {
        die(echoerror(-1,"no action"));
    }
    if (isset($_GET["ip"])) {
        array_push($sqlkeys,"ip");
        array_push($sqlvals,htmlentities($_GET["ip"]));
    }
    if (isset($_GET["id"]) && isset($_GET["app"]) && isset($_GET["appname"])) {
        $kid = htmlentities($_GET["id"]);
        $kapp = htmlentities($_GET["app"]);
        $appname = htmlentities($_GET["appname"]);
        $psql = "SELECT `liveid` FROM `".$table_prefix."live` WHERE (app='".$kapp."' and appname='".$appname."' and id='".$kid."');";
        $aid = nyalivedb($psql);
        if ($aid == NYARUKOLIVE_ERROR) die(echoerror(-2,"db error"));
        if (isset($aid[0])) {
            $updateid = intval($aid[0]);
        }
        array_push($sqlkeys,"id","app","appname");
        array_push($sqlvals,$kid,$kapp,$appname);
    } else {
        die(echoerror(-3,"no liveid"));
    }
    if (isset($_GET["usrargs"])) {
        array_push($sqlkeys,"usrargs");
        array_push($sqlvals,htmlentities($_GET["usrargs"]));
    }
    if (isset($_GET["node"])) {
        array_push($sqlkeys,"node");
        array_push($sqlvals,htmlentities($_GET["node"]));
    }
    if (isset($_GET["time"])) {
        array_push($sqlkeys,"time");
        array_push($sqlvals,date('Y-m-d H:i:s', $_GET["time"]));
    }
    $sql = "";
    $dbupdmode = [];
    if ($updateid > -1) {
        $sqlkvsstr = [];
        for ($i=0; $i < count($sqlkeys); $i++) {
            $sqlkvsstrv = "`".$sqlkeys[$i]."`='".$sqlvals[$i]."'";
            array_push($sqlkvsstr,$sqlkvsstrv);
        }
        $sql = "UPDATE `".$table_prefix."live` SET ".implode(",", $sqlkvsstr)." WHERE `".$table_prefix."live`.`liveid`=".$updateid.";";
        $dbupdmode = [1,"update ok"];
    } else {
        $sqlkeysstr = "(`".implode("`,`", $sqlkeys)."`)";
        $sqlvalsstr = "('".implode("','", $sqlvals)."')";
        $sql = "INSERT INTO `".$table_prefix."live` ".$sqlkeysstr." VALUES ".$sqlvalsstr.";";
        $dbupdmode = [0,"insert ok"];
    }
    if (nyalivedb($sql) == NYARUKOLIVE_ERROR) die(echoerror(2,"db error"));
    echo echoerror($dbupdmode[0],$dbupdmode[1]);
}
function nyalivedb($sql) {
    $con = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
    $con->query('set names utf8;');
    if($result = $con->query($sql)){
        $row = "";
        if (!is_bool($result)) {
            $row = $result->fetch_array();
        }
        // if (is_array($row))
        // echo "[RESULT]".print_r($row);
        return $row;
    }else{
        return NYARUKOLIVE_ERROR;
    }
}
function echoerror($status,$info) {
    $jsonarr = [$status,$info];
    return json_encode($jsonarr);
}
?>