/*
    ! PARAMETERS RECIVED:

    * subscriberId String
	* petitionId String
    * userName String
    * smpSessionId String
    * soName String
    * compName String
    * additionalInputParams String
*/

var LOG_HEADER = "VPI.getPetitionById -> ";
log.info(LOG_HEADER + "START");

log.info(LOG_HEADER +"subscriberId: "+subscriberId+" petitionId: "+petitionId+" userName: "+userName+" smpSessionId: "+smpSessionId+" soName: "+soName+" compName: "+compName+" additionalInputParams: "+additionalInputParams);

var result = new java.util.HashMap();
var resultSubscriberBelieve= new java.util.HashMap();

resultSubscriberBelieve = Utility.getSubscriberBelieve(subscriberId);
log.info(LOG_HEADER +"Data Utility.getSubscriberBelieve(): " + resultSubscriberBelieve);

var subscriberId = resultSubscriberBelieve.get("varsubscriberId");
log.info(LOG_HEADER +"subscriberId Utility.getSubscriberBelieve(): " + subscriberId);

var rut = resultSubscriberBelieve.get("varrutsubscriberId");
log.info(LOG_HEADER +"Rut Utility.getSubscriberBelieve(): " + rut);

if (rut == "" || rut == null) {
	rut=additionalInputParams.get("rutBelieve");
	log.info(LOG_HEADER +"Rut additionalInputParams: " + rut);
}

var area = subscriberId.substring(0,3); //! 000120000012203
log.info(LOG_HEADER + "area: "+area);

result = (area == '000' ? callOrdersAmdocs() : callPetitionsLegado());
//result = (area == '000' && userName == 'bpizarro') ? callOrdersAmdocs() : callPetitionsLegado();

log.info(LOG_HEADER +"result: "+result);
log.info(LOG_HEADER +"END");

return result;


function callOrdersAmdocs(){

	log.info(LOG_HEADER + "BELIEVE");

	var mapOrdersList = new java.util.HashMap();
	var arrayDetails = new java.util.ArrayList();
	var arrayResult = new java.util.ArrayList();

	try {

		var customerId = subscriberId.substring(3);
        log.info(LOG_HEADER + "customerId: "+customerId);
		var tokenAxway = Security.getToken();
        log.info(LOG_HEADER + " tokenAxway: "+tokenAxway);

		var rutAmdocs = new java.lang.String(rut);
        log.info(LOG_HEADER + " rutAMDOCS: "+rutAmdocs);

        var resultMapTokenAMDOCS = Security.tokenAmdocs(rutAmdocs, tokenAxway);
        log.info(LOG_HEADER + "resultMapTokenAMDOCS: "+ resultMapTokenAMDOCS);

        var tokenAmdocs = resultMapTokenAMDOCS.get("tokenAMDOCS");
        log.info(LOG_HEADER + "TokenAMDOCS: "+ tokenAmdocs);


		mapOrdersList = Believe.getOrdersList(customerId,tokenAxway,tokenAmdocs);
		log.info(LOG_HEADER + " mapOrdersList: "+mapOrdersList);

		var list = new java.util.ArrayList();
        list = mapOrdersList.get("listOfPetitions");

		log.info(LOG_HEADER + " listOfPetitions: "+list);

		if (list.size() != 0) {

            for(var i=0; i<list.size(); i++) {

				var mapOrdersDetail = new java.util.HashMap();

				var refNumber = list.get(i).get("peticionId");
				var time = list.get(i).get("time");

				log.info(LOG_HEADER + "Llamar a funcion Believe.getOrdersDetail()");

				mapOrdersDetail = Believe.getOrdersDetail(refNumber,customerId,time,tokenAmdocs,tokenAxway);

				log.info(LOG_HEADER + " mapOrdersDetail: "+mapOrdersDetail);

				arrayDetails.add(mapOrdersDetail);

			}

			arrayResult = arrayDetails;
		}	

	} catch (e) {

        log.info(LOG_HEADER + "Error function callOrdersAmdocs(): "+e);
		
	}

	log.info(LOG_HEADER + " arrayResult: "+arrayResult);

	return arrayResult;
	
}

function callPetitionsLegado(){

	var returnMap = java.util.HashMap();
	var requestXmlString = getRequestXML(petitionId);
	//log.info("requestXmlString : "+requestXmlString);

	var resultSubscriberBelieve= new java.util.HashMap();
	resultSubscriberBelieve=Utility.getSubscriberBelieve(subscriberId);
	log.info(LOG_HEADER+" resultSubscriberBelieve [" + resultSubscriberBelieve+  "]");
	log.info(LOG_HEADER+" resultSubscriberBelieve varsubscriberId[" + resultSubscriberBelieve.get("varsubscriberId")+  "]");
	log.info(LOG_HEADER+" resultSubscriberBelieve varrutsubscriberId[" + resultSubscriberBelieve.get("varrutsubscriberId")+  "]");

	var varsubscriberId=resultSubscriberBelieve.get("varsubscriberId");

	var backend="VPI";
	var functionName="getPetitionById";
	var uniqueId = Utility.generateUniqueId(varsubscriberId);

	//get time for logging purpose
	var cal = new java.util.GregorianCalendar();


	try{
		//initial log into OSS_TXN_LOG
		OSS.ossLogToDB(varsubscriberId,soName,compName,backend,functionName,"","",userName,smpSessionId,uniqueId);
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
			//OSS.ossLogToDB(varsubscriberId,soName,compName,backend,operationName,"99","Assia web service is not reachable.",userName,smpSessionId);
		} else if(error.contains("HTTP response=[Internal Server Error] code=[500]")){
			returnMap.put("resultCode","99");
			returnMap.put("resultMessage",backend+'.'+operationName+doubleColon+"Internal Server Error");
			//OSS.ossLogToDB(varsubscriberId,soName,compName,backend,operationName,"99",returnMap.get("resultMessage"),userName,smpSessionId);
		} else if(error.contains("SocketTimeoutException")){
			log.warn("Request timeout")
			returnMap.put("resultCode","-2");
			returnMap.put("resultMessage",backend+'.'+operationName+doubleColon+e.message);
			//OSS.ossLogToDB(varsubscriberId,soName,compName,backend,operationName,"-2",returnMap.get("resultMessage"),userName,smpSessionId);
		}else{
			returnMap.put("resultCode","99");
			returnMap.put("resultMessage",backend+'.'+operationName+doubleColon+e.message);
			//OSS.ossLogToDB(varsubscriberId,soName,compName,backend,operationName,"99",returnMap.get("resultMessage"),userName,smpSessionId);
		}	
		
	}
	//log call to db
	OSS.ossTxnLogApiCalls(uniqueId, backend, functionName, returnMap.get("resultCode"),returnMap.get("resultMessage"), requestSentTime, cal.getInstance().getTimeInMillis());

	//update log into OSS_TXN_LOG
	OSS.ossLogToDBUpdate(uniqueId,returnMap.get("resultCode"),returnMap.get("resultMessage"));
	
	return returnMap;
}

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