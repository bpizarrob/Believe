/*
     ! PARAMETERS RECIVED:
     * timestamp Float
*/

var LOG_HEADER = "Utility.convertTimestampToDate -> ";
log.info(LOG_HEADER + "START");
log.info(LOG_HEADER + "Parametros de entrada. timestamp: "+timestamp);

var fecha = timestamp.toString().substr(0, 10);
log.info(LOG_HEADER +"fecha, tipo de dato: "+ typeof fecha);
log.info(LOG_HEADER + "substr fecha: "+fecha);

var fecha1 = parseInt(fecha);
log.info(LOG_HEADER +"Integer variable fecha1: "+fecha1);
log.info(LOG_HEADER +"fecha1 tipo de dato: "+ typeof fecha1);

var date = new Date(fecha1 * 1000);
log.info(LOG_HEADER + "date: "+date);

var day = ('0'+date.getDate()).slice(-2);
var month = ('0'+date.getMonth()).slice(-2); 
var year = date.getFullYear();
var hours = ('0'+date.getHours()).slice(-2);
var minutes = ('0'+date.getMinutes()).slice(-2);
var seconds = ('0'+date.getSeconds()).slice(-2);

log.info(LOG_HEADER + day+"-"+month+"-"+year+" "+hours+":"+minutes+":"+seconds);

return day+"-"+month+"-"+year+" "+hours+":"+minutes+":"+seconds;

/*
     ! RETURN STRING
*/