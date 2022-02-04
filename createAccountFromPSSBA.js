var LOG_HEADER = "Subscriber Id: " + subscriberId + " - AAA.createAccountFromPSSBA: ";
log.debug(LOG_HEADER + "INPUTS: subscriberId: " + subscriberId + " userName: " + userName 
				 + " clientName: " + clientName + " userType: "+ userType + " RUT: " + rut + " DVR: " + dvr
				 + " billingCycle: " + billingCycle + " modemType: "+ modemType + " usability: " +  usability
				 + " connectionType: " + connectionType +  " idISP: " +  idISP + " paymentState: " + paymentState
				 + " speedyCreditLimit: " + speedyCreditLimit + " psAccess: " + psAccess+ " psISP: " + psISP
				 + " commercialOperation: " + commercialOperation  + " additionalInputParamsMap: " + additionalInputParamsMap  );
log.info(LOG_HEADER + "map additionalInputParamsMap"+additionalInputParamsMap);

var backend = 'AAA';
var operationName = 'createAAAAccount';
//log.info(LOG_HEADER + "paso -3");

var doubleColon = '::';
var functionName="createCustomerPSSBA";
var resultCodeGen = "";
var resultErrorGen = "";


//AAA.createAccountFromPSSBA:
var resultCode="";
var resultMessage="";
var headers = new java.util.HashMap();
//log.info(LOG_HEADER + "paso -2.1");
var apiMigration =  Utility.getApplicationProperty("apiMigration");
//var SuscriberISAPack =  Utility.getEnvironmentProperty("SuscriberISAPack");
var dsaRef="";
var httpMethod = "POST";
var restAddress = "";


//log.info(LOG_HEADER + "paso -2.5");

//var componentName= additionalInputParamsMap.get("componentName");
//log.info(LOG_HEADER + "paso -2.7");
//var backendJsonDiff= additionalInputParamsMap.get("backendJsonDiff");
//log.info(LOG_HEADER + "paso -2.9");
//var smpSessionId=additionalInputParamsMap.get("smpSessionId");

//log.info(LOG_HEADER + "paso -100");

var backEndCall = function () {
	
	var connParams = MotiveInternal.getConnectionParamsForDatasource("http://www.motive.com/contexts/Default/PSSBA", "SIGRES");
	var dsaResponse="";
	try {
		log.info(LOG_HEADER + "MQ parameters: " + params);
		dsaResponse = Packages.motive.instrumentation.datasourcemgr.DatasourceMgr.execute("http://www.motive.com/contexts/Default/PSSBA",
           connParams, "createCustomerPSSBA", params);
		log.info(LOG_HEADER + "MQ Response: " + dsaResponse)
		
	} catch (e) {
		log.error(LOG_HEADER + "Error received: " + e);
     	//e.javaException.printStackTrace();
     	
	}
	return dsaResponse;
}

//log.info(LOG_HEADER + "paso -1");

var returnMap = new java.util.HashMap();
var cacheKey = "createCustomerFromPSSBA"+subscriberId;
var cacheTimeout = 90; //default Timeout
var appPropCacheTimeout = Utility.getApplicationProperty("Sigres.cacheTimeout");

