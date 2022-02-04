
/*
    ! PARAMETERS RECIVED:

    * customerId String
    * tokenAxway String
    * tokenAmdocs String
*/

var LOG_HEADER = "Believe.getContextualizarBillingCustomer -> ";
log.info(LOG_HEADER + "START");

log.info(LOG_HEADER + "Parametros recibidos: customerId: "+customerId+", tokenAxway: "+tokenAxway+", tokenAmdocs: "+tokenAmdocs);

var resultMap = new java.util.HashMap();
var headers = new java.util.HashMap();
var cal = new java.util.GregorianCalendar();
var cacheKey = "";

var functionName="UpdateClientUserContext";
var cacheKey = phone+"_"+functionName;
var restAddress =functionName;
// var requestBody = "";
var httpMethod = "POST";
var dsaRef="BELIEVE_UPDATECLIENTUSERCONTEXT";

// WARNING TOKEN BASIC 
headers.put("Authorization", "Bearer "+ token);
headers.put("Content-Type", "application/json");     
headers.put("AuthorizationMCSS", tokenAmdocs);
// requestBody = '{"customerId": "'+customerID+'", "lo": "es_CL", "sc": "SS", "time": "'+cal.getInstance().getTimeInMillis()+'" }';
var requestBody = '{"customerId": "156377317",  "lo": "es_CL", "sc": "SS", "time": "'+cal.getInstance().getTimeInMillis()+'"}';

try{
	// Para pasar data en duro
	//var dsaResponse   = Utility.readResourceFile("smp/chile/simuladores/UserInformation/" + customerID + ".json");
	//Fin data en duro
	//var dsaResponse =  backEndCall(); 
	// var dsaResponse;
	// if (customerID == "154010862" || customerID =="156917162" ){
	// 	dsaResponse   = Utility.readResourceFile("smp/chile/simuladores/UserInformation/" + customerID + ".json");
	// }
	// else {
	// 	dsaResponse =  backEndCall(); 
	// }

    var dsaResponse =  backEndCall();	    

	resultMap=Utility.fnJsonToMap(dsaResponse);

    log.error(LOG_HEADER + "resultMap: "+resultMap);

	return resultMap;

}catch( e){

	log.error(LOG_HEADER + "Error " + e);
	
}

log.error(LOG_HEADER + "END ");

return resultMap;



function backEndCall() {
        var cacheTimeout = 1800;
        var mcsForceExecution = false;
        var dsaParams = new java.util.HashMap();    
        var response = "";

        log.info(LOG_HEADER + "Data:  " +restAddress+ " - " +requestBody+ " - " +headers+ " - " +httpMethod+ " - "+dsaRef );

        var     dsaResponse = Utility.callBlockingCache(functionName, cacheKey, function(){
                //log.info(LOG_HEADER + "No Cache found executing function for " +restAddress );
                
                try{
                        response = Generic_REST_Connector.executeREST(restAddress, requestBody, headers,httpMethod, dsaRef);
                        log.info(LOG_HEADER + "Response BackEndCall " +response );
                }catch(e){
                        log.info(LOG_HEADER +" exception on REST call: " +  e);
                        resultCode="-1";
                        var error = e.toString();
                        error = error.split("call results:")[1].trim();
                        resultMessage = restAddress.split("?")[0] +" error - " +  error;
                }
                return response;
                }, cacheTimeout, mcsForceExecution, "CTSuscriberInformation");

        log.info(LOG_HEADER +" dsaResponse: " +  dsaResponse);

        return dsaResponse;
}