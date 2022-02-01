/*
    ! PARAMETERS RECIVED:
    * customerId String
    * tokenAxway String
    * tokenAmdocs String
    * 
    * 
    ? customer/156377317/orders?st=0&ps=30&lo=es_CL&sc=SS
*/

var LOG_HEADER = "Believe.getOrdersList -> ";
log.info(LOG_HEADER + "START");
log.info(LOG_HEADER + "Parametros recibidos: customerId: "+customerId+" - tokenAxway: "+tokenAxway+" - tokenAmdocs: "+tokenAmdocs);

var completMap = new java.util.HashMap();

var salida = processData();

log.info(LOG_HEADER + "END");

return salida;


function processData(){
    
    var resultMap = new java.util.HashMap();
    var array = new java.util.ArrayList();
    //var [code, message] = [null, null];
    var code;
    var message;

    try {

        //! START VALIDATION TEST. DELETE "IF" AND "ELSE" IN PRODUCTION

        var dataOrders;

        if (customerId != "1000001006" ){
            dataOrders = Utility.readResourceFile("smp/chile/simuladores/Queryorderlist.json");
        }
        else {
            // dataOrders = Generic_REST_Connector.executeREST(restAddress, requestBody, headers,httpMethod, dsaRef);
            dataOrders = backEndCall();
        }

        log.info(LOG_HEADER + "dataOrders: "+dataOrders);
        
        //! END VALIDATION TEST.
    	
        //var dataOrders =  backEndCall();
        //var dataOrders = Utility.readResourceFile("smp/chile/simuladores/Queryorderlist.json");
 	    
        if (dataOrders != null || dataOrders != '') {
        
            completMap = Utility.fnJsonToMap(dataOrders);
            log.info(LOG_HEADER + "Mapa completo fnJsonToMap de la funcion processData(): " + completMap);


            if (completMap.size() != 0) {

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

            //! RECORRIDO DE TODAS LAS LISTAS DE ORDENES
            for(var i=0; i<orders.size(); i++) {
               
                var status = orders.get(i).get("status");
                var orderType = orders.get(i).get("orderTypeX9");

                if(status == 'OPEN' && (orderType == 'PR' || orderType == 'CH')) {                           
                  
                    var mapOrdersList = new java.util.HashMap();
                    // var date = new java.text.SimpleDateFormat("dd-MM-yyyy hh:mm");
                    // var fechaCompromiso = date.parse(orders.get(i).get("serviceRequiredDate"));
                    // var creationDate = date.parse(orders.get(i).get("creationDate"));
                    var fCompromiso = orders.get(i).get("serviceRequiredDate");
                    var fCreationDate = orders.get(i).get("creationDate");
                    
                    var fechaCompromiso = Utility.convertTimestampToDate(fCompromiso.toString());
                    log.info(LOG_HEADER +"fechaCompromiso: "+fechaCompromiso);

                    var creationDate = Utility.convertTimestampToDate(fCreationDate.toString());                    
                    log.info(LOG_HEADER +"creationDate: "+creationDate);

                    //! Incluir todos tipo de ordenes disponibles en excel MapeoCRM.xls -> Hoja "lista ordenes"
                    var mapTica =  new java.util.HashMap();
                    mapTica.put('CH', 'Cambiar');
                    mapTica.put('PR', 'Proporcionar');

                    log.info(LOG_HEADER +"ticaDesc: "+mapTica.get(orderType));
                    
                    mapOrdersList.put("peticionId", orders.get(i).get("referenceNumber"));
                    mapOrdersList.put("estado", '1');
                    mapOrdersList.put("estadoDesc", status);
                    mapOrdersList.put("tica", orderType);
                    mapOrdersList.put("ticaDesc", mapTica.get(orderType));
                    mapOrdersList.put("fechaCompromiso", fechaCompromiso);
                    mapOrdersList.put("tipoAgenda", "");
                    mapOrdersList.put("tipoAgendaDesc", "");
                    mapOrdersList.put("etapaProceso", "");
                    mapOrdersList.put("tipoTrabajo", "");
                    mapOrdersList.put("tipoTrabajoDesc", "");
                    mapOrdersList.put("fechaEmision", creationDate);
                    mapOrdersList.put("fechaCompromisoDesc", "");

                    //arrayOrders.add(mapOrdersList); //!ALMACENA LISTA EN UN ARRAY
                    arrayOrders = mapOrdersList;
                }
            }
        } 

    }catch(e){
        log.info(LOG_HEADER + "Error de excepcion en funcion getObjectResult(): " + e);
        //resultMapOrdersList.put("error", LOG_HEADER + "Error en la funcion getObjectResult(): "+e);
    }

    //resultMapOrdersList.put("listOfPetitions", arrayOrders);
    //log.info(LOG_HEADER + "Mapa procesado en la funcion getMapOrdersList(): " + resultMapOrdersList);
    log.info(LOG_HEADER +"ArrayOrders: "+arrayOrders);
    //return resultMapOrdersList;
    return arrayOrders;
}

/*
function convertTimeStampToDate(timestamp){

    var LOG_HEADER = "Utility.convertTimestampToDate -> ";
    log.info(LOG_HEADER + "START");
    log.info(LOG_HEADER + "Parametros de entrada. timestamp: "+timestamp);


    var timestamp = timestamp.substr(0, 10);
    log.info(LOG_HEADER + "substr: "+timestamp);

    var date = new Date(timestamp * 1000);

    var day = ('0'+date.getDate()).slice(-2);
    var month = ('0'+date.getMonth()).slice(-2); 
    var year = date.getFullYear();
    var hours = ('0'+date.getHours()).slice(-2);
    var minutes = ('0'+date.getMinutes()).slice(-2);
    var seconds = ('0'+date.getSeconds()).slice(-2);

    log.info(LOG_HEADER +"Fecha:  "+day+"/"+month+"/"+year+" "+hours+":"+minutes+":"+seconds);

    log.info(LOG_HEADER + "END");
    return day+"/"+month+"/"+year+" "+hours+":"+minutes+":"+seconds;    
}
*/


function backEndCall() {

    var headers = new java.util.HashMap();
    var cacheTimeout = 1800;
    var mcsForceExecution = false;  
    var response;
    
    //var calendar = new java.util.GregorianCalendar();
    //cart/379437687A?lo=es_CL&sc=SS&locale=es_CL&salesChannel=SS&time=1544583600000&ci=156377317

    var functionName = 'customer';
    var cacheKey = "";
    var httpMethod = "POST";
    var dsaRef="LISTADO_ORDEN_AMDOCS";  //! HACE REFERENCIA A LA API DEFINIDA EN LOS DSAs DE LA CONSOLA (ENVIROMENT->DSA CONNECTIONS)
    var restAddress = "customer/"+customerId+"/orders?st=0&ps=30&lo=es_CL&sc=SS";
    // var restAddress = "customer/156377317/orders?st=0&ps=30&lo=es_CL&sc=SS";

    log.info(LOG_HEADER + "restAddress: https://apix.movistar.cl/MCSS-Common/commerce/"+restAddress);

    var requestBody = '{"ProductOrderRequest":{"numRowsToRetrieve":30,"ordersSortBy":"PRODUCT_ORDER_CREATION_DATE","sortAscending":false,"filterCriteria":{"minOrderCreationDate":1532207940,"statuses":["SUBMITTED","SUBMIT_REQUESTED","CLOSED","OPEN"],"productServiceIDs":[],"onlyPrivateOrderX9":false}}}';
    // var requestBody = '{"ProductOrderRequest":{"numRowsToRetrieve":'+30+',"ordersSortBy":"PRODUCT_ORDER_CREATION_DATE","sortAscending":'+false+',"filterCriteria":{"minOrderCreationDate":'+1532207940+',"statuses":["SUBMITTED","SUBMIT_REQUESTED","CLOSED","OPEN"],"productServiceIDs":'+[]+',"onlyPrivateOrderX9":'+false+'}}}';
    log.info(LOG_HEADER + "requestBody: "+requestBody);

    headers.put("Content-Type", "application/json");
    headers.put("Authorization", "Bearer "+ tokenAxway);    
    headers.put("AuthorizationMCSS", tokenAmdocs);

    log.info(LOG_HEADER + "headers: "+headers);

   
    var dsaResponse = Utility.callBlockingCache(functionName, cacheKey, function(){
                
        try{
            response = Generic_REST_Connector.executeREST(restAddress, requestBody, headers,httpMethod, dsaRef);
            log.info(LOG_HEADER +"response backEndCall(): " + response);
        }catch(e){
            log.info(LOG_HEADER +" exception on REST call: " +  e);
        }
        
        return response;

    }, cacheTimeout, mcsForceExecution, "getOrdersList");         
            
    log.info(LOG_HEADER + "Respuesta dsaResponse backEndCall(): "+dsaResponse);

    return dsaResponse;
}