log.info(LOG_HEADER + "PSSBA.cacheTimeout: " + appPropCacheTimeout);
if(appPropCacheTimeout != null && !isNaN(appPropCacheTimeout)) {
	cacheTimeout = new java.lang.Integer(appPropCacheTimeout);
}
log.info(LOG_HEADER + "cacheTimeout: " + cacheTimeout);	
//log.info(LOG_HEADER + "paso 0");
var subcriberIdMap = Utility.completeSubscriberId(subscriberId);
var phoneNumber = subcriberIdMap.get("subscriberId0F");
var params = new java.util.HashMap();
params.put("idOperator", userName);
params.put("phoneNumber", phoneNumber);
params.put("clientName", clientName);
params.put("userType", userType);
params.put("RUT", rut);
params.put("DVR", dvr);
params.put("billingCycle", billingCycle);
params.put("modemType", modemType);
params.put("usability", usability);
params.put("connectionType", connectionType);
params.put("idISP", idISP);
params.put("paymentState", paymentState);
params.put("speedyCreditLimit", speedyCreditLimit);
params.put("psAccess", psAccess);
params.put("psISP", psISP);
params.put("commercialOperation", commercialOperation);
//get time for logging purpose
var cal = new java.util.GregorianCalendar();
var requestSentTime = cal.getInstance().getTimeInMillis();
log.info(LOG_HEADER + "DSA Params: " + params);
var responseReceivedTime = cal.getInstance().getTimeInMillis();
//log.info(LOG_HEADER + "paso 1");

var vcustomerID;
var vserviceID;
var vnasPort;
var vnasIP;

try {
   vcustomerID = additionalInputParamsMap.get("customerID");
   if (vcustomerID == null || vcustomerID == "") {   
      vcustomerID = "0";
   }
}
catch(e) {
   vcustomerID = "0";
}

try {
   vserviceID = additionalInputParamsMap.get("serviceID");
   if (vserviceID == null || vserviceID == "") {   
      vserviceID = "0";
   }
}
catch(e) {
   vserviceID = "0";
}

vnasPort = additionalInputParamsMap.get("nasPort");
vnasIP = additionalInputParamsMap.get("nasIP");


try{
	if (apiMigration.equals("ISA-Pack")) { // &&  SuscriberISAPack.contains(subscriberId)) {
//		log.info(LOG_HEADER + "entro if isapack");
		dsaRef = "SigresDiagnosis_AXWAY";
		//Actualmente esta con BASIC
		//tokenS = Security.getToken();	//Security Token
		//headers.put("Authorization", "Bearer "+ tokenS);
//		var ISAPackisProductive =  Utility.getApplicationProperty("ISAPackisPreProductive");

//		if (ISAPackisProductive.equals("PREPRODUCCION") ) {
//			headers.put("Authorization", "Basic OGZiYTJjMzItYzI0MS00YmYxLTkwOWQtMTU1N2Q2ZjlhMmZjOjUyYTUyMzlkLTg1NDgtNDgzZS1hMjAzLTgzNDM3ZGM4YzNkMw==");
//		}
//		else{
			var token = Security.getToken();    
			headers.put("Authorization", "Bearer "+ token); 
//		}
		
		headers.put("Content-Type", "application/json");		
		var response = executeRequest_AXWAY();
//		log.info(LOG_HEADER + " backEndCall_AXWAY 3239 despues  backEndCall_AXWAY");

		responseReceivedTime = cal.getInstance().getTimeInMillis();
		log.info(LOG_HEADER + "Result: " + response);
		returnMap.putAll(response);
	}else{
		log.info(LOG_HEADER + "DSA Params " + params);
		var dsaResponse = Utility.callBlockingCache("PSSBA",cacheKey,backEndCall,cacheTimeout);
		log.info(LOG_HEADER + "DSA Result: " + dsaResponse);	
		responseReceivedTime = cal.getInstance().getTimeInMillis();
		
		var response = formatResponse(dsaResponse);
		log.info(LOG_HEADER + "Result: " + response)
		
		returnMap.putAll(response);
	}
}catch(e){
	responseReceivedTime = cal.getInstance().getTimeInMillis();
	log.error(LOG_HEADER + "Error received: " + e);
	log.debug(LOG_HEADER + "Error stackTrace received: " + e.rhinoException.getScriptStackTrace());
	var errorMSg = new java.lang.String(e.message);
    
    	if(errorMSg.contains("HTTP response=[Not Found] code=[404]")||errorMSg.contains("WSDLException: faultCode=OTHER_ERROR")){
		returnMap.put("resultCode","-1");
		returnMap.put("resultMessage",backend+'.'+operationName+doubleColon+"E2EDiagnosisOla2 web service is not reachable.");
	} else if(errorMSg.contains("HTTP response=[Internal Server Error] code=[500]")){
		returnMap.put("resultCode","-1");
		returnMap.put("resultMessage",backend+'.'+operationName+doubleColon+"Internal Server Error");
	} else if(new java.lang.String(e.message).contains("SocketTimeoutException") || new java.lang.String(e.message).contains("Read timed out")){
		log.warn(LOG_HEADER + "Request timeout")
		returnMap.put("resultCode","-2");
		returnMap.put("resultMessage",backend+'.'+operationName+doubleColon+e.message);
	} else{	
		returnMap.put("resultCode","-1");
		returnMap.put("resultMessage",backend+'.'+operationName+doubleColon+ e.message);
	}
	returnMap.put("status","failure");
	log.info(LOG_HEADER + "Result: " + returnMap);
}



