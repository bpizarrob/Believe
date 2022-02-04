/*
    ! PARAMETERS RECIVED:

    * subscriberId String
    * userName String
    * smpSessionId String
    * soName String
    * compName String
    * additionalInputParams String
    * 
*/

var LOG_HEADER = "VPI.getAllPetitions -> ";
log.info(LOG_HEADER + "START");

log.info(LOG_HEADER +"subscriberId: "+subscriberId+" userName: "+userName+" smpSessionId: "+smpSessionId+" soName: "+soName+" compName: "+compName+" additionalInputParams: "+additionalInputParams);

var result = new java.util.HashMap();
var resultSubscriberBelieve= new java.util.HashMap();

resultSubscriberBelieve = Utility.getSubscriberBelieve(subscriberId);

log.info(LOG_HEADER +"subscriberBelieve: " + resultSubscriberBelieve);

var subscriberId = resultSubscriberBelieve.get("varsubscriberId")
log.info(LOG_HEADER +"varsubscriberId: " + subscriberId);

var rutBelieve = resultSubscriberBelieve.get("varrutsubscriberId");
log.info(LOG_HEADER +"Rut Utility.getSubscriberBelieve(): " + rutBelieve);

if (rutBelieve == "" || rutBelieve == null) {
    rutBelieve=additionalInputParams.get("rutBelieve");
    log.info(LOG_HEADER +"rutBelieve additionalInputParams: " + rutBelieve);

    /*if(rutBelieve == "" || rutBelieve == null || rutBelieve == 'undefined'){
        rutBelieve = Believe.getRut(subscriberId);
        log.info(LOG_HEADER +"Believe.getRut: " + rutBelieve);
    }*/
}
//var subscriberId = "13078767-3|0001000001268";  //! COMENTAR EN DESARROLLO
var area = subscriberId.substring(0,3); //! 000120000012203
log.info(LOG_HEADER + "area: "+area);


result = (area == '000' ? callOrdersAmdocs() : callPetitionsLegado());
log.info(LOG_HEADER + " result: "+result);
//result = callPetitionsLegado();

return result;

function callOrdersAmdocs(){

    var resultMapOrdersList = new java.util.HashMap();

    try {

        log.info(LOG_HEADER + "BELIEVE");
        
        var customerId = subscriberId.substring(3);
        log.info(LOG_HEADER + "customerId: "+customerId);
            
        var tokenAxway = Security.getToken();
        log.info(LOG_HEADER + " tokenAxway: "+tokenAxway);
        
        var rutAmdocs = new java.lang.String(rutBelieve);
        log.info(LOG_HEADER + " rutAMDOCS: "+rutAmdocs);

        var resultMapTokenAMDOCS = Security.tokenAmdocs(rutAmdocs, tokenAxway);
        log.info(LOG_HEADER + "resultMapTokenAMDOCS: "+ resultMapTokenAMDOCS);

        var tokenAmdocs = resultMapTokenAMDOCS.get("tokenAMDOCS");
        log.info(LOG_HEADER + "TokenAMDOCS: "+ tokenAmdocs);        

        //var dataBillingCustomer = Believe.contextualizarBillingCustomer(subscriberId, customerId,tokenAxway,tokenAmdocs);

        customerId = '156377317';

        var dataBillingCustomer = Believe.executeRequestUserInformation(customerId, subscriberId, tokenAxway, tokenAmdocs);
        log.info(LOG_HEADER + " dataBillingCustomer: "+dataBillingCustomer);

        resultMapOrdersList = Believe.getOrdersList(customerId,tokenAxway,tokenAmdocs);	
        //list = resultMapOrdersList.get("listOfPetitions");
        
        log.info(LOG_HEADER + " mapa listado de ordenes: "+resultMapOrdersList);
        
    } catch (e) {

        log.info(LOG_HEADER + "Error function callOrdersAmdocs(): "+e);

    }

    log.info(LOG_HEADER + " resultMapOrdersList: "+resultMapOrdersList);
    
    return resultMapOrdersList;
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
                        
                if(returnMap!=null || returnMap!="" || returnMap!=undefined)
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
                    returnMap.put("resultCode",'-1');
                    returnMap.put("resultMessage","Response is not String");
                }
            }else{
                log.error("Response is not String");
                returnMap.put("resultCode",'-1');
                returnMap.put("resultMessage","Response is not String");
            }
        }else{
            log.error("Response is NULL");
            returnMap.put("resultCode",'-1');
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