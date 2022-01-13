var LOG_HEADER = "VPI.getAllPetitions -> ";
log.info(LOG_HEADER + "START");

//var subscriberId = "0001000001006";  //! COMENTAR EN DESARROLLO
var area = subscriberId.substring(0,3); // 000120000012203

var result = new java.util.HashMap();

result = (area == '000' ? callOrdersAmdocs() : callPetitionsLegado());

return result;

function callOrdersAmdocs(){

    log.info(LOG_HEADER + "BELIEVE");

    var resultMapOrdersList = new java.util.HashMap();
    var resultMapOrdersDetails = new java.util.HashMap();

    log.info(LOG_HEADER + "BELIEVE"); 
    var customerId = subscriberId.substring(3);
    log.info(LOG_HEADER + "customerId: "+customerId);

    area = subscriberId.substring(0, 3);
    log.info(LOG_HEADER + "area: "+area);
        
    var tokenAxway = Security.getToken();
    log.info(LOG_HEADER + " tokenAxway: "+tokenAxway);

    var rutAMDOCS = Believe.getRut(subscriberId);
    var rut = rutAMDOCS.replace('-', '');
    log.info(LOG_HEADER + " rutAMDOCS: "+rutAMDOCS+", rut formateado: "+rut);

    var tokenAmdocs = Security.tokenAmdocs(rut, tokenAxway);
    log.info(LOG_HEADER + " tokenAmdocs: "+tokenAmdocs);

    resultMapOrdersList = Believe.getOrdersList(customerId,tokenAxway,tokenAmdocs);	
    log.info(LOG_HEADER + " mapList: "+resultMapOrdersList);
    
    var referenceNumber = resultMapOrdersList.get(0).get("referenceNumber");
    var customId = resultMapOrdersList.get(0).get("customerId");
    var creationDate = resultMapOrdersList.get(0).get("creationDate");

    log.info(LOG_HEADER + " referenceNumber: "+referenceNumber+", customId: "+customId+", creationDate"+creationDate);

    resultMapOrdersDetails = Believe.getOrdersDetail(referenceNumber, customId, creationDate, tokenAmdocs);

    log.info(LOG_HEADER + " mapDetails: "+resultMapOrdersDetails);
    //log.info(LOG_HEADER + " BRAULIO resultMapOrdersDetail " + resultMapOrdersDetails);

    return resultMapOrdersDetails;

}

