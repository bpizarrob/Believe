var returnMap = java.util.HashMap();
var requestXmlString = getRequestXML(petitionId);
//log.info("requestXmlString : "+requestXmlString);

var backend="VPI";
var functionName="getPetitionById";
var uniqueId = Utility.generateUniqueId(subscriberId);

//get time for logging purpose
var cal = new java.util.GregorianCalendar();

try{
	//initial log into OSS_TXN_LOG
	OSS.ossLogToDB(subscriberId,soName,compName,backend,functionName,"","",userName,smpSessionId,uniqueId);
	var requestSentTime = cal.getInstance().getTimeInMillis();
	
    var response = Generic_SOAP_Connector.invokeAndReturnAsXML("consultarPeticion","ConsultarPeticionPortBinding",null, requestXmlString.toXMLString(),"con:consultarPeticionResponse","VPI_PD");

	if(response != null){ 
		if(response instanceof java.lang.String) {
			//log.info("Response: "+response);
			returnMap = Utility.preparePetitionDetailsMap(response,"peticion");
					
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
	var operationName = "consulatPeticiones"; var doubleColon="::";	var backend = "chilevpi"; var compName="PetitionInformation";
	 
	if(error.contains("HTTP response=[Not Found] code=[404]")||error.contains("WSDLException: faultCode=OTHER_ERROR")){
		returnMap.put("resultCode","99");
		returnMap.put("resultMessage",backend+'.'+operationName+doubleColon+"VPI web service is not reachable.");
		//OSS.ossLogToDB(subscriberId,soName,compName,backend,operationName,"99","Assia web service is not reachable.",userName,smpSessionId);
	} else if(error.contains("HTTP response=[Internal Server Error] code=[500]")){
		returnMap.put("resultCode","99");
		returnMap.put("resultMessage",backend+'.'+operationName+doubleColon+"Internal Server Error");
		//OSS.ossLogToDB(subscriberId,soName,compName,backend,operationName,"99",returnMap.get("resultMessage"),userName,smpSessionId);
	} else if(error.contains("SocketTimeoutException")){
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
OSS.ossLogToDBUpdate(uniqueId,returnMap.get("resultCode"),returnMap.get("resultMessage"));
return returnMap;

function getRequestXML(petitionId){	

	var requestXmlString = <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:con="http://consultarPeticion.webservice.atiempo.telefonica.com/">
   <soapenv:Header/>
   <soapenv:Body>
      <con:consultarPeticionRequest>
         <peticion>{petitionId}</peticion>
      </con:consultarPeticionRequest>
   </soapenv:Body>
</soapenv:Envelope>;
	
	
	/*new java.lang.StringBuilder("<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:con=\"http://consultarPeticion.webservice.atiempo.telefonica.com/\">");
	requestXmlString.append("<soapenv:Header/>");
	requestXmlString.append("<soapenv:Body>");
	requestXmlString.append("<con:consultarPeticionRequest>");
	requestXmlString.append("<peticion>");
	requestXmlString.append(petitionId);
	requestXmlString.append("</peticion>");
	requestXmlString.append("</con:consultarPeticionRequest>");
	requestXmlString.append("</soapenv:Body>");
	requestXmlString.append("</soapenv:Envelope>");*/
	return requestXmlString;
}