//log call to db
OSS.ossTxnLogApiCalls(additionalInputParamsMap.get("uniqueId"), backend, operationName, returnMap.get("resultCode"),
					returnMap.get("resultMessage"), requestSentTime, cal.getInstance().getTimeInMillis());
return returnMap;



function prepareRequest_AXWAY(){
//	log.info(LOG_HEADER + " entro a function 3239");
	var inputMap = new java.util.LinkedHashMap();
	
	var mapOperation = new java.util.LinkedHashMap();
	
	var mapIdentifier = new java.util.LinkedHashMap();
	mapIdentifier.put("lineIdentifier",phoneNumber);
	
	var mapPssba = new java.util.LinkedHashMap();
	mapPssba.put("clientName",clientName);
	mapPssba.put("firstName","");
	mapPssba.put("lastName","");
	mapPssba.put("userType",userType);
	mapPssba.put("rut",rut);
	mapPssba.put("dvr",dvr);
	mapPssba.put("billingCycle",2);
	mapPssba.put("modemType",modemType);
	mapPssba.put("timeArea","");
	mapPssba.put("usability",usability);
	mapPssba.put("lineType","");
	mapPssba.put("connectionType",connectionType);
	mapPssba.put("idISP",idISP);
	mapPssba.put("paymentState",paymentState);
	mapPssba.put("speedyCreditLimit",speedyCreditLimit);

	mapPssba.put("customerID", vcustomerID);
	mapPssba.put("serviceID", vserviceID);
	mapPssba.put("nasPort", vnasPort);
	mapPssba.put("nasIP", vnasIP);

	
	var mapInformationPS = new java.util.LinkedHashMap();	
	mapInformationPS.put("psAccess",psAccess);
	mapInformationPS.put("psISP",psISP);
	mapInformationPS.put("commercialOperation",commercialOperation);
	
	var mapIps= new java.util.LinkedHashMap();
	mapIps.put("login",phoneNumber);
	mapIps.put("password","tchile");
	mapIps.put("domain","tchile");	

	mapOperation.put("identifier",mapIdentifier);
	mapOperation.put("pssba",mapPssba);
	mapOperation.put("informationPS",mapInformationPS);
	mapOperation.put("isp",mapIps);

	
	inputMap.put("input",mapOperation);
	
	var request = Utility.fnMapToJson(inputMap);
	log.info(LOG_HEADER+ "Json inputMap" + request);
	
	return request;
	
}