function callPetitionsLegado(){

    log.info(LOG_HEADER + "LEGADO");

    var returnMap = new java.util.HashMap();
    var requestXmlString = getRequestXML(subscriberId);
    log.info("requestXmlString : "+requestXmlString);

    var backend="VPI";
    var functionName="getAllPetitions";
    var uniqueId = Utility.generateUniqueId(subscriberId);
    //get time for logging purpose
    var cal = new java.util.GregorianCalendar();
    try{
    var response = Generic_SOAP_Connector.invokeAndReturnAsXML("listarPeticiones","ListarPeticionesPortBinding",null, requestXmlString.toXMLString(),"lis:listarPeticionesResponse","VPI_PL");

        //initial log into OSS_TXN_LOG
        OSS.ossLogToDB(subscriberId,soName,compName,backend,functionName,"","",userName,smpSessionId,uniqueId);
        var requestSentTime = cal.getInstance().getTimeInMillis();

        if(response != null){ 
            if(response instanceof java.lang.String) {
                //log.info("Response: "+response);
                returnMap = Utility.preparePetitionsListMap(response,"peticion");
                        
                if(returnMap!=null && returnMap!="" && returnMap!=undefined)
                {	
                    //log.info("Response Map: "+returnMap);
                    var statusCode = returnMap.get("resultCode");
                    if(statusCode.equals("0"))
                    {					
                        
                    }
                    else if(statusCode.equals("1"))
                    {
                        returnMap.put("resultCode","1");
                        returnMap.put("resultMessage","Result is Missing!!");
                    }
                }
                else
                {
                    returnMap.put("resultCode",-1);
                    returnMap.put("resultMessage","Response is not String");
                }
            }else{
                log.error("Response is not String");
                returnMap.put("resultCode",-1);
                returnMap.put("resultMessage","Response is not String");
            }
        }else{
            log.error("Response is NULL");
            returnMap.put("resultCode",-1);
            returnMap.put("resultMessage","Response is NULL");
        }

    }catch(e) {
        log.error("Error received: " + e)
        var error = new java.lang.String(e.message);
        var operationName = "listarPeticiones"; var doubleColon="::";	var backend = "chilevpi";var compName="ListAllPetitions";
        
        if(error.contains("HTTP response=[Not Found] code=[404]")||error.contains("WSDLException: faultCode=OTHER_ERROR")){
            returnMap.put("resultCode","99");
            returnMap.put("resultMessage",backend+'.'+operationName+doubleColon+"VPI web service is not reachable.");
            //OSS.ossLogToDB(subscriberId,soName,compName,backend,operationName,"99","VPI web service is not reachable.",userName,smpSessionId);
        } else if(error.contains("HTTP response=[Internal Server Error] code=[500]")){
            returnMap.put("resultCode","99");
            returnMap.put("resultMessage",backend+'.'+operationName+doubleColon+"Internal Server Error");
            //OSS.ossLogToDB(subscriberId,soName,compName,backend,operationName,"99",returnMap.get("resultMessage"),userName,smpSessionId);
        } else if(error.contains("SocketTimeoutException") || error.contains("Connection timed out")){
            log.warn("Request timeout")
            returnMap.put("resultCode","-2");
            returnMap.put("resultMessage",backend+'.'+operationName+doubleColon+e.message);
            //OSS.ossLogToDB(subscriberId,soName,compName,backend,operationName,"-2",returnMap.get("resultMessage"),userName,smpSessionId);
        }else{
            returnMap.put("resultCode","99");
            returnMap.put("resultMessage",backend+'.'+operationName+doubleColon+e.message);
            //OSS.ossLogToDB(subscriberId,soName,compName,backend,operationName,"99",returnMap.get("resultMessage"),userName,smpSessionId);
        }	
        
    }
    //log call to db
    OSS.ossTxnLogApiCalls(uniqueId, backend, functionName, returnMap.get("resultCode"),returnMap.get("resultMessage"), requestSentTime, cal.getInstance().getTimeInMillis());

    //update log into OSS_TXN_LOG
    //OSS.ossLogToDBUpdate(uniqueId,response.get("resultCode"),response.get("resultMessage"));
    OSS.ossLogToDBUpdate(uniqueId,returnMap.get("resultCode"),returnMap.get("resultMessage"));
    log.info("Testing VPI petition list Jagdish: "+returnMap);
    return returnMap;
}

function getRequestXML(phoneNumber){	

var requestXmlString = <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:lis="http://listarPeticiones.webservice.atiempo.telefonica.com/">
   <soapenv:Header/>
   <soapenv:Body>
      <lis:listarPeticionesRequest>
         <telefono>{phoneNumber}</telefono>
      </lis:listarPeticionesRequest>
   </soapenv:Body>
</soapenv:Envelope>;
return requestXmlString;

	/*var requestXmlString = new java.lang.StringBuilder("<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:lis=\"http://listarPeticiones.webservice.atiempo.telefonica.com/\">");
	requestXmlString.append("<soapenv:Header/>");
	requestXmlString.append("<soapenv:Body>");
	requestXmlString.append("<lis:listarPeticionesRequest>");
	requestXmlString.append("<telefono>");
	requestXmlString.append(phoneNumber);
	requestXmlString.append("</telefono>");
	requestXmlString.append("</lis:listarPeticionesRequest>");
	requestXmlString.append("</soapenv:Body>");
	requestXmlString.append("</soapenv:Envelope>");
	return requestXmlString;*/
	
}