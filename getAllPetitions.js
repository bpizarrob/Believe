var LOG_HEADER = "VPI.getAllPetitions -> ";
log.info(LOG_HEADER + "START");

log.info(LOG_HEADER +"subscriberId: "+subscriberId+" userName: "+userName+" smpSessionId: "+smpSessionId+" soName: "+soName+" compName: "+compName+" additionalInputParams: "+additionalInputParams);

var result = new java.util.HashMap();
var resultSubscriberBelieve= new java.util.HashMap();

resultSubscriberBelieve = Utility.getSubscriberBelieve(subscriberId);

log.info(LOG_HEADER +"subscriberBelieve: " + resultSubscriberBelieve);

var subscriberId = resultSubscriberBelieve.get("varsubscriberId")
log.info(LOG_HEADER +"varsubscriberId: " + subscriberId);

//var subscriberId = "13078767-3|0001000001268";  //! COMENTAR EN DESARROLLO
var area = subscriberId.substring(0,3); //! 000120000012203
log.info(LOG_HEADER + "area: "+area);


result = (area == '000' ? callOrdersAmdocs() : callPetitionsLegado());
//result = callPetitionsLegado();

return result;

function callOrdersAmdocs(){

    var resultMapOrdersList = new java.util.HashMap();
    var list = new java.util.HashMap();

    try {

        log.info(LOG_HEADER + "BELIEVE BRAULIO");
    
        var rutBelieve = resultSubscriberBelieve.get("varrutsubscriberId");
        log.info(LOG_HEADER +"varrutsubscriberId: " + rutBelieve);

        var customerId = subscriberId.substring(3);
        log.info(LOG_HEADER + "customerId: "+customerId);
            
        var tokenAxway = Security.getToken();
        log.info(LOG_HEADER + " tokenAxway: "+tokenAxway);
        
        //rutBelieve = (rutBelieve != null ? rutBelieve : null);
        //log.info(LOG_HEADER + " rut: "+rutBelieve);

        /*if (resultSubscriberBelieve.get("varrutsubscriberId") != null){
                rut = resultSubscriberBelieve.get("varrutsubscriberId");
        }
        else{
                rut = Believe.getRut(subscriberId);
        }*/

        
        
        var rutAmdocs = new java.lang.String(rutBelieve);
        log.info(LOG_HEADER + " rutAMDOCS: "+rutAmdocs);

        var resultMapTokenAMDOCS = Security.tokenAmdocs(rutAmdocs, tokenAxway);
        log.info(LOG_HEADER + "resultMapTokenAMDOCS: "+ resultMapTokenAMDOCS);

        var tokenAmdocs = resultMapTokenAMDOCS.get("tokenAMDOCS");
        log.info(LOG_HEADER + "TokenAMDOCS: "+ tokenAmdocs);

        
        var resultMapOrdersDetails = new java.util.HashMap();        
        
        resultMapOrdersList = Believe.getOrdersList(customerId,tokenAxway,tokenAmdocs);	
        //list = resultMapOrdersList.get("listOfPetitions");
        
        log.info(LOG_HEADER + " mapList: "+resultMapOrdersList);
        //log.info(LOG_HEADER + " List: "+list);

        var ordersList = new java.util.ArrayList();
         // {listOfPetitions=[{},{},{}]}

        if (list.size() != 0) {

            for(var i=0; i<list.size(); i++) { //! SE REALIZA UN FOR POR SI VIENE MAS DE UN LISTADO DE ORDENES 

                /*var mapOrdersList = new java.util.HashMap();
                    
                list.get(i).get("peticionId");
                list.get(i).get("estado");
                list.get(i).get("estadoDesc");
                list.get(i).get("tica");
                list.get(i).get("ticaDesc", "");
                list.get(i).get("fechaCompromiso");
                list.get(i).get("tipoAgenda");
                list.get(i).get("tipoAgendaDesc");
                list.get(i).get("etapaProceso");
                list.get(i).get("tipoTrabajo");
                list.get(i).get("tipoTrabajoDesc");
                list.get(i).get("fechaEmision");
                list.get(i).get("fechaCompromisoDesc");*/

                log.info(LOG_HEADER + " list: "+list.get(i));
            }

        }        


        
        //! HACER CICLO FOR PARA RECORRER LAS DISTINTAS ORDENES
        //! INGRESAR A UN ARRAY TODAS LAS ORDENES QUE PUEDAN VENIR

        /*
        var orders = new java.util.ArrayList();
        orders = resultMapOrdersList.get("orders");

        if (orders.size() != 0) {

            for(var i=0; i<orders.size(); i++) { //! SE REALIZA UN FOR POR SI VIENE MAS DE UN LISTADO DE ORDENES 

                var referenceNumber = orders.get(i).get("referenceNumber");
                var customId = orders.get(i).get("customerId");
                var creationDate = orders.get(i).get("creationDate");

                log.info(LOG_HEADER + " referenceNumber: "+referenceNumber+", customId: "+customId+", creationDate"+creationDate);

                resultMapOrdersDetails = Believe.getOrdersDetail(referenceNumber, customId, creationDate, tokenAmdocs); //! REALIZAR FOR POR SI VIENEN MUCHOS DETALLES DE ORDENES
                
                log.info(LOG_HEADER + " mapDetails: "+resultMapOrdersDetails);

            }
        }else{
            log.error(LOG_HEADER + "Response order detail is NULL");
            resultMapOrdersDetails.put("resultCode",-1);
            resultMapOrdersDetails.put("resultMessage","Response order detail is NULL");
        }*/
        
    } catch (e) {

        log.info(LOG_HEADER + "Error function callOrdersAmdocs(): "+e);
        var error = new java.lang.String(e.message);

        /*var code = (error.contains("SocketTimeoutException") || error.contains("Connection timed out")) ? '-2' : '99';

        resultMapOrdersList.put("resultCode", code);
        resultMapOrdersList.put("resultMessage", error);*/
    }

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