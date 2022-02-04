/*
     ! PARAMETERS RECIVED:
     * referenceNumber String
     * customerId String
     * creationDate String     
     * tokenAmdocs String
     * tokenAxway String
 */

     var LOG_HEADER = "Believe.getOrdersDetail ->"; 
     log.info(LOG_HEADER + "START");
     log.info(LOG_HEADER + "Parametros recibidos: referenceNumber: "+referenceNumber+" - customerId: "+customerId+" - creationDate: " +creationDate+" - tokenAxway: "+tokenAxway+" - tokenAmdocs: "+tokenAmdocs);
     
     var completMap = new java.util.HashMap();

     var salida = processData(); 
     
     log.info(LOG_HEADER + "salida: "+salida);
     log.info(LOG_HEADER + "END");

     return salida;


   function processData(){

      var resultMap = new java.util.HashMap();
      var arrayPetitionDetails = new java.util.ArrayList(); 
      var code;
      var message;

      try {

         //! START VALIDATION TEST. DELETE "IF" AND "ELSE" IN PRODUCTION

        var dataOrders;
        
        dataOrders = Utility.readResourceFile("smp/chile/simuladores/QueryOrdersDetail.json");

        // if (customerId == "156377317" ){

        //     log.info(LOG_HEADER + "Llamar a API... ");
        //     dataOrders = backEndCall();
        // }
        // else {

        //     log.info(LOG_HEADER + "Llamar a simulador... ");
        //     dataOrders = Utility.readResourceFile("smp/chile/simuladores/Queryorderlist.json");
        // }

        log.info(LOG_HEADER + "dataOrders: "+dataOrders);
        
        //! END VALIDATION TEST.

         if (dataOrders != null) {
            
               log.info(LOG_HEADER + "Objeto JSON de la funcion processData(): " + dataOrders);
         
               completMap = Utility.fnJsonToMap(dataOrders);
               log.info(LOG_HEADER + "Mapa completo fnJsonToMap de la funcion processData(): " + completMap);
         
               if (completMap.size() != 0) {
                  
                  var data = completMap.get("datos").get("ImplCart");

                  var nameKey = 'currentCartDiscounts';
                  resultMap.put(nameKey, getDataExtra(data, nameKey));

                  nameKey = 'otherCustomerDiscounts';
                  resultMap.put(nameKey, getDataExtra(data, nameKey));

                  /*if(data.containsKey('currentCartDiscounts')){
                     
                     log.info(LOG_HEADER + "Key currentCartDiscounts existe");
                     data.get('productOfferingInstanceID');
                     data.get('productOfferingName');
                     arrayCurrentCartDiscounts.add(data);
                     resultMap.put("currentCartDiscounts", arrayCurrentCartDiscounts);
                     
      
                  }else{
                     log.info(LOG_HEADER + "Data NO contiene la key currentCartDiscounts");
                  }

                  if(data.containsKey('otherCustomerDiscounts')){
                     
                     log.info(LOG_HEADER + "Key otherCustomerDiscounts existe");
                     data.get('productOfferingInstanceID');
                     data.get('productOfferingName');
                     arrayOtherCustomerDiscounts.add(data);
                     resultMap.put("otherCustomerDiscounts", arrayOtherCustomerDiscounts);

                  } else{
                     log.info(LOG_HEADER + "Data NO contiene la key otherCustomerDiscounts");
                  }  */            

                  arrayPetitionDetails =  getMapOrdersDetails();
                  code = '0';
                  message = 'OK';

               } else {

                  log.info(LOG_HEADER + "Result convert Json to Map is NULL");
                  code = '-1';
                  message = 'Response convert Json to Map is NULL';                }
            
         } else {

               log.info(LOG_HEADER + "Response is NULL");
               code = '-1';
               message = 'Response service is NULL';               
         }
         
   
      }catch(e) {
            
         log.info(LOG_HEADER + "Error function processData(): "+e);
         var error = new java.lang.String(e.message);

         code = (error.contains("SocketTimeoutException") || error.contains("Connection timed out")) ? '-2' : '99';
         message = error;
      }
      
      //console.log(str.get("Items")[1].get("servicios").get("ServiciosProductoEquipment")[0].get("containedServices"));
      ////console.log("\n"+LOG_HEADER + "Resultado de la funcion processData(): " + str);
      //console.log("\n"+LOG_HEADER + "FIN");
      log.info(LOG_HEADER + "Resultado mapa detallado de la funcion processData(): " + arrayPetitionDetails);
   

      resultMap.put("petitionDetails", arrayPetitionDetails); //! AGREGAR CABEZERA DEL MAPA A CONSUMIR POR EL MODEL      
      resultMap.put("resultCode", code);
      resultMap.put("resultMessage", message);
      //{petitionDetails=[{}]}

      return resultMap;
   
   }
   
   function getDataExtra(data, nameKey){

      var mapDataExtra= new java.util.HashMap();
      var arrayResult = new java.util.ArrayList(); 
   
      if(data.containsKey(nameKey)){
            
         log.info(LOG_HEADER + "Key "+nameKey+" existe");
   
         var metadata = data.get(nameKey).get(0);
   
         mapDataExtra.put('productOfferingInstanceID', metadata.get('productOfferingInstanceID'));
         mapDataExtra.put('productOfferingName', metadata.get('productOfferingName'));
   
         arrayResult.add(mapDataExtra);
         
   
      }else{
         log.info(LOG_HEADER + "Data NO contiene la key "+nameKey);
      }
   
      return arrayResult;   
   }

   function getMapOrdersDetails(){
   
   //! RETORNAR UN ARRAY DE ORDENES COMO OBJETOS
               
      var totalPetition = new java.util.ArrayList();
      var resultado = new java.util.ArrayList();
   
      try{
            
         totalPetition = completMap.get("datos").get("ImplCart").get("items");
   
         if(totalPetition != 'undefined'){

            log.info(LOG_HEADER + "TOTAL DE ORDENES: " + totalPetition.size());                    
            
            //! RECORRER TODAS LAS PETICIONES U ORDENES
            for(var i=0; i<totalPetition.size(); i++) {
   
               var mapOrdenes =  new java.util.HashMap();

               //! START HARCODEO DE FAMILIAS
               var mapFamily =  new java.util.HashMap();
               mapFamily.put('3467202', 'EQ');
               mapFamily.put('3419372', 'BA');
               mapFamily.put('3472512', 'TV');
               mapFamily.put('3482112', 'VOZ');
               //! END HARCODEO DE FAMILIAS

               var catalogId = totalPetition.get(i).get("productCatalogId");

               var productName = mapFamily.get(catalogId);
               var action = totalPetition.get(i).get("action");
               //var productName = totalPetition.get(i).get("productName");
               var productServiceId = totalPetition.get(i).get("productServiceId");

               mapOrdenes.put("productCatalogId", catalogId);
               mapOrdenes.put("action", action);
               mapOrdenes.put("productName", productName);
               mapOrdenes.put("productServiceId", productServiceId);
   
               log.info(LOG_HEADER + "ORDEN "+(i+1)+": " + catalogId+ " - "+action+" - "+productName+" - "+productServiceId);
               
               var iptv = validateActionAndProductCatalogId(catalogId, action, 'ADD_PRODUCT', '3472512');
               var broadband = validateActionAndProductCatalogId(catalogId, action, 'ADD_PRODUCT', '3419372');
               var toip = validateActionAndProductCatalogId(catalogId, action, 'ADD_PRODUCT', '3482112');
               var aliasIptv = validateActionAndProductCatalogId(catalogId, action, 'ADD_PRODUCT', '3472512');
               var validaAltaRepetidor = validateActionAndProductCatalogId(catalogId, action, 'ADD_PRODUCT', '3467202');
               //aliasIptv = (aliasIptv ? totalPetition.get(i).get("productServiceId") : null);
   
               var arraysCabezeraItems = ["altaIPTV", "altaBroadband", "altaTOIP", "aliasIPTV"];
               var arraysBodyItems = [iptv, broadband, toip, aliasIptv];
   
               //! START INYECTAR "PLAN CLOUD PVR" SOLO EN IPTV
               if(iptv){
                  mapOrdenes.put("PLAN CLOUD PVR", "1019")
               }
               //! END INYECTAR Cloud PVR SOLO EN IPTV


               //var mapPetitionDetails = new java.util.HashMap();

               //! RECORRE LAS CABEZERAS DE LAS ORDENES
               
               for(var index=0; index<arraysCabezeraItems.length; index++){
                  
                  mapOrdenes.put(arraysCabezeraItems[index], arraysBodyItems[index]);
               }

               log.info(LOG_HEADER + "mapOrdenes inicial: " + mapOrdenes);
         
               //! ******************** BEGIN CODE SERVICES ********************
   
               log.info(LOG_HEADER + "All services: " + totalPetition.get(i).get(("services")));

               
   
               if (totalPetition.get(i).containsKey("services")) {

                  var services = new java.util.ArrayList();                 

                  services = totalPetition.get(i).get("services"); //! CADA UNO DE LOS SERVICIOS

                  log.info(LOG_HEADER + "Servicios pasados a getServices(): " + services);

                  /* 
                     1. Servicios producto Broadband -> 3419372
                     2. Servicios producto Equipment -> 3467202
                     3. Servicios producto IPTV -> 3472512
                     4. Servicios producto TOIP -> 3482112
                  
                  */
                  var codeServices = ["3419372", "3467202", "3472512", "3482112"];

                  //var mapPetitionDetails = new java.util.HashMap();

                  //! RECORRE LAS CABEZERAS DE LAS ORDENES

                  var arrayServices = new java.util.ArrayList();

                  log.info(LOG_HEADER + "Cantidad de servicios: " + services.size());

                  for(var index=0; index<codeServices.length; index++){

                     log.info(LOG_HEADER + "Comparar si los valores son iguales: "+catalogId+" <-> "+codeServices[index]);

                     if(catalogId == codeServices[index]){ //valida si hay productos broadband, equipamnt, etc

                        log.info(LOG_HEADER + "SERVICIO "+(index+1)+": los valores son iguales¡");

                        var servicios = obtenerServicios(services);
                        log.info(LOG_HEADER + "servicios: "+servicios);

                     }
                     else{

                        log.info(LOG_HEADER + "En el servicio "+(index+1)+" los valores no son iguales¡ ");

                     }

                     // log.info(LOG_HEADER + "Llenando array de servicios...");
                     arrayServices = servicios;                                               
                  }

                  mapOrdenes.put("serviciosSolicitados", arrayServices);

                  log.info(LOG_HEADER + "serviciosSolicitados incluidos en la orden: " + mapOrdenes);

                  resultado.add(mapOrdenes);                     

                  /*var serviciosProductosBroadband = getServices(services, catalogId, '3419372');
                  var serviciosProductosEquipment = getServices(services, catalogId, '3467202');
                  var serviciosProductosIPTV = getServices(services, catalogId, '3472512');
                  var serviciosProductosTOIP = getServices(services, catalogId, '3482112');
   
                  mapOrdenes.put("serviciosSolicitados", serviciosProductosBroadband);
                  mapOrdenes.put("serviciosSolicitados", serviciosProductosEquipment);
                  mapOrdenes.put("serviciosSolicitados", serviciosProductosIPTV);
                  mapOrdenes.put("serviciosSolicitados", serviciosProductosTOIP);
                  
                  
                  log.info(LOG_HEADER + "PRIMERA PARTE SERVICIOS: " + mapOrdenes);*/
                     
                  //!!!!!!!!!!!!!!!!!!!!! BEGIN HIGH REPEATER                                         
/*
                  if(validaAltaRepetidor){

                     var arrayContained = new java.util.ArrayList();
                     var arrayAltaRepetidor = new java.util.ArrayList();
   
                     var servForAlta = getServices(services, catalogId, '3467202');
   
                     if (servForAlta.contains("productoServicio")) {

                        var productoServicio =  servForAlta.get("productoServicio");

                        for(var x=0; x<productoServicio.size(); x++) {

                           var mapAltaRepetidor = new java.util.HashMap();

                           if (productoServicio.get(x).get("ps") == '3469152') {
                              
                              mapAltaRepetidor.put("ps", productoServicio.get(x).get("catalogItemID")),
                              mapAltaRepetidor.put("catalogItemName", productoServicio.get(x).get("catalogItemName"))
                           }
                           
                           log.info(LOG_HEADER + "iteraciones Mapa alta repetidor: " + mapAltaRepetidor);

                           arrayContained.add(mapAltaRepetidor); //! en caso de no encontrar alta se guarda asi: new java.util.ArrayList();                              
   
                        }

                        arrayAltaRepetidor = arrayContained;                           
                     } 

                     log.info(LOG_HEADER + "array alta repetidor: " + arrayAltaRepetidor);
                     mapOrdenes.put("altaRepetidor", arrayAltaRepetidor);

                  }else{

                     log.info(LOG_HEADER + "No existe alta repetidor");
                  }
   */
                  //!!!!!!!!!!!!!!!!!!!!! END HIGH REPEATER
                  
                  
               }else {
   
                  log.info(LOG_HEADER + "No existen servicios");
               }

                              
   
         }
   
         } else {
            //items.put("Items", null);
            log.info(LOG_HEADER + "No existen ordenes");
   
         }

         //arrayResult.add(resultado);

         //log.info(LOG_HEADER + "Resultado a devolver para la orden final: "+resultado);

         //! ******************** END ALL ITEMS ********************

      }catch(e){
   
         //items.put("Error", LOG_HEADER + "Error de excepcion en funcion getMapOrdersDetails(): " + e);
         log.info(LOG_HEADER + "Error de excepcion en funcion getMapOrdersDetails(): " + e);
      }
   
      log.info(LOG_HEADER + "arrayResult: " + resultado);
   
      return resultado;
   }
   
   function validateActionAndProductCatalogId(productCatalogId, action, action_ref, productCatalogId_ref){
   
      //console.log("1111", productCatalogId_ref);
      var result = ((action == action_ref && productCatalogId == productCatalogId_ref) ? true : false);
   
      return result;
   }
   
   function obtenerServicios(services){
      
      var arregloServicios = new java.util.ArrayList(); 
      var arregloContieneServicio = new java.util.ArrayList(); 

      for(var i=0; i<services.size(); i++) { //! recorrer todos los servicios de la orden 1, 2, 3.... 

         var mapaServicios = new java.util.HashMap();

         mapaServicios.put("catalogItemID", services.get(i).get("catalogItemID"));
         mapaServicios.put("catalogItemName", services.get(i).get("catalogItemName"));

         if(services.get(i).containsKey("containedServices")){

            log.info(LOG_HEADER + "Existen productos contenidos en el servicio ¡"+(i+1));

            arregloContieneServicio = getProductsContainedServices(services.get(i)); //!  [{},{},{},{}]
            mapaServicios.put("productoServicio", arregloContieneServicio);
            
         }


         arregloServicios.add(mapaServicios);
      }

      log.info(LOG_HEADER + "Servicios de orden devueltos: " + arregloServicios);

      return arregloServicios; // [{},{},{},{}]

   }


    /* function getServices(services){
     
         var arrayServices = new java.util.ArrayList();
         var arrayContainedServices = new java.util.ArrayList();    
   
         //var containedServices = new java.util.ArrayList();
   
         for(var i=0; i<services.size(); i++) {
   
            var mapServices = new java.util.HashMap();
            
            mapServices.put("catalogItemID", services.get(i).get("catalogItemID"));
            mapServices.put("catalogItemName", services.get(i).get("catalogItemName"));            

            if(services.get(i).containsKey("containedServices")){

               arrayContainedServices = getProductsContainedServices(services.get(i));
               mapServices.put("productoServicio", arrayContainedServices);
               
            }

            arrayServices = mapServices;
   
         }

         log.info(LOG_HEADER + "mapa de servicios en la funcion getServices(): " + arrayServices);                           
             
         return arrayServices;
     }*/
     
     function getProductsContainedServices(services){ 
      
         var containedServices = new java.util.ArrayList();
         var arrayContainedServices = new java.util.ArrayList();
     
         containedServices = services.get("containedServices"); 
              
         for(var i=0; i<containedServices.size(); i++) {
     
           var mapContainedServices = new java.util.HashMap();
            
           mapContainedServices.put("ps", containedServices.get(i).get("catalogItemID"));
           mapContainedServices.put("catalogItemName", containedServices.get(i).get("catalogItemName"));
           
           arrayContainedServices.add(mapContainedServices);
        }
     
        log.info(LOG_HEADER + "array de servicios contenidos en la funcion getProductsContainedServices(): " + arrayContainedServices);
        
        return arrayContainedServices;
     }
     
     /*
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
        }, cacheTimeout, mcsForceExecution, "getOrdersDetail");         
                
        log.info(LOG_HEADER + "Respuesta dsaResponse en la funcion backEndCall(): "+dsaResponse);
     
        return dsaResponse;
     }*/

     function backEndCall() {

      var headers = new java.util.HashMap();
      var cacheTimeout = 1800;
      var mcsForceExecution = false;  
      var response;
      
      //var calendar = new java.util.GregorianCalendar();
      //cart/379437687A?lo=es_CL&sc=SS&locale=es_CL&salesChannel=SS&time=1544583600000&ci=156377317
  
      var functionName = 'cart';
      var cacheKey = "";
      var httpMethod = "GET";
      var dsaRef="LISTADO_ORDEN_AMDOCS";
      var restAddress = "cart/"+referenceNumber+"?lo=es_CL&sc=SS&locale=es_CL&salesChannel=SS&time=1544583600000&ci="+customerId+"";
   
      log.info(LOG_HEADER + "restAddress: https://apix.movistar.cl/MCSS-Common/"+restAddress);
  
      var requestBody = '';

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