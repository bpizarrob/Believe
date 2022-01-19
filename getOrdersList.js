/*
    ! PARAMETERS RECIVED:
    * customerId String
    * tokenAxway String
    * tokenAmdocs String
    * 
    * 
    ? https://apix.movistar.cl/MCSS-Common/commerce/customer/156377317/orders?st=0&ps=30&lo=es_CL&sc=SS
*/

var LOG_HEADER = "Believe.getOrdersList -> ";
log.info(LOG_HEADER + "START");
log.info(LOG_HEADER + "Parametros recibidos: customerId: "+customerId+" - tokenAxway: "+tokenAxway+" - tokenAmdocs: "+tokenAmdocs);

var completMap = new java.util.HashMap();
var headers = new java.util.HashMap();
var calendar = new java.util.GregorianCalendar();
var cacheKey = "";

var httpMethod = "POST";
var dsaRef="LISTADO_ORDEN_AMDOCS";  //! HACE REFERENCIA A LA API DEFINIDA EN LOS DSAs DE LA CONSOLA (ENVIROMENT->DSA CONNECTIONS)
var restAddress = "customer/"+customerId+"/orders?st=0&ps=30&lo=es_CL&sc=SS";
var requestBody = '';

headers.put("Authorization", "Bearer "+ tokenAxway);    
headers.put("AuthorizationMCSS", tokenAmdocs);

var salida = processData();

return salida;



function processData(){
    
    var resultMap = new java.util.HashMap();
    var finalResult = new java.util.HashMap();
    var array = [];
    //var [code, message] = [null, null];
    var code;
    var message;

    try {
    	
        //var dataOrders =  backEndCall();
        var dataOrders = Utility.readResourceFile("smp/chile/simuladores/Queryorderlist.json");
 	    
        if (dataOrders != null) {

            log.info(LOG_HEADER + "Objeto completo de la funcion processData(): " + dataOrders +"]");
        
            completMap = Utility.fnJsonToMap(dataOrders);
            log.info(LOG_HEADER + "Mapa completo fnJsonToMap de la funcion processData(): " + completMap);


            if (completMap.size() != null) {

                array = getMapOrdersList();
                code =  '0';
                message = "OK";
            } else {

                log.error(LOG_HEADER + "Result convert Json to Map is NULL");
                code = '-1';
                message = "Response convert Json to Map is NULL";
            }
        }else{

            log.error(LOG_HEADER + "Response is NULL");
            code = '-1';
            message = "Response is NULL";
        }
        
    } catch(e) {

        log.info(LOG_HEADER + "Error function processData(): "+e);
        var error = new java.lang.String(e.message);

        code = (error.contains("SocketTimeoutException") || error.contains("Connection timed out")) ? '-2' : '99';
        message = error;
    }
    
    resultMap.put("listOfPetitions", array);
    resultMap.put("resultCode", code);
    resultMap.put("resultMessage", message);

    log.info(LOG_HEADER + "Mapa procesado en la funcion processData(): " + resultMap);
    
    //log.info(LOG_HEADER + "Resultado string de la funcion processData(): " + str);
    log.info(LOG_HEADER +"FIN");
    //console.log(str);
    return resultMap;
    
}

function getMapOrdersList(){
    
    var resultMapOrdersList = new java.util.HashMap();
    var arrayOrders = new java.util.ArrayList();
    var orders = new java.util.ArrayList();

    try{
        
        orders = completMap.get("datos").get("Orders").get("orders");

        log.info(LOG_HEADER +"Listado de Ordenes: "+orders);

        if (orders.size() != 0 || orders != null) {

            for(var i=0; i<orders.size(); i++) {
               
                var status = orders.get(i).get("status");

                if(status == 'OPEN' && (orders.get(i).get("orderTypeX9") == 'PR' || orders.get(i).get("orderTypeX9") == 'CH')) {                           
                  
                    var mapOrdersList = new java.util.HashMap();
                    // var date = new java.text.SimpleDateFormat("dd-MM-yyyy hh:mm");
                    // var fechaCompromiso = date.parse(orders.get(i).get("serviceRequiredDate"));
                    // var creationDate = date.parse(orders.get(i).get("creationDate"));

                    mapOrdersList.put("peticionId", orders.get(i).get("referenceNumber"));
                    mapOrdersList.put("estado", '1');
                    mapOrdersList.put("estadoDesc", status);
                    mapOrdersList.put("tica", orders.get(i).get("orderTypeX9"));
                    mapOrdersList.put("ticaDesc", "");
                    //mapOrdersList.put("fechaCompromiso", fechaCompromiso);
                    mapOrdersList.put("fechaCompromiso", "");
                    mapOrdersList.put("tipoAgenda", "");
                    mapOrdersList.put("tipoAgendaDesc", "");
                    mapOrdersList.put("etapaProceso", "");
                    mapOrdersList.put("tipoTrabajo", "");
                    mapOrdersList.put("tipoTrabajoDesc", "");
                    // mapOrdersList.put("fechaEmision", creationDate);
                    mapOrdersList.put("fechaEmision", "");
                    mapOrdersList.put("fechaCompromisoDesc", "");

                    arrayOrders.add(mapOrdersList); //*[{}, {}, {}]
                }
            }
        } 

    }catch(e){
        log.error(LOG_HEADER + "Error de excepcion en funcion getObjectResult(): " + e);
        //resultMapOrdersList.put("error", LOG_HEADER + "Error en la funcion getObjectResult(): "+e);
    }

    //resultMapOrdersList.put("listOfPetitions", arrayOrders);
    //log.info(LOG_HEADER + "Mapa procesado en la funcion getMapOrdersList(): " + resultMapOrdersList);
    log.info(LOG_HEADER +"ArrayOrders: "+arrayOrders);
    //return resultMapOrdersList;
    return arrayOrders;
}

function backEndCall() {

   var cacheTimeout = 1800;
   var mcsForceExecution = false;
   var dsaParams = new java.util.HashMap();    
   var response = "";
   
   var dsaResponse = Utility.callBlockingCache(functionName, cacheKey, function(){
              
      try{
         response = Generic_REST_Connector.executeREST(restAddress, requestBody, headers,httpMethod, dsaRef);
      
      }catch(e){
         log.info(LOG_HEADER +" exception on REST call: " +  e);
         resultCode="-1";
         var error = e.toString();
         error = error.split("call results:")[1].trim();
         resultMessage = restAddress.split("?")[0] +" error - " +  error;
      }
      
      return response;
   }, cacheTimeout, mcsForceExecution, "getOrdersList");         
           
   log.info(LOG_HEADER + "Respuesta dsaResponse en la funcion backEndCall(): "+dsaResponse);

   return dsaResponse;
}