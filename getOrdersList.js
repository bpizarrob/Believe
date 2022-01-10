/*
    ! PARAMETERS RECIVED:
    * customerId String
    * tokenAxway String
    * tokenAmdocs String
    * 
    * 
    ? https://apix.movistar.cl/MCSS-Common/commerce/customer/156377317/orders?st=0&ps=30&lo=es_CL&sc=SS
*/


function processData(){
    
    var resultMap = new java.util.HashMap();

    try {
    	
        //var dataOrders =  backEndCall();
        var dataOrders = Utility.readResourceFile("smp/chile/simuladores/Queryorderlist.json");
 	    log.info(LOG_HEADER + "Objeto completo de la funcion processData(): " + dataOrders +"]");
        
        completMap = Utility.fnJsonToMap(dataOrders);
        log.info(LOG_HEADER + "Mapa completo fnJsonToMap de la funcion processData(): " + completMap);

        if (completMap.size() != 0) {
           resultMap =  getMapOrdersList();
        } else {
           resultMap.put( "Data", null);
        }
        
    } catch(e) {
        //log.error(LOG_HEADER + "Error de excepcion en la funcion processData(): " + e);
        resultMap.put("error", LOG_HEADER + "Error de excepcion en la funcion processData(): "+e);
    }
    
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

        if (orders.size() != 0) {

            for(var i=0; i<orders.size(); i++) {
               
                if(orders.get(i).get("status") == 'OPEN' && (orders.get(i).get("orderTypeX9") == 'PR' || orders.get(i).get("orderTypeX9") == 'CH')) {                           
                  
                    var mapOrdersList = new java.util.HashMap();
                    
                    mapOrdersList.put("referenceNumber", orders.get(i).get("referenceNumber"));
                    mapOrdersList.put("customerId", orders.get(i).get("customerIdX9"));                    
                    mapOrdersList.put("creationDate", orders.get(i).get("creationDate"));

                    arrayOrders.add(mapOrdersList); //[{}, {}, {}]
                }
            }

            resultMapOrdersList.put("orders", arrayOrders);

        } else {
            resultMapOrdersList.put("orders", null);
        }

    }catch(e){
        //log.error(LOG_HEADER + "Error de excepcion en funcion getObjectResult(): " + e);
        resultMapOrdersList.put("error", LOG_HEADER + "Error en la funcion getObjectResult(): "+e);
    }

    log.info(LOG_HEADER + "Mapa procesado en la funcion getMapOrdersList(): " + resultMapOrdersList);

    return resultMapOrdersList;
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