/*
     ! PARAMETERS RECIVED:
     * referenceNumber String
     * customerId String
     * creationDate String
     * tokenAmdocs String
     * 
     * 
     ? https://sucursalvirtualmovistar.movistar.cl/mcss/ecommerce/
     ? cart/272108989A?ci=10272159&lo=es_CL&sc=SS&time=1539873623390&locale=es_CL&salesChannel=SS
 */


     function processData(){

        var resultMap = new java.util.HashMap();
     
         try {
     
           //var dataOrders =  backEndCall(); //! DATA DE PRODUCCION (DESCOMENTAR CUANDO SE REGULARIZE LA API)
           var dataOrders = Utility.readResourceFile("smp/chile/simuladores/QueryOrdersDetail.json"); //! DATA DE PRUEBAS (COMENTAR CUANDO SE REGULARIZE LA API).
           log.info(LOG_HEADER + "Objeto JSON de la funcion processData(): " + dataOrders);
           
           completMap = Utility.fnJsonToMap(dataOrders);
           log.info(LOG_HEADER + "Mapa completo fnJsonToMap de la funcion processData(): " + completMap);
     
           if (completMap.size() !== 0) {
              resultMap =  getMapOrdersDetails();
           } else {
              resultMap.put( "Data", null);
           }
     
         }catch(e) {
             //console.log(LOG_HEADER + "Error de excepcion en la funcion processData(): " + e);
             resultMap.put("error", "Error de excepcion en la funcion processData(): "+e);
         }
         
         //console.log(str.get("Items")[1].get("servicios").get("ServiciosProductoEquipment")[0].get("containedServices"));
         ////console.log("\n"+LOG_HEADER + "Resultado de la funcion processData(): " + str);
         //console.log("\n"+LOG_HEADER + "FIN");
         log.info(LOG_HEADER + "Resultado mapa detallado de la funcion processData(): " + resultMap +"]");
     
         return resultMap;
     
     }
     
     function getMapOrdersDetails(){
     
         var items = new java.util.HashMap();
         var arrayOrders = new java.util.ArrayList();
         var totalItems = new java.util.ArrayList();
         var arrayItems = new java.util.ArrayList();
         
     
         try{
             
           totalItems = completMap.get("datos").get("ImplCart").get("items");
     
           log.info(LOG_HEADER + "TOTAL DE ITEMS: " + totalItems.size());
     
           if (totalItems.size() != 0)  {
               
             //! RECORRIDO DE TODOS LOS ITEMS
             for(var i=0; i<totalItems.size(); i++) { 
                
                 var mapItems = new java.util.HashMap();
     
                 var catalogId = totalItems.get(i).get("productCatalogId");
                 var action = totalItems.get(i).get("action");
                 var productName = totalItems.get(i).get("productName");
     
                 log.info(LOG_HEADER + "DATOS OBTENIDOS DE ITEMS: " + catalogId+ " - "+action+" - "+productName);
                 
                 var iptv = validateActionAndProductCatalogId(catalogId, action, 'ADD_PRODUCT', '3472512');
                 var broadband = validateActionAndProductCatalogId(catalogId, action, 'ADD_PRODUCT', '3419372');
                 var toip = validateActionAndProductCatalogId(catalogId, action, 'ADD_PRODUCT', '3482112');
                 var aliasIptv = validateActionAndProductCatalogId(catalogId, action, 'ADD_PRODUCT', '3472512');
                 var validaAltaRepetidor = validateActionAndProductCatalogId(catalogId, action, 'ADD_PRODUCT', '3467202');
                 aliasIptv = (aliasIptv ? totalItems.get(i).get("productServiceId") : null);
     
                 var arraysCabezeraItems = ["altaIPTV", "altaBroadband", "altaTOIP", "nombreOrden", "aliasIPTV"];
                 var arraysBodyItems = [iptv, broadband, toip, productName, aliasIptv];
     
                 //! RECORRE LAS CABEZERAS DE LAS ORDENES
                 for(var arr=0; arr<arraysCabezeraItems.length; arr++){
                    
                    mapItems.put(arraysCabezeraItems[arr], arraysBodyItems[arr]);
                 }
     
                 var arrayProductosIncluidos = new java.util.ArrayList();
     
                 arrayProductosIncluidos.add(catalogId);
                 arrayProductosIncluidos.add(productName);
     
                 mapItems.put("ProductosIncluidos", arrayProductosIncluidos);
     
                 log.info(LOG_HEADER + "Mapa cabezeras: " + mapItems);
     
     
                 //! ******************** SERVICIOS ********************
     
                 //! VALIDA SI EXISTE LA KEY "SERVICES" DENTRO DE CADA ITEM
     
                 log.info(LOG_HEADER + "ALL SERVICES: " + totalItems.get(i).get(("services")));
     
                 if (totalItems.get(i).containsKey("services")) {
                    
                    log.info(LOG_HEADER + "DESPUES: " + totalItems.get(i).get("services"));
     
                    var resultMapServicios = new java.util.HashMap();
                    var services = new java.util.ArrayList();
                    var arrayContained = new java.util.ArrayList();
     
                    services = totalItems.get(i).get("services"); //! CADA UNO DE LOS SERVICIOS
                    
                    var serviciosProductosBroadband = getServices(services, catalogId, '3419372');
                    var serviciosProductosEquipment = getServices(services, catalogId, '3467202');
                    var serviciosProductosIPTV = getServices(services, catalogId, '3472512');
                    var serviciosProductosTOIP = getServices(services, catalogId, '3482112');
     
                    if(!serviciosProductosBroadband.isEmpty()) resultMapServicios.put("ServiciosProductoBroadband", serviciosProductosBroadband);
                    if(!serviciosProductosEquipment.isEmpty()) resultMapServicios.put("ServiciosProductoEquipment", serviciosProductosEquipment);
                    if(!serviciosProductosIPTV.isEmpty()) resultMapServicios.put("serviciosProductosIPTV", serviciosProductosIPTV);
                    if(!serviciosProductosTOIP.isEmpty()) resultMapServicios.put("serviciosProductosTOIP", serviciosProductosTOIP);
                    
                    log.info(LOG_HEADER + "PRIMERA PARTE SERVICIOS: " + resultMapServicios);
     
     
                    /*
                    ! EVALUACION DEL ALTA DEL ALTA DEL REPETIDOR 
     
                    * $items[?(@.action=='ADD_PRODUCT' && @.productCatalogId=='3467202')]
                    * services[*].containedServices[?(@.catalogItemID=='3469152')].catalogItemName
     
                    */
                                     
                     if(validaAltaRepetidor){
     
                     var servForAlta = getServices(services, catalogId, '3467202');
     
                       if (servForAlta.contains("containedServices")) {
     
                          for(var x=0; x<servForAlta.size(); x++) {
     
                             var statusAlta;
     
                             if (servForAlta.get(x).get("catalogItemID") == '3469152') {
     
                                statusAlta = true;
                             } else {
     
                                statusAlta = false;                         
                             }
     
                             arrayContained.add(statusAlta);
     
                          }
     
                       } else {
                          arrayContained.add(false);
                       }
     
                     }else{
                       arrayContained.add(false);
                       //resultMapServicios.put("altaRepetidor", false);
                     } //! FIN VALIDA SI EXITE UN ALTA DE REPETIDOR
                     
                     log.info(LOG_HEADER + "Mapa servicios: " + resultMapServicios);
     
                     resultMapServicios.put("altaRepetidor", arrayContained);
     
                     mapItems.put("servicios", resultMapServicios);
                     arrayItems.add(mapItems);
                     
                     
                 }else {
     
                    mapItems.put("services", null);
                 } //! FIN CONSULTA SI TIENE EXISTE KEY DE SERVICIOS ASOCIADOS
     
                 arrayItems.add(mapItems);
     
                 }
              
                 items.put("Items", arrayItems);
     
           } else {
              items.put("Items", null);
     
           }//! FIN EVALUACION DE LOS ITEMS
         }catch(e){
     
           items.put("Error", LOG_HEADER + "Error de excepcion en funcion getMapOrdersDetails(): " + e);
         }
     
         log.info(LOG_HEADER + "Mapa items en la funcion getMapOrdersDetails(): " + items);
     
         return items;
     }
     
     function validateActionAndProductCatalogId(productCatalogId, action, action_ref, productCatalogId_ref){
     
        //console.log("1111", productCatalogId_ref);
         var result = ((action == action_ref && productCatalogId == productCatalogId_ref) ? true : false);
     
         return result;
     }
     
     function getServices(services, productCatalogId, catalogoId){
     
         var validaProductCatalogId = ((productCatalogId == catalogoId) ? true : false);
         var arrayServices = new java.util.ArrayList();
     
         if(validaProductCatalogId){
     
           log.info(LOG_HEADER + "Cantidad de servicios: " + services.size());
     
           //var containedServices = new java.util.ArrayList();
     
             for(var i=0; i<services.size(); i++) {
     
                    var mapServices = new java.util.HashMap();
                    
                    mapServices.put("catalogItemID", services.get(i).get("catalogItemID"));
                    mapServices.put("catalogItemName", services.get(i).get("catalogItemName"));            
     
                     if(services.get(i).containsKey("containedServices")){
     
                        mapServices.put("containedServices", getProductsContainedServices(services.get(i)));
                       
                     }else{
     
                       mapServices.put("containedServices", null);
                     }
                    
                    arrayServices.add(mapServices);
     
                 }
             }
     
             log.info(LOG_HEADER + "array de servicios en la funcion getServices(): " + arrayServices);
             
         return arrayServices;
     }
     
     function getProductsContainedServices(services){ 
      
         var arrayContainedServices = new java.util.ArrayList();
         var containedServices = new java.util.ArrayList();
     
         containedServices = services.get("containedServices"); 
         
     
         for(var i=0; i<containedServices.size(); i++) {
     
           var mapContainedServices = new java.util.HashMap();
            
           mapContainedServices.put("catalogItemID", containedServices.get(i).get("catalogItemID"));
           mapContainedServices.put("catalogItemName", containedServices.get(i).get("catalogItemName"));
           
           arrayContainedServices.add(mapContainedServices);
        }
     
        //log.info(LOG_HEADER + "array de servicios contenidos en la funcion getProductsContainedServices(): " + arrayContainedServices);
        
        return arrayContainedServices;
     }
     
     function getDataCompleted(){
         
         var obj = {
             "estado":{
                "codigoEstado":"200",
                "glosaEstado":"OK"
             },
             "datos":{
                "ImplCart":{
                   "implImmediateChargeForOrderImpl":{
                      
                   },
                   "items":[
                      {
                         "productCatalogId":"3419372",
                         "productOfferingId":"4014361",
                         "sharedProduct":false,
                         "productServiceId":"1100469806",
                         "productName":"Banda Ancha",
                         "services":[
                            {
                               "previousRecurringPrice":{
                                  "amount":0.00,
                                  "taxAmount":0.00,
                                  "finalAmountWithTax":0.00
                               },
                               "immediatePriceX9":{
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "finalTaxAmount":0.00
                               },
                               "businessType":"REGULAR",
                               "catalogItemID":"3419232",
                               "recurringPrice":{
                                  "proratedAmount":0.00,
                                  "proratedDiscountAmount":0.00,
                                  "proratedTaxAmount":0.00,
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "frequency":"MONTH",
                                  "finalTaxAmount":0.00,
                                  "originalTaxAmount":0.00,
                                  "finalAmountWithTax":0.00
                               },
                               "catalogItemName":"Acceso",
                               "oneTimePrice":{
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "finalTaxAmount":0.00
                               },
                               "relationToParentID":"3465482",
                               "action":"ADD",
                               "id":"100469810",
                               "serviceType":"GROUP",
                               "status":"ACTIVE"
                            },
                            {
                               "previousRecurringPrice":{
                                  "amount":0.00,
                                  "taxAmount":0.00,
                                  "finalAmountWithTax":0.00
                               },
                               "immediatePriceX9":{
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "finalTaxAmount":0.00
                               },
                               "businessType":"REGULAR",
                               "catalogItemID":"3464732",
                               "recurringPrice":{
                                  "proratedAmount":0.00,
                                  "proratedDiscountAmount":0.00,
                                  "proratedTaxAmount":0.00,
                                  "finalAmount":21000.00,
                                  "originalAmount":24990.00,
                                  "frequency":"MONTH",
                                  "finalTaxAmount":3990.00,
                                  "originalTaxAmount":3990.00,
                                  "finalAmountWithTax":24990.00
                               },
                               "catalogItemName":"Planes Banda Ancha",
                               "oneTimePrice":{
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "finalTaxAmount":0.00
                               },
                               "relationToParentID":"3465472",
                               "action":"ADD",
                               "id":"100469811",
                               "serviceType":"GROUP",
                               "status":"ACTIVE"
                            },
                            {
                             "containedServices":[
                                    {
                                     "previousRecurringPrice":{
                                        "amount":0.00,
                                        "taxAmount":0.00,
                                        "finalAmountWithTax":0.00
                                     },
                                     "immediatePriceX9":{
                                        "finalAmount":0.00,
                                        "originalAmount":0.00,
                                        "finalTaxAmount":0.00
                                     },
                                     "businessType":"PRUEBA",
                                     "catalogItemID":"3469092",
                                     "recurringPrice":{
                                        "proratedAmount":0.00,
                                        "proratedDiscountAmount":0.00,
                                        "proratedTaxAmount":0.00,
                                        "finalAmount":0.00,
                                        "originalAmount":0.00,
                                        "frequency":"MONTH",
                                        "finalTaxAmount":0.00,
                                        "originalTaxAmount":0.00,
                                        "finalAmountWithTax":0.00
                                     },
                                     "catalogItemName":"Ejemplo de la data",
                                     "oneTimePrice":{
                                        "finalAmount":0.00,
                                        "originalAmount":0.00,
                                        "finalTaxAmount":0.00
                                     },
                                     "relationToParentID":"3469952",
                                     "action":"ADD",
                                     "id":"100470029",
                                     "serviceType":"SERVICE",
                                     "status":"ACTIVE"
                                  }
                               ],
                               "previousRecurringPrice":{
                                  "amount":0.00,
                                  "taxAmount":0.00,
                                  "finalAmountWithTax":0.00
                               },
                               "immediatePriceX9":{
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "finalTaxAmount":0.00
                               },
                               "businessType":"REGULAR",
                               "catalogItemID":"3421212",
                               "recurringPrice":{
                                  "proratedAmount":0.00,
                                  "proratedDiscountAmount":0.00,
                                  "proratedTaxAmount":0.00,
                                  "finalAmount":832.00,
                                  "originalAmount":990.00,
                                  "frequency":"MONTH",
                                  "finalTaxAmount":158.00,
                                  "originalTaxAmount":158.00,
                                  "finalAmountWithTax":990.00
                               },
                               "catalogItemName":"Servicios Adicionales Banda Ancha",
                               "pricePackages":[
                                  {
                                     "previousRecurringPrice":{
                                        "amount":0.00,
                                        "taxAmount":0.00,
                                        "finalAmountWithTax":0.00
                                     },
                                     "immediatePriceX9":{
                                        "finalAmount":0.00,
                                        "originalAmount":0.00,
                                        "finalTaxAmount":0.00
                                     },
                                     "catalogItemID":"4100991",
                                     "recurringPrice":{
                                        "proratedAmount":0.00,
                                        "proratedDiscountAmount":0.00,
                                        "proratedTaxAmount":0.00,
                                        "finalAmount":0.00,
                                        "originalAmount":0.00,
                                        "frequency":"MONTH",
                                        "finalTaxAmount":0.00,
                                        "originalTaxAmount":0.00,
                                        "finalAmountWithTax":0.00
                                     },
                                     "catalogItemName":"Conexion Segura",
                                     "oneTimePrice":{
                                        "finalAmount":0.00,
                                        "originalAmount":0.00,
                                        "finalTaxAmount":0.00
                                     },
                                     "isAllowedForSelfService":"Y",
                                     "action":"ADD",
                                     "id":"100469814"
                                  },
                                  {
                                     "previousRecurringPrice":{
                                        "amount":0.00,
                                        "taxAmount":0.00,
                                        "finalAmountWithTax":0.00
                                     },
                                     "immediatePriceX9":{
                                        "finalAmount":0.00,
                                        "originalAmount":0.00,
                                        "finalTaxAmount":0.00
                                     },
                                     "catalogItemID":"5924773",
                                     "recurringPrice":{
                                        "proratedAmount":0.00,
                                        "proratedDiscountAmount":0.00,
                                        "proratedTaxAmount":0.00,
                                        "finalAmount":832.00,
                                        "originalAmount":990.00,
                                        "frequency":"MONTH",
                                        "finalTaxAmount":158.00,
                                        "originalTaxAmount":158.00,
                                        "finalAmountWithTax":990.00
                                     },
                                     "catalogItemName":"Conexion Segura Hogar",
                                     "oneTimePrice":{
                                        "finalAmount":0.00,
                                        "originalAmount":0.00,
                                        "finalTaxAmount":0.00
                                     },
                                     "isAllowedForSelfService":"Y",
                                     "action":"ADD",
                                     "id":"100469815"
                                  }
                               ],
                               "oneTimePrice":{
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "finalTaxAmount":0.00
                               },
                               "relationToParentID":"4016591",
                               "action":"ADD",
                               "id":"100469813",
                               "serviceType":"GROUP",
                               "status":"ACTIVE"
                            },
                            {
                               "previousRecurringPrice":{
                                  "amount":0.00,
                                  "taxAmount":0.00,
                                  "finalAmountWithTax":0.00
                               },
                               "immediatePriceX9":{
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "finalTaxAmount":0.00
                               },
                               "businessType":"REGULAR",
                               "catalogItemID":"3400009",
                               "recurringPrice":{
                                  "proratedAmount":0.00,
                                  "proratedDiscountAmount":0.00,
                                  "proratedTaxAmount":0.00,
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "frequency":"MONTH",
                                  "finalTaxAmount":0.00,
                                  "originalTaxAmount":0.00,
                                  "finalAmountWithTax":0.00
                               },
                               "catalogItemName":"Beneficios de Producto Cruzado",
                               "oneTimePrice":{
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "finalTaxAmount":0.00
                               },
                               "relationToParentID":"4016551",
                               "action":"ADD",
                               "id":"100469816",
                               "serviceType":"GROUP",
                               "status":"ACTIVE"
                            }
                         ],
                         "immediatePriceX9":{
                            "finalAmount":0.00,
                            "originalAmount":0.00,
                            "finalTaxAmount":0.00,
                            "currency":"CLP"
                         },
                         "installationAddressID":"2358",
                         "productId":"100469806",
                         "lob":"WL",
                         "recurringPrice":{
                            "proratedAmount":0.00,
                            "proratedDiscountAmount":0.00,
                            "proratedTaxAmount":0.00,
                            "finalAmount":17632.00,
                            "originalAmount":21832.00,
                            "frequency":"MONTH",
                            "finalTaxAmount":3350.00,
                            "originalTaxAmount":3350.00,
                            "finalAmountWithTax":20982.00
                         },
                         "oneTimePrice":{
                            "finalAmount":0.00,
                            "originalAmount":0.00,
                            "finalTaxAmount":0.00,
                            "currency":"CLP"
                         },
                         "productTypeX9":"NOT_GLP",
                         "equipment":false,
                         "pricePackagesX9":[
                            {
                               "previousRecurringPrice":{
                                  "amount":0.00,
                                  "taxAmount":0.00,
                                  "finalAmountWithTax":0.00
                               },
                               "immediatePriceX9":{
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "finalTaxAmount":0.00
                               },
                               "catalogItemID":"3968551",
                               "recurringPrice":{
                                  "proratedAmount":0.00,
                                  "proratedDiscountAmount":0.00,
                                  "proratedTaxAmount":0.00,
                                  "finalAmount":-4200.00,
                                  "originalAmount":-4998.00,
                                  "frequency":"MONTH",
                                  "finalTaxAmount":-798.00,
                                  "originalTaxAmount":-798.00,
                                  "finalAmountWithTax":-4998.00
                               },
                               "catalogItemName":"Descuento 20% x 6 meses BA 600",
                               "oneTimePrice":{
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "finalTaxAmount":0.00
                               },
                               "isAllowedForSelfService":"Y",
                               "action":"ADD",
                               "id":"100470028"
                            },
                            {
                               "previousRecurringPrice":{
                                  "amount":0.00,
                                  "taxAmount":0.00,
                                  "finalAmountWithTax":0.00
                               },
                               "immediatePriceX9":{
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "finalTaxAmount":0.00
                               },
                               "catalogItemID":"3466372",
                               "recurringPrice":{
                                  "proratedAmount":0.00,
                                  "proratedDiscountAmount":0.00,
                                  "proratedTaxAmount":0.00,
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "frequency":"MONTH",
                                  "finalTaxAmount":0.00,
                                  "originalTaxAmount":0.00,
                                  "finalAmountWithTax":0.00
                               },
                               "catalogItemName":"Plan Técnico de Precios",
                               "oneTimePrice":{
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "finalTaxAmount":0.00
                               },
                               "action":"ADD",
                               "id":"100469817"
                            }
                         ],
                         "action":"ADD_PRODUCT",
                         "id":"232437"
                      },
                      {
                         "productCatalogId":"3467202",
                         "productOfferingId":"4014361",
                         "sharedProduct":false,
                         "productServiceId":"1100469808",
                         "productName":"Equipment Main",
                         "services":[
                            {
                             "containedServices":[
                                  {
                                     "previousRecurringPrice":{
                                        "amount":0.00,
                                        "taxAmount":0.00,
                                        "finalAmountWithTax":0.00
                                     },
                                     "immediatePriceX9":{
                                        "finalAmount":0.00,
                                        "originalAmount":0.00,
                                        "finalTaxAmount":0.00
                                     },
                                     "businessType":"PRUEBA",
                                     "catalogItemID":"3469092",
                                     "recurringPrice":{
                                        "proratedAmount":0.00,
                                        "proratedDiscountAmount":0.00,
                                        "proratedTaxAmount":0.00,
                                        "finalAmount":0.00,
                                        "originalAmount":0.00,
                                        "frequency":"MONTH",
                                        "finalTaxAmount":0.00,
                                        "originalTaxAmount":0.00,
                                        "finalAmountWithTax":0.00
                                     },
                                     "catalogItemName":"Moden Fibra y ONT Prueba",
                                     "oneTimePrice":{
                                        "finalAmount":0.00,
                                        "originalAmount":0.00,
                                        "finalTaxAmount":0.00
                                     },
                                     "relationToParentID":"3469952",
                                     "action":"ADD",
                                     "id":"100470029",
                                     "serviceType":"SERVICE",
                                     "status":"ACTIVE"
                                  }
                               ],
     
                               "previousRecurringPrice":{
                                  "amount":0.00,
                                  "taxAmount":0.00,
                                  "finalAmountWithTax":0.00
                               },
                               "immediatePriceX9":{
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "finalTaxAmount":0.00
                               },
                               "businessType":"REGULAR",
                               "catalogItemID":"3419232",
                               "recurringPrice":{
                                  "proratedAmount":0.00,
                                  "proratedDiscountAmount":0.00,
                                  "proratedTaxAmount":0.00,
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "frequency":"MONTH",
                                  "finalTaxAmount":0.00,
                                  "originalTaxAmount":0.00,
                                  "finalAmountWithTax":0.00
                               },
                               "catalogItemName":"Acceso",
                               "oneTimePrice":{
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "finalTaxAmount":0.00
                               },
                               "relationToParentID":"3469912",
                               "action":"ADD",
                               "id":"100469820",
                               "serviceType":"GROUP",
                               "status":"ACTIVE"
                            },
                            {
                               "previousRecurringPrice":{
                                  "amount":0.00,
                                  "taxAmount":0.00,
                                  "finalAmountWithTax":0.00
                               },
                               "immediatePriceX9":{
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "finalTaxAmount":0.00
                               },
                               "businessType":"REGULAR",
                               "catalogItemID":"3467312",
                               "recurringPrice":{
                                  "proratedAmount":0.00,
                                  "proratedDiscountAmount":0.00,
                                  "proratedTaxAmount":0.00,
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "frequency":"MONTH",
                                  "finalTaxAmount":0.00,
                                  "originalTaxAmount":0.00,
                                  "finalAmountWithTax":0.00
                               },
                               "catalogItemName":"Modem",
                               "containedServices":[
                                  {
                                     "previousRecurringPrice":{
                                        "amount":0.00,
                                        "taxAmount":0.00,
                                        "finalAmountWithTax":0.00
                                     },
                                     "immediatePriceX9":{
                                        "finalAmount":0.00,
                                        "originalAmount":0.00,
                                        "finalTaxAmount":0.00
                                     },
                                     "businessType":"REGULAR",
                                     "catalogItemID":"3469092",
                                     "recurringPrice":{
                                        "proratedAmount":0.00,
                                        "proratedDiscountAmount":0.00,
                                        "proratedTaxAmount":0.00,
                                        "finalAmount":0.00,
                                        "originalAmount":0.00,
                                        "frequency":"MONTH",
                                        "finalTaxAmount":0.00,
                                        "originalTaxAmount":0.00,
                                        "finalAmountWithTax":0.00
                                     },
                                     "catalogItemName":"Moden Fibra y ONT",
                                     "oneTimePrice":{
                                        "finalAmount":0.00,
                                        "originalAmount":0.00,
                                        "finalTaxAmount":0.00
                                     },
                                     "relationToParentID":"3469952",
                                     "action":"ADD",
                                     "id":"100470029",
                                     "serviceType":"SERVICE",
                                     "status":"ACTIVE"
                                  }
                               ],
                               "oneTimePrice":{
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "finalTaxAmount":0.00
                               },
                               "relationToParentID":"3469902",
                               "action":"ADD",
                               "id":"100469821",
                               "serviceType":"GROUP",
                               "status":"ACTIVE"
                            }
                         ],
                         "immediatePriceX9":{
                            "finalAmount":0.00,
                            "originalAmount":0.00,
                            "finalTaxAmount":0.00,
                            "currency":"CLP"
                         },
                         "installationAddressID":"2358",
                         "productId":"100469808",
                         "lob":"WL",
                         "recurringPrice":{
                            "proratedAmount":0.00,
                            "proratedDiscountAmount":0.00,
                            "proratedTaxAmount":0.00,
                            "finalAmount":0.00,
                            "originalAmount":0.00,
                            "frequency":"MONTH",
                            "finalTaxAmount":0.00,
                            "originalTaxAmount":0.00,
                            "finalAmountWithTax":0.00
                         },
                         "oneTimePrice":{
                            "finalAmount":0.00,
                            "originalAmount":0.00,
                            "finalTaxAmount":0.00,
                            "currency":"CLP"
                         },
                         "productTypeX9":"NOT_GLP",
                         "equipment":false,
                         "pricePackagesX9":[
                            {
                               "previousRecurringPrice":{
                                  "amount":0.00,
                                  "taxAmount":0.00,
                                  "finalAmountWithTax":0.00
                               },
                               "immediatePriceX9":{
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "finalTaxAmount":0.00
                               },
                               "catalogItemID":"3470102",
                               "recurringPrice":{
                                  "proratedAmount":0.00,
                                  "proratedDiscountAmount":0.00,
                                  "proratedTaxAmount":0.00,
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "frequency":"MONTH",
                                  "finalTaxAmount":0.00,
                                  "originalTaxAmount":0.00,
                                  "finalAmountWithTax":0.00
                               },
                               "catalogItemName":"Plan técnico de precios de equipos",
                               "oneTimePrice":{
                                  "finalAmount":0.00,
                                  "originalAmount":0.00,
                                  "finalTaxAmount":0.00
                               },
                               "action":"ADD",
                               "id":"100469822"
                            }
                         ],
                         "action":"ADD_PRODUCT",
                         "id":"232438"
                      }
                   ],
                   "previousRecurringPrice":{
                      "amount":0.00,
                      "taxAmount":0.00,
                      "finalAmountWithTax":0.00
                   },
                   "immediatePriceX9":{
                      "finalAmount":0.00,
                      "originalAmount":0.00,
                      "finalTaxAmount":0.00
                   },
                   "originatingSalesChannel":"CEC",
                   "recurringPrice":{
                      "proratedAmount":0.00,
                      "proratedDiscountAmount":0.00,
                      "proratedTaxAmount":0.00,
                      "finalAmount":17632.00,
                      "originalAmount":21832.00,
                      "frequency":"MONTH",
                      "finalTaxAmount":3350.00,
                      "originalTaxAmount":3350.00,
                      "finalAmountWithTax":20982.00
                   },
                   "oneTimePrice":{
                      "finalAmount":0.00,
                      "originalAmount":0.00,
                      "finalTaxAmount":0.00
                   },
                   "currentSalesChannel":"CEC",
                   "currency":"CLP",
                   "id":"232436A"
                }
             }
          };
         
         return obj;
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
        }, cacheTimeout, mcsForceExecution, "getOrdersDetail");         
                
        log.info(LOG_HEADER + "Respuesta dsaResponse en la funcion backEndCall(): "+dsaResponse);
     
        return dsaResponse;
     }
     
     
     var LOG_HEADER = "Believe.getOrdersDetail ->"; 
     log.info(LOG_HEADER + "START");
     log.info(LOG_HEADER + "Parametros recibidos: referenceNumber: "+referenceNumber+" - customerId: "+customerId+" - creationDate: " +creationDate+" - tokenAmdocs: "+tokenAmdocs);
     
     
     var completMap = new java.util.HashMap();
     var headers = new java.util.HashMap();
     
     var httpMethod = "GET";
     var dsaRef="DETALLE_ORDEN_AMDOCS";  //! HACE REFERENCIA A LA API DEFINIDA EN LOS DSAs DE LA CONSOLA (ENVIROMENT->DSA CONNECTIONS)
     var restAddress = "cart/"+referenceNumber+"?ci="+customerId+"&lo=es_CL&sc=SS&time="+creationDate+"&locale=es_CL&salesChannel=SS";
     var requestBody = '';
    
     headers.put("authorization", tokenAmdocs);
     
    
     var salida = processData(); 
     
     return salida;