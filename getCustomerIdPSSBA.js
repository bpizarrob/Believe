/*
    ! PARAMETERS RECIVED:

    * subscriberId String (llega en este formato: "0001000001268" )
    * rutAmdocs String (Solo para validar entorno de pruebas)
*/

var LOG_HEADER = "AAA.getCustomerIdPSSBA -> ";
log.info(LOG_HEADER + "START");
log.info(LOG_HEADER + "Parametros recibidos: subscriberId: "+subscriberId);

var result = new java.util.HashMap();

//var subscriberId = "0001000001268";  //! COMENTAR EN DESARROLLO
var area = subscriberId.substring(0,3); //! Obtiene los 3 primeros caracteres
log.info(LOG_HEADER + "area: "+area);

if(area == '000'){
    result = callGetDiagInfoByPhone();
}

log.info(LOG_HEADER + " result: "+result);
log.info(LOG_HEADER + "END");

return result;


function callGetDiagInfoByPhone(){

    var mapa = new java.util.HashMap();
    var mapaResultXml = new java.util.HashMap();

    try {

        if(rutAmdocs == '12490452-8'){
            log.info(LOG_HEADER + "Entorno de pruebas");
            var xml = Utility.readResourceFile("smp/chile/simuladores/getResponseCustomerIdXml.xml");
        }else{
            log.info(LOG_HEADER + "Entorno de desarrollo");
            var xml = AAA.getDiagInfoByPhone(subscriberId);
            //returnMap.putAll(diagInfo);
        }
        
        
        
        log.info(LOG_HEADER + "Data xml: "+xml);

        var tagElement = new java.util.ArrayList();
        tagElement.add("diagInfoItem");
        mapa = Utility.fnXMLToMap(xml,tagElement);

        log.info(LOG_HEADER + "Data xml to map: "+mapa);

        var customerId = mapa.get('diagInfoItem').get(0).get('amdId');
        var iptvId = mapa.get('diagInfoItem').get(0).get('iptvId');
        var serviceClientId = mapa.get('diagInfoItem').get(0).get('serviceClientId');
        
        mapaResultXml.put("customerId", customerId);
        mapaResultXml.put("iptvId", iptvId);
        mapaResultXml.put("serviceClientId", serviceClientId);


    } catch (error) {
        log.info(LOG_HEADER + "Error en la function callGetDiagInfoByPhone(): "+error);
    }

    log.info(LOG_HEADER + "mapa completo: "+mapa);
    log.info(LOG_HEADER + "mapa de retorno: "+mapaResultXml);

    return mapaResultXml;
}