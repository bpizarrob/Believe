
/*
    ! PARAMETERS RECIVED:

    * subscriberId String
    * userName String
    * smpSessionId String
    * soName String
    * compName String
    * additionalInputParams String
*/

var LOG_HEADER = "VPI.getPetitionsByCode -> ";
log.info(LOG_HEADER + "START");
log.info(LOG_HEADER +"INPUTS -> subscriberId: "+subscriberId+" userName: "+userName+" smpSessionId: "+smpSessionId+" soName: "+soName+" compName: "+compName+" additionalInputParams: "+additionalInputParams);

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

//result = (area == '000' ? callOrdersAmdocs() : callPetitionsLegado());

result = callPetitionsLegado();

log.info(LOG_HEADER +"result: "+result);
log.info(LOG_HEADER +"FIN");

return result;


function callPetitionsLegado(){

    log.info(LOG_HEADER +"LEGADO");

    var resultMap = new java.util.HashMap();
    var petitionList = new java.util.ArrayList();
    var responseMap = VPI.getAllPetitions( subscriberId,userName,smpSessionId,soName,compName,additionalInputParams);
    
    log.debug(LOG_HEADER + "responseMap de VPI.getAllPetitions():" + responseMap);


    var petitionListResponse = responseMap.get("listOfPetitions");
    var pixelationCodes = new java.lang.String();
    var blindajeCodes = new java.lang.String();
    var blindajeFound = false;
    var last24HPetition = false;
    var activationDate;

    //can be single item or  comma separated
    log.debug(LOG_HEADER + "List of petitions before filter:" + petitionListResponse);
    var codes = additionalInputParams.get("code");
    var lineOfBusiness = additionalInputParams.get("lineOfBusiness");
    var isFiber = lineOfBusiness.equalsIgnoreCase("Fiber")? true: false;
    log.debug(LOG_HEADER + "Code to filter by: " + codes);

    if( (codes == null || codes == "") && !isFiber){
        blindajeCodes = new java.lang.String(Utility.getApplicationProperty("PSCodes.Blindaje"));
        codes = blindajeCodes;
        log.debug(LOG_HEADER + "Code to filter by blindaje: " + codes);

        pixelationCodes = new java.lang.String(Utility.getApplicationProperty("PSCodes.Pixelation"));
        log.debug(LOG_HEADER + "Code to filter by pixelation: " + pixelationCodes);
        codes = codes+","+pixelationCodes;

        resultMap.put("searchByPixelation", "true");
        resultMap.put("searchByBlindaje", "true");
    }else if( (codes == null || codes == "") && isFiber){
        pixelationCodes = new java.lang.String(Utility.getApplicationProperty("PSCodes.Pixelation"));
        log.debug(LOG_HEADER + "Code to filter by pixelation: " + pixelationCodes);
        codes = pixelationCodes;
        resultMap.put("searchByPixelation", "true");
        resultMap.put("searchByBlindaje", "false");	
    }else{
        resultMap.put("searchByPixelation", "false");
        resultMap.put("searchByBlindaje", "false");
    }


    if(petitionListResponse != null ){
        var dateFormat = new java.text.SimpleDateFormat("dd-MM-yyyy HH:mm");
        for(var i=0; i< petitionListResponse.size(); i++){

            var peticionId = petitionListResponse.get("peticionId");

            log.debug(LOG_HEADER + "peticionId: " + peticionId);

            var petitionResponse = VPI.getPetitionById( subscriberId, peticionId,userName,smpSessionId,soName,compName,additionalInputParams);
            
            log.debug(LOG_HEADER + "petitionResponse de VPI.getPetitionById():" + petitionResponse);

            if (petitionResponse!=null){

            var petitionMap = petitionResponse.get("petitionDetails")

            log.info(LOG_HEADER + "petitionMap " + petitionMap);
            //iterate on this
            var services = petitionMap.get("serviciosSolicitados");

            for(var j =0; j< services.size(); j++){
                var products = services.get("productoServicio");
                log.info(LOG_HEADER + "products " + products);
                for(var k =0; k< products.size(); k++){
                    var ps = products.get(k).get("ps");
                    log.debug(LOG_HEADER + "ps values " + ps);
                    //only add if contains one of codes
                    if( codes.indexOf(ps) != -1){
                        petitionMap.putAll(petitionListResponse.get(i));
                        //
                        try {
                            var parsed = dateFormat.parse(petitionListResponse.get(i).get("fechaEmision"));
                            var calendar = new java.util.GregorianCalendar();
                            calendar.setTime(parsed);
                            //Calendar.HOUR = 10
                            calendar.add(10, 24);  					
                            var currentDate = new java.util.Date();
                            activationDate = dateFormat.format(calendar.getTime());
                            if (currentDate.before(calendar.getTime()))
                                last24HPetition = true;
                            petitionList.add(petitionMap);
                        }
                        catch(e){ 
                            log.info( LOG_HEADER  + "Exception: " + e);
                        }
                        if( pixelationCodes.contains(ps)){
                            petitionMap.put("pixelation", "true");
                        }else{
                            petitionMap.put("pixelation", "false");
                        }

                        if( blindajeCodes.contains(ps)){
                            blindajeFound = true;
                        }
                        break;
                        break;
                    }
                }	
            
            
            }
            }
        }
        if(blindajeFound == false){
            resultMap.put("searchByBlindaje", "false");
        }
        log.debug(LOG_HEADER + "petitionList " + petitionList);
        resultMap.put("listOfPetitions", petitionList);
        resultMap.put("last24HPetition", last24HPetition);
        resultMap.put("activationDate", activationDate);
        
    }else{

        //empty case
        resultMap.put("resultCode", responseMap.get("resultCode"));
        resultMap.put("resultMessage", responseMap.get("resultMessage"));
        resultMap.put("listOfPetitions", petitionList);
        resultMap.put("last24HPetition", last24HPetition);
        resultMap.put("activationDate", activationDate);
    }


    return resultMap;
}