function executeRequest_AXWAY() {
	var returnMap = new java.util.HashMap();
//	log.info(LOG_HEADER +"GIJM Entro a executeRequest_AXWAY");
	try{
		var dsaResponse =  backEndCall_AXWAY();	
//		log.info(LOG_HEADER +"antes de if dsaResponse "+dsaResponse);		//this executes the REST API CALL
		if( dsaResponse != null && dsaResponse != ""){		
//			log.info(LOG_HEADER +"GIJM Entro a if dsaResponse");
			try{
//				log.info(LOG_HEADER +"response para tratar"+dsaResponse);
//				log.info(LOG_HEADER +"GIJM Entro a tryCatch");
				
				var mapResponse = Utility.fnJsonToMap(dsaResponse);	//Convert JSON to MAP and genarates automatically internal Lists if exist
//				log.info(LOG_HEADER +"paso fnjsontopmap");
				resultErrorGen = "inspeccion estado";
				var statusData = mapResponse.get("estado");
				resultErrorGen = "inspeccion codigoEstado";
				var statusCode  = statusData.get("codigoEstado");
				resultErrorGen = "inspeccion glosaEstado";
				resultMessage = statusData.get("glosaEstado");
				var vfaultcode = "";
				try{
					vfaultcode = mapResponse.get("faultcode");
				}
				catch(e) {
					vfaultcode = null;
				}
				if ( vfaultcode != null ) {				//validate first that there was a response  and format is valid, if  exception happens, could be first on bad implementation or that format is INVALID
					returnMap.put("statusCode", mapResponse.get("faultcode"));
					resultCode = "-1";
					returnMap.put("status", "NOK");
					resultMessage = LOG_HEADER + ":: Error invoking RESOURCE_INVENTORY_MANAGEMENT: " + resultMessage;
				}else{	
					if (statusCode == "200") {
						resultCode = statusCode;			
						returnMap.put("statusCode", resultCode);
						resultErrorGen = "inspeccion datos";
						var dataMap = mapResponse.get("datos");
						//Obtain codes from response
	//					log.info(LOG_HEADER +"GIJM Buscando Errores 1");
						/*resultErrorGen = "inspeccion Envelope.Body.CreateCustomerPSSBAResp";
						var dataMapBodyResp = dataMap.get("Envelope").get("Body").get("CreateCustomerPSSBAResp");
						resultErrorGen = "inspeccion Return.Code";
						var returnCode =  dataMapBodyResp.get("Return").get("Code");
						resultErrorGen = "inspeccion Return.Description";
						var descMessage = dataMapBodyResp.get("Return").get("Description");*/
						
						resultErrorGen = "inspeccion status";
						var dataMapBodyResp = dataMap.get("status");
						resultErrorGen = "inspeccion code";
						var returnCode =  dataMapBodyResp.get("code");
						resultErrorGen = "inspeccion description";
						var descMessage = dataMapBodyResp.get("description");
						
						
						//validate that HTTP return code value
						if( resultCode == "200" && returnCode == "0"){
							resultCode = "0";
							var dataMapBodyReturn  = dataMapBodyResp.get("Return");
	//						log.info(LOG_HEADER +"GIJM dataMapBodyReturn"+dataMapBodyReturn);
	//						log.info(LOG_HEADER +"GIJM dataMapBodyReturn"+dataMapBodyReturn.size());

							if( dataMapBodyReturn != null && dataMapBodyReturn.size() > 0 ){						
								if(returnCode == "0"){
									if(resultCode == "0"){						
										resultCode = "0";
										resultMessage = "Success";
										returnMap.put("status","success");	
									}
								}else{
									resultCode = returnCode;
									resultMessage = statusCode + " " + descMessage;	
									returnMap.put("status", "NOK");
								}				
							}else{
								log.error(LOG_HEADER + "Failed to interpret response, invalid format ");	
								resultCode="-1";
								dsaResponse = Utility.flattenStringResponse(dsaResponse);
								resultMessage = "Formato inválido en respuesta - " +  resultErrorGen;	
							}
							
						} else{ 
						    returnMap.put("status", "NOK");
							if(returnCode == "-2"){
								resultCode = "-2";
							}else if(returnCode == "8"){
								resultCode = "1";
							}else{
								resultCode = "-1";	
							}
						}
					}
					else {
						resultCode = -1;
						returnMap.put("status", "NOK");
						resultMessage = statusCode + " " + resultMessage;
					}
					//obtain here any item as part of response.
				}
			}catch( e){
				log.error(LOG_HEADER + "Failed to interpret response, invalid format " + e);	
				resultCode="-1";
				returnMap.put("status", "NOK");
				dsaResponse = Utility.flattenStringResponse(dsaResponse);
				resultMessage = "Formato inválido en respuesta" +  dsaResponse;
			}
		}else{
			log.error(LOG_HEADER + "General Failed to " + functionName);	
			resultCode="-1";
			returnMap.put("status", "NOK");
			resultMessage = "Formato inválido en respuesta" + functionName;

		}
	}catch(e){
		log.error(LOG_HEADER + "Error postprocessing response: " + e);
		resultCode="-1";
		returnMap.put("status", "NOK");
		resultMessage = functionName +  e;
		var ex= e.message.toString() ;
		if( ex.lastIndexOf("timed out")!=-1 || ex.lastIndexOf("timeout")!=-1){
			log.warn(LOG_HEADER + "Request timeout")
			resultCode="-2";
		}else{
			resultMessage = resultMessage +  " ";
		}
		/*OSS.ossLogToDB(subscriberId,operationName,componentName,backendJsonDiff,"sendConfigurationSettings",resultCode,
				resultMessage,userName,smpSessionId);*/
	}
	returnMap.put("resultCode", resultCode);
	returnMap.put("resultMessage", resultMessage);
	
	log.info(LOG_HEADER + " respuesta Success: " + returnMap);
	if (returnMap.get("resultCode") != "0" ) {
		OSS.ossTxnLogApiCalls(additionalInputParams.get("uniqueId"), backend, operationName, returnMap.get("resultCode"), returnMap.get("resultMessage"), requestSentTime, new java.util.Date().getTime());
	}
	resultErrorGen = "";
	return returnMap;
}


function backEndCall_AXWAY() {
	var requestBody = prepareRequest_AXWAY();
	//Se tiene qeu validar con data
//	log.info(LOG_HEADER +" antes forceEX ");
	var mcsForceExecution = true;
//	log.info(LOG_HEADER +" despues forceEX ");
	var dsaParams = new java.util.HashMap();
	var cacheKey = subscriberId+"-"+operationName;
	restAddress = "createCustomerPSSBA";
	var response = "";
	
	var	dsaResponse = Utility.callBlockingCache(operationName, cacheKey, function(){
		try{
			response = Generic_REST_Connector.executeREST(restAddress, requestBody, headers,httpMethod, dsaRef);
			log.info(LOG_HEADER +" response rest " +  response);
		}catch(e){
			log.info(LOG_HEADER +" exception on REST call: " +  e);
			resultCode="-1";
			var error = e.toString();
			error = error.split("call results:")[1].trim();
			resultMessage = restAddress.split("?")[0] +" error - " +  error;
		}

		return response;
	}, cacheTimeout, mcsForceExecution, operationName);
	log.info(LOG_HEADER +"response rest " +  dsaResponse);
	return dsaResponse;
}




function formatResponse(dsaResponse) {
	var returnMap = new java.util.HashMap();
		if (dsaResponse != null){
			 if (dsaResponse.get("code")!= null) {
				if (dsaResponse.get("code")=="0") {
					returnMap.put("status","SUCCESS");
					returnMap.put("resultCode","0");
					returnMap.put("resultMessage","success");	
				}
				else {
					returnMap.put("status","FAILURE");
					returnMap.put("resultCode","1");
					returnMap.put("resultMessage",dsaResponse.get("description"));	
				}
			}
			else {
				returnMap.put("resultCode","-1");
				returnMap.put("resultMessage","Respuesta inesperada: " + dsaResponse);			
			}
		} 
		else {
			returnMap.put("resultCode","-1");
			returnMap.put("resultMessage","Respuesta inesperada");
		}
	return returnMap;
}