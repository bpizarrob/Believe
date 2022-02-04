
var LOG_HEADER = "CRM.getAccountDetailsFromAMDOCS: ";
log.debug(LOG_HEADER + "INPUTS: subscriberId: " + subscriberId + " additionalInputParams: " + additionalInputParams )

var backend = 'CRM';
var operationName = 'getAccountDetailsFromAMDOCS';
var doubleColon = '::';

var tokenAxway = "";
var tokenAmdocs = "";
var functionName = "";
var headers = new java.util.HashMap();
var operationName="getToken";
var restAddress = "";
var requestBody = "";
var httpMethod = "GET";
var dsaRef= ""; 
var returnMapCustomerFull="";
var resultKey="Believe";
var listaPsFrontEnd = null;

var addMap= new java.util.HashMap();
var cacheKey= subscriberId;
var cacheTimeout= Utility.getApplicationProperty("CRM.cacheTimeout");
var inputTechnology =additionalInputParams.get("inputTechnology");
addMap.put("cacheKey",cacheKey );
addMap.put("cacheTimeout", cacheTimeout);
addMap.put("uniqueId",additionalInputParams.get("uniqueId"));
addMap.put("inputTechnology",inputTechnology);

var result = new java.util.HashMap();
var mapRequestUserInformation = new java.util.HashMap();
var mapRequestqueryProductFixed = new java.util.HashMap();
var mapRequestQueryCustomerFull = new java.util.ArrayList();

var cal = new java.util.GregorianCalendar();
var cacheKey = "";
var accesId=subscriberId.substring(3);
var hsiServiceSubscribed = "false";
var iptvServiceSubscribed = "false";
var voiceServiceSubscribed = "false";
var dthServiceSubscribed = "false";
var rtbServiceSubscribed="false";//Added for Voice RTB
var isFiber=true;
var productRespons;

function computeFullRut(rut, rutDV){
	var fullRut = rut+"-"+rutDV;
	try{
	var myFormat = new java.text.NumberFormat.getInstance(java.util.Locale.ITALIAN);
	myFormat.setGroupingUsed(true);
		fullRut = myFormat.format(new java.lang.Integer(rut))+"-"+rutDV;
	}
	catch (ex){
		log.error(LOG_HEADER + "error formatting fullRut to #.###");
	}
	return fullRut;
}

function getDTHDecoderCountAndChannelPackages(dthList) {
	
	var userDTHPSCodesList = new java.util.ArrayList();
	var userDTHPSIdCodesList = new java.util.ArrayList();
	var decoderListCRM = new java.util.ArrayList();
	var decodifierCountCRM = 0;
	//CR-1412 Start
	var returnDTHMap = new java.util.LinkedHashMap();
	var decoStatusMap = new java.util.ArrayList();
	var plansListOfMaps = new java.util.ArrayList();
	//CR-1412 End	
	var returnMap = new java.util.HashMap();
	var status = dthList.get(0).get("status");
	if( status == null){
		status = "Active";
	}
	try{	
		var allDTHPSCodes = Utility.readResourceFile("smp/psCodes/AllDTHPSCodes.json");
		var allDTHPSCodesMap = Utility.fnJsonToMap(allDTHPSCodes); 	

		var allDTHDecoderPSCodes = Utility.readResourceFile("smp/psCodes/AllDTHDecoderPSCodes.json");
		var allDTHDecoderPSCodesMap = Utility.fnJsonToMap(allDTHDecoderPSCodes); 	
		
		//CR-1412 Start
		returnDTHMap = getDTHDecodersAndPlans();
		//CR-1412 End
		//replace DTH list from Query Product with list from ListaPsFrontEnd
		var listaPsFrontEnd= Unifica.listaPsFrontEnd(subscriberId,result.get("activationDate"),additionalInputParams);
		dthList = listaPsFrontEnd.get("dthList");
		dthList.get(0).put("status", status);
		result.put("dthList",dthList);
		dthList = listaPsFrontEnd.get("dthList").get(0).get("productList");
		if(dthList!=null) {
			for (var i=0;i<dthList.size();i++) {
				var psCode = dthList.get(i).get("id").toString();
				if(psCode!=null && !psCode.equals("")) {
					log.info("Unifica.getSubscriberDetails: PS code: "+psCode);
					if(allDTHPSCodesMap.containsKey(psCode)) {
						var userDTHPSCode = new java.util.HashMap();
						userDTHPSCode.put("ID",psCode);
						userDTHPSCode.put("Value",allDTHPSCodesMap.get(psCode));
						log.info(LOG_HEADER + "Unifica.getSubscriberDetails DTH PSCODE Condition match");
						userDTHPSCodesList.add(userDTHPSCode);
						userDTHPSIdCodesList.add(psCode);
					}
					else if(allDTHDecoderPSCodesMap.containsKey(psCode)) {
						var rawCant = dthList.get(i).get("cant").toString()+"";
						var cant = rawCant*1;
						decodifierCountCRM =decodifierCountCRM+cant;
						log.info(LOG_HEADER + "Unifica.getSubscriberDetails DTH Decoder PSCODE Condition match");
						var decorderPSCodeMap = new java.util.HashMap();
						decorderPSCodeMap.put("ID",psCode);
						decorderPSCodeMap.put("Value",allDTHDecoderPSCodesMap.get(psCode));
						decorderPSCodeMap.put("Cant",cant);
						decoderListCRM.add(decorderPSCodeMap);						
					}
				}
			}
		}
		//CR-1412 Start
		log.info(LOG_HEADER + "|getDTHDecoderCountAndChannelPackages|returnDTHMap|" + returnDTHMap);
		if(returnDTHMap != null){
			decoStatusMap = getDecoderStatus(returnDTHMap);
			plansListOfMaps = returnDTHMap.get("responseStatus").get("plansMaps");
		}
		//CR-1412 End		
	}catch(e) {
		log.error(LOG_HEADER+ " Unifica.getSubscriberDetails Error while getCustomerDTHChannelPackages "+e);
	}
	returnMap.put("userDTHPSCodes",userDTHPSCodesList);
	returnMap.put("userDTHPSIdCodes",userDTHPSIdCodesList);
	returnMap.put("decodifierCountCRM",decodifierCountCRM);
	returnMap.put("decoderListCRM",decoderListCRM);
	//CR-1412 Start
	returnMap.put("decoStatusMap",decoStatusMap);
	returnMap.put("plansListOfMaps",plansListOfMaps);
	log.info(LOG_HEADER + "|getDTHDecoderCountAndChannelPackages|returnMap|" + returnMap);
	//CR-1412 End
	
	return returnMap;
}

function createIpTvPackageList(productRespons, subscriberId, additionalInputParams)
{
	log.info(LOG_HEADER + "createIpTvPackageList");
	var ret = new java.util.ArrayList();
	var iptvProductList = productRespons.get("iptvList").get(0).get("productList");
	if(iptvProductList!= null && !iptvProductList.isEmpty()) {
		var iptvPkgPSList = new java.util.ArrayList();
		for (var i = 0; i < iptvProductList.size(); i++) {
			if(iptvProductList.get(i).get("description").startsWith("PLAN") || iptvProductList.get(i).get("id").toString().equals("6034")) {								
				//tvPkgList.add(productlist.get(i));
				iptvPkgPSList.add(iptvProductList.get(i).get("id"));
				log.info(LOG_HEADER + "iptvProductList!!!" +iptvProductList.get(i).get("id"));
				//pkgDisplayData.put(productlist.get(i).get("id"),productlist.get(i).get("description"));													
			}			
		}
		var tvConfigResponse = E2EDiagnosis.getTVServiceConfiguration(subscriberId,iptvPkgPSList,additionalInputParams);
		//result.put("iptvPkgList",tvConfigResponse.get("codeList"));
		var iptvPkgList = new java.util.ArrayList();
		var tempMap = new java.util.HashMap();
		tempMap=tvConfigResponse.get("codeList");
		if(tempMap != null){
			var it = tempMap.entrySet().iterator();
			while (it.hasNext()){
				var tmpEl = new java.util.HashMap();
				var pair = it.next();

				if ((pair.getKey().toString()!="1793")){
					tmpEl.put('PS',pair.getKey().toString());
					tmpEl.put('CodeList',pair.getValue());
				

					for(var i = 0; i < iptvProductList.size(); i++){
						if((iptvProductList.get(i).get("id")==pair.getKey()))
							tmpEl.put('Description',iptvProductList.get(i).get("description"));
					}
				}



				
				iptvPkgList.add(tmpEl);								
			}
		}
		ret.addAll(iptvPkgList);
	}
	log.info(LOG_HEADER + "iptvPkgList" + ret);
 	return ret;						
}


function createDthPackageList(productRespons, dthPkgPSList, subscriberId, additionalInputParams)
{
	log.info(LOG_HEADER + "createDthPackageList");
	var ret = new java.util.ArrayList();
	var dthProductList = productRespons.get("dthList").get(0).get("productList");
	if(dthProductList!= null && !dthProductList.isEmpty()) {
		var tvConfigResponse = E2EDiagnosis.getTVServiceConfiguration(subscriberId,dthPkgPSList,additionalInputParams);
		if ("0".equals(tvConfigResponse.get("resultCode"))){
			var dthPkgList = new java.util.ArrayList();
			var tempMap = new java.util.HashMap();
			tempMap=tvConfigResponse.get("codeList");
			var it = tempMap.entrySet().iterator();
			while (it.hasNext()){
				var tmpEl = new java.util.HashMap();
				var pair = it.next();
				tmpEl.put('PS',pair.getKey().toString());
				tmpEl.put('CodeList',pair.getValue());
								
				for(var i = 0; i < dthProductList.size(); i++){
					if((dthProductList.get(i).get("id")==pair.getKey()))
						tmpEl.put('Description',dthProductList.get(i).get("description"));
				}
				dthPkgList.add(tmpEl);								
			}
			ret.addAll(dthPkgList);
		}
	}
	log.info(LOG_HEADER + "dthPkgList" + ret);
 	return ret;						
}
function updatePDTIPsCodesForRTB(result){
	if( result.get("rtbList") == null || result.get("rtbList").size() == 0 || result.get("rtbList").get(0) == null || result.get("rtbList").get(0).get("productList") == null) return;
	if( result.get("hsiList") == null || result.get("hsiList").size() == 0 || result.get("hsiList").get(0) == null|| result.get("hsiList").get(0).get("productList") == null) return;

	var rtbProductList = result.get("rtbList").get(0).get("productList");
	var hsiProductList = result.get("hsiList").get(0).get("productList");
	
	var stbPsCodes = Utility.readResourceFile("smp/psCodes/STB/AllRTBPSCodes.json");
	var stbPsCodes = Utility.fnJsonToMap(stbPsCodes); 
	var stbPDTICodes = stbPsCodes.get("PDTI");
	
	if( hsiProductList.size() > 0 ){
		for( var i =0; i < hsiProductList.size(); i++){
			var psCode = hsiProductList.get(i).get("id");
			var exists = null;
			try{
				exists = stbPDTICodes.get(psCode);
			}catch(e){
				log.info("updatePDTIPsCodesForRTB  e:"+e);					
			}

			if( exists ){
				rtbProductList.add(hsiProductList.get(i));
			}
		}
	}
}

function updateHSILidesForOperation(result){
	if( result.get("hsiList") == null || result.get("hsiList").size() == 0 || result.get("hsiList").get(0) == null|| result.get("hsiList").get(0).get("productList") == null) return;
	if( listaPsFrontEnd.get("hsiList") == null || listaPsFrontEnd.get("hsiList").size() == 0 || listaPsFrontEnd.get("hsiList").get(0) == null) return;

	var hsiPsFrontEnd = listaPsFrontEnd.get("hsiList");
	var hsiProductList = result.get("hsiList").get(0).get("productList");

	if( hsiProductList.size() > 0 ){
		for( var i =0; i < hsiProductList.size(); i++){
			var psCode = hsiProductList.get(i).get("id");
			var exists = null;
			for( var j =0; j < hsiPsFrontEnd.size(); j++){
				if (psCode == hsiPsFrontEnd.get(j).get("id")){
					try{
                        result.get("hsiList").get(0).get("productList").get(i).put("operation",hsiPsFrontEnd.get(j).get("operation"));
                        }catch(e){
                       				log.info(LOG_HEADER + " updateHSILidesForOperation DENTRO error   e:"+e);	
                        }
				}
			}
		}
	}
}
//CR-1412 Start
function getDTHDecodersAndPlans(){
	var result = new java.util.LinkedHashMap();
	var responseStatus = new java.util.HashMap();
	var responseInfo = new java.util.HashMap();
	try{
	responseStatus = DTH.getDTHDecoderCardStatus(subscriberId,additionalInputParams,"CTSubscriberInitialization","CRM","","","","0.0.0.0");
	responseInfo = DTH.getDTHAccountInfo(subscriberId,"DIAGNOSIS","0.0.0.0",additionalInputParams,"CTSubscriberInitialization","CRM","","","");
	log.info(LOG_HEADER + "|getDTHDecodersAndPlans|responseStatus|" + responseStatus);
	log.info(LOG_HEADER + "|getDTHDecodersAndPlans|responseInfo|" + responseInfo);
		if(responseStatus != null && responseStatus.get("resultCode")!=null && "0".equals(responseStatus.get("resultCode"))
			&& responseInfo != null && responseInfo.get("resultCode")!=null && "0".equals(responseInfo.get("resultCode"))){
			log.info(LOG_HEADER + "|getDTHDecodersAndPlans|response success|");
			result.put("responseStatus",responseStatus);
			result.put("responseInfo",responseInfo);
			return result;
		}else{
			log.info(LOG_HEADER + "|getDTHDecodersAndPlans|response error|");
			return null
		}
	}catch (e){
		log.error(LOG_HEADER + "Unifica.getSubscriberDetails Error while getDTHDecodersAndPlans " + e);
	}
	return result;
}

function getDecoderStatus(decoderMap){
	var decodersList = new java.util.ArrayList();
	var paresList = decoderMap.get("responseInfo").get("paresList");
	var decoStatusMap = decoderMap.get("responseStatus").get("decoStatusMap");
	if(paresList != null && decoStatusMap != null){
		for (var i=0;i<paresList.size();i++) {
			if(decoStatusMap.containsKey(paresList.get(i).get("decoder"))) {
				var deco = paresList.get(i);
				var decoder = new java.util.HashMap();
				decoder.put("decoder",deco.get("decoder"));
				decoder.put("card",deco.get("card"));
				decoder.put("make",deco.get("make"));
				decoder.put("model",deco.get("model"));
				decoder.put("isPVR",deco.get("isPVR"));
				decoder.put("isHD",deco.get("isHD"));
				decoder.put("status",decoStatusMap.get(deco.get("decoder")));
				decodersList.add(decoder);
			}
		}
	}
	log.info(LOG_HEADER + "|getDecoderStatus|decodersList|" + decodersList);
	return decodersList;
}
//CR-1412 End

//CR-1540
function iptvValidateDecos(){
	//TFEECL-2233
	log.info(LOG_HEADER + " iptvValidateDecos start");
	try{
		var iptvPsCodes = Utility.readResourceFile("smp/chile/iptvDecoPS.json");
		var iptvPsCodes = Utility.fnJsonToMap(iptvPsCodes); 
		var iptvDecoList = new java.util.ArrayList();
		var iptvList =  isNewSubscriber? result.get("iptvList"):listaPsFrontEnd.get("iptvList");
		if( iptvList != null  && iptvList.size() > 0){
			var productList = iptvList.get(0).get("productList");
			if( productList != null && productList.size() > 0){
				var iptvCustomerType =  "Mediaroom";
				for( var i = 0; i < productList.size(); i++){
					var ps =  new java.lang.String(productList.get(i).get("id"));
					var desc = new java.lang.String(productList.get(i).get("description"));
					var cant = new java.lang.String(productList.get(i).get("cant"));
					//2663 Start
					if( iptvPsCodes.get(ps) != null){
						if ((Utility.getApplicationProperty("IPTV.PS.OP")).contains(ps)){
							log.info(LOG_HEADER + " iptvValidateDecos OP Deco found");
							iptvCustomerType =  "OpenPlatform";
						}
					//2663 End
						var psMap = new java.util.HashMap();
						psMap.put("PS",ps);
						psMap.put("Description", desc);
						psMap.put("Cant", cant);
						iptvDecoList.add(psMap);
					} 
				}
				result.put("iptvDecoList", iptvDecoList);
				result.put("iptvCustomerType", iptvCustomerType);
			}

		}
	//TFEECL-2233
	}catch(e){
	}
	log.info(LOG_HEADER + " iptvValidateDecos end");
}

function checkSTBInWarranty(stbList){
	var ret = "false";
	var maxDate = 0;
	
	//get IPTV.STBwarrantyMonths application prop
	var stbWarantyMonths = 3;
	var stbWarantyMonthsStr = Utility.getApplicationProperty("IPTV.STBwarrantyMonths");		
	if(stbWarantyMonthsStr != null && !isNaN(stbWarantyMonthsStr)) {
		stbWarantyMonths = new java.lang.Integer(stbWarantyMonthsStr);
	}
	log.debug(LOG_HEADER + " stbWarantyMonths: " + stbWarantyMonths);
	
	var warrantyStartDTMillis = getMonthsBefore(stbWarantyMonths);
	log.debug(LOG_HEADER + " checkSTBInWarranty: warrantyStartDTMillis: " + warrantyStartDTMillis);

	if (stbList!=null)
		for (var i=0; i<stbList.size(); i++){
			var dtStr = stbList.get(i).get("startTime");
			log.debug(LOG_HEADER + " checkSTBInWarranty: servStart: " + dtStr);
			var servStart = Utility.convertDateStrToMillis(dtStr,"yyyy-MM-dd'T'hh:mm:ss.SSS'Z'");
			log.debug(LOG_HEADER + " checkSTBInWarranty: servStartmillis: " + servStart);
		
			if (warrantyStartDTMillis<= servStart){
				log.debug(LOG_HEADER + " checkSTBInWarranty: found STB in warranty: " + stbList.get(i).get("description"));
				return "true";
			}
		}		
	
	return ret;
}


function getMonthsBefore(months){
	var cal = java.util.Calendar.getInstance();
	cal.add(java.util.Calendar.MONTH, -months);
	return cal.getTimeInMillis();
}

//CR-2344 Start - DCT
function validateCustomerWithoutIPTVonVPI(){
	try{
		log.info(LOG_HEADER +  " Customer does not have IPTV subscribed, checking if it has any open petitions for IPTV");
		//This scenario is to call  service
		var petitionSubscriber = Unifica.newSubscriberDetails(subscriberId,additionalInputParams);
		log.info(LOG_HEADER +  " Result after checking IPTV petitions:" + petitionSubscriber);
		
		if( petitionSubscriber.get("resultCode") == "0" ){
			resultCode = "0";
			result.put("iptvList", petitionSubscriber.get("iptvList"));
			result.put("iptvPkgList", petitionSubscriber.get("iptvPkgList"));
			result.put("iptvDecoList", petitionSubscriber.get("iptvDecoList"));
			var iptvDecoListT  = result.get("iptvDecoList");
			if(iptvDecoListT.size() > 0){
				isNewSubscriber = true;				
				result.put("iptvServiceSubscribed", "true");
			}

			var hsiList  = result.get("hsiList");
			if(hsiList.size() > 0){			
				result.put("hsiServiceSubscribed", "true");
			}
			var voiceList  = result.get("voiceList");
			if(voiceList.size() > 0){			
				result.put("voiceServiceSubscribed", "true");
			}			
		}
	}catch(e){
		log.error(LOG_HEADER + " Error while checking VPI for IPTV petitions: " + e.rhinoException.getScriptStackTrace());
	}	
}

function procesaQueryCustomerFull(accesId,procesaRutMap)
{
	var structEstado= procesaRutMap.get("estado");
	var resultCode= structEstado.get("codigoEstado");
	var resultMessage = structEstado.get("glosaEstado");
	//var returnMap = new java.util.HashMap();
	log.info(LOG_HEADER + " procesaQueryCustomerFull resultCode["+ resultCode+ "]resultMessage["+resultMessage+"]");
	var rootDatos = procesaRutMap.get("datos");
	var customerroot = rootDatos.get("customer");	
	var customeridroot = new java.util.ArrayList();
	var listproductbelieve= new java.util.ArrayList();
	var listMap = new java.util.HashMap();
	var customerInformation = new java.util.LinkedHashMap();


	var listCustomers= rootDatos.get("customer");
	var isIPTV=false;
	var serviceIdForAddress="";
	var accountList = new java.util.ArrayList();
	var findForAccesId=false;
	var dthList = new java.util.ArrayList();
	var iptvList = new java.util.ArrayList();
	var hsiList = new java.util.ArrayList();
	var voiceList = new java.util.ArrayList();
	var nodoDTHList = new java.util.HashMap();
	var nodoIPTVList = new java.util.HashMap();
	var nodoHSIList = new java.util.HashMap();
	var nodoVOICEList = new java.util.HashMap();
	var subscriberNotFound = true;
	var ottMap = new java.util.HashMap();

	result.put("lastName",mapRequestQueryCustomerFull.get("datos").get("customer").get(0).get("customerFamilyNames"));
	result.put("name",mapRequestQueryCustomerFull.get("datos").get("customer").get(0).get("customerGivenNames"));


result.put("email",mapRequestQueryCustomerFull.get("datos").get("customer").get(0).get("eMailAddress"));
result.put("preferredContactCellPhone2",mapRequestQueryCustomerFull.get("datos").get("customer").get(0).get("telephoneNumber"));
result.put("preferredContactCellPhone",mapRequestQueryCustomerFull.get("datos").get("customer").get(0).get("telephoneNumber"));
result.put("preferredContactEmail",mapRequestQueryCustomerFull.get("datos").get("customer").get(0).get("eMailAddress"));

	for(var i = 0; i<listCustomers.size(); i++){
log.info(LOG_HEADER + " procesaQueryCustomerFull fullName["+ listCustomers.get(i).get("customerName")+ "]rutAmdocs["+rutAmdocs+"]");	
//		customerInformation.put("fullName",listCustomers.get(i).get("customerName"));	
		customerInformation.put("fullName",result.get("name") + " " + result.get("lastName"));
		customerInformation.put("rut",rutAmdocs);
		var listProductBelieve=listCustomers.get(i).get("productBelieve");
		
		for (var j = 0; j < listProductBelieve.size(); j++){
			var varAccesId=listProductBelieve.get(j).get("accesId");
			//Solo si los datos corresponden al AccesID seleccionado en la primera pantalla 

log.info(LOG_HEADER + " procesaQueryCustomerFull accesId["+ accesId+ "]varAccesId["+varAccesId+"]");	
//**********************************
			if (varAccesId == "") {
log.info(LOG_HEADER + "Entra a validar OTT.");
				var listService=listProductBelieve.get(j).get("service");
				for (var k = 0; k < listService.size(); k++){
					if (listService.get(k).get("instanceName") == "OTT"){
						var ottServiceSubscribed = "No";
						var ottServiceLightSubscribed = "No";
						var ottServiceFullSubscribed = "No";

log.info(LOG_HEADER + " procesaQueryCustomerFull OTT");
						var ottProduct = new java.util.HashMap();
						var ottProductListMap = new java.util.ArrayList();
						var productosOtt = Believe.searchProductUserInformation(mapRequestUserInformation, "OTT");
						ottProduct.put("description",productosOtt.get("plan").get("displayName"));
						ottProduct.put("startTime",listService.get(k).get("statusDate"));
						var id = productosOtt.get("plan").get("catalogItemID");
						ottProduct.put("id",id);
						ottProduct.put("subGroup1","0");
						ottProduct.put("subGroup2","0");
						ottProductListMap.add(ottProduct);	
						if(id == "6338"){
							ottServiceSubscribed = "yes";
						}else if(id == "7350"){
							ottServiceLightSubscribed = "yes";
						}else if(id == "7362"){
							ottServiceFullSubscribed = "yes";
						}

						//ottMap.put("description",ottDesc); // "OTT"
						//ottMap.put("startTime",startTimeOtt);
						var ottServiceStatus = "inactive";
						if (listService.get(k).get("statusTitle") == "Activo" ) {
							ottMap.put("status", "Active" );
							ottServiceStatus = "active";
						}
						else if (listService.get(k).get("statusTitle") == "Suspendido" ) {
							ottMap.put("status","Suspendido");

						} else {
							ottMap.put("status", "Cesado" );
						}
						ottMap.put("productList",ottProductListMap);

						result.put("ottList",ottMap);
						result.put("ottServiceSubscribed",ottServiceSubscribed);
						result.put("ottServiceLightSubscribed",ottServiceLightSubscribed);
						result.put("ottServiceStatus",ottServiceStatus);
						result.put("ottServiceFullSubscribed",ottServiceFullSubscribed);
						log.info(LOG_HEADER + " FIN procesaQueryCustomerFull OTT");
					}
				}
			}

			if (accesId == varAccesId) {
log.info(LOG_HEADER + " procesaQueryCustomerFull dentro if de coincidencia accesId " + accesId);
				var TmpListIPTV = new java.util.ArrayList();
				var TmpListEProduct = new java.util.ArrayList();
				var TmpMapIPTV= new java.util.HashMap();
				var TmpMapMainSTB= new java.util.HashMap();
				findForAccesId=true;
				var listService=listProductBelieve.get(j).get("service");
				for (var k = 0; k < listService.size(); k++){

				if (listService.get(k).get("instanceName") == "Equipamiento del producto"){
log.info(LOG_HEADER + " procesaQueryCustomerFull Producto Equipamiento del producto [" + mapRequestUserInformation + "]");

						
						var mapEProduct=Believe.searchProductUserInformation( mapRequestUserInformation, "Equipamiento del producto" );
//**Generales
						result.put("subscriberCity",mapEProduct.get("address").get("communeValue"));//userInformation	$.datos.content.ClientUserContext.allProducts[?(@.customerIdX9=='' && @.productName=='Equipamiento del producto')].address.communeValue
						result.put("subscriberComune",mapEProduct.get("address").get("communeValue"));
						result.put("subscriberStreet",mapEProduct.get("address").get("streetName"));
						result.put("subscriberNumber",mapEProduct.get("address").get("streetNumber"));
						result.put("subscriberApartment",mapEProduct.get("address").get("apartment"));
						result.put("subscriberFloor",mapEProduct.get("address").get("floor"));
						result.put("subscriberRegion",mapEProduct.get("address").get("region"));
						result.put("normalizedId",mapEProduct.get("address").get("normalizationCode"));
						
						//se inicizializan como Activos si un servicio es inactivo lo desabilita el servicio
						result.put("accountStatus","Active");
						result.put("accountStatusUNIFICA","ACTIVO");
//**Fin Generales

						var serviceId = listService.get(k).get("serviceId");
						mapRequestqueryProductFixed = Believe.executeRequestqueryProductFixed(serviceId,tokenAxway);

// HSI Modem Fibra + ONT
log.info(LOG_HEADER + " procesaQueryCustomerFull Producto HSI Modem Fibra + ONT mapEProduct[" + mapRequestqueryProductFixed + "]");	
						var varHSIFiberModemandONT = Believe.searchEquipmentQueryProductFixed( mapRequestqueryProductFixed, "Fiber Modem and ONT" );	
log.info(LOG_HEADER + " procesaQueryCustomerFull Producto HSI Modem Fibra + ONT varHSIFiberModemandONT[" +  varHSIFiberModemandONT + "]");
						if ( varHSIFiberModemandONT.size() > 0) {
							var TmpMapHSIModem= new java.util.HashMap();
log.info(LOG_HEADER + " procesaQueryCustomerFull Producto HSI Modem Fibra + ONT varHSIFiberModemandONT serviceCatalog[" +  varHSIFiberModemandONT.get(0).get("serviceCatalog") + "]");
							TmpMapHSIModem.put("id",varHSIFiberModemandONT.get(0).get("serviceCatalog").get("ID"));
							TmpMapHSIModem.put("description",varHSIFiberModemandONT.get(0).get("serviceCatalog").get("name"));
							TmpMapHSIModem.put("subGroup1","0");
							TmpMapHSIModem.put("subGroup2","0");
							TmpListEProduct.add(TmpMapHSIModem);
						}

// HSI Fiber Modem
						var varHSIFiberModem = Believe.searchEquipmentQueryProductFixed( mapRequestqueryProductFixed, "Fiber Modem" );	
log.info(LOG_HEADER + " procesaQueryCustomerFull Producto HSI Modem Fibra varHSIFiberModem[" + varHSIFiberModem + "]");	
						if ( varHSIFiberModem.size() > 0) {
							var TmpMapHSIModem= new java.util.HashMap();							
							TmpMapHSIModem.put("id",varHSIFiberModem.get(0).get("serviceCatalog").get("ID"));
							TmpMapHSIModem.put("description",varHSIFiberModem.get(0).get("serviceCatalog").get("name"));
							//TmpMapHSI.put("startTime",listService.get(k).get("statusDate"));
							TmpMapHSIModem.put("subGroup1","0");
							TmpMapHSIModem.put("subGroup2","0");
							TmpListEProduct.add(TmpMapHSIModem);
						}	
						
// HSI ONT
log.info(LOG_HEADER + " procesaQueryCustomerFull Producto HSI ONT");	
						var varHSIFiberONT = Believe.searchEquipmentQueryProductFixed( mapRequestqueryProductFixed, "ONT" );	
						if ( varHSIFiberONT.size() > 0) {
							var TmpMapHSIModem= new java.util.HashMap();							
							TmpMapHSIModem.put("id",varHSIFiberONT.get(0).get("serviceCatalog").get("ID"));
							TmpMapHSIModem.put("description",varHSIFiberONT.get(0).get("serviceCatalog").get("name"));
							//TmpMapHSI.put("startTime",listService.get(k).get("statusDate"));
							TmpMapHSIModem.put("subGroup1","0");
							TmpMapHSIModem.put("subGroup2","0");
							TmpListEProduct.add(TmpMapHSIModem);
						}
						
// Repeater
						var varProductHSIRepeater = Believe.searchEquipmentQueryProductFixed( mapRequestqueryProductFixed, "Repeater" );
log.info(LOG_HEADER + " procesaQueryCustomerFull Producto IPTV 3 varProductHSIRepeater [" + varProductHSIRepeater + "]");
						if(varProductHSIRepeater.size() > 0){
							var equipAcquisition = Believe.searchAttributeQueryProductFixed( varProductHSIRepeater.get(0), "Acquisition_Type" );
log.info(LOG_HEADER + " procesaQueryCustomerFull Producto IPTV 4- equipAcquisition:"+equipAcquisition);
							result.put("equipAcquisition",equipAcquisition.get("value"));
							var methodInst = Believe.searchAttributeQueryProductFixed( varProductHSIRepeater.get(0), "Installation_Method" );
log.info(LOG_HEADER + " procesaQueryCustomerFull Producto IPTV 4- methodInst:"+methodInst);
							result.put("methodInst",methodInst.get("value"));
						}
						else{
						}
							log.info(LOG_HEADER + " varProductHSIRepeater.size "+varProductHSIRepeater.size());
						if ( varProductHSIRepeater.size() > 0 ) {
								
							for (var l = 0; l < varProductHSIRepeater.size(); l++){
								var TmpMapRepeater = new java.util.HashMap();
								var varEquipmentType = Believe.searchAttributeQueryProductFixed( varProductHSIRepeater.get(l), "Equipment_Type" );
								TmpMapRepeater.put("description",varEquipmentType.get("value"));
								var varWarrantyStartDate = Believe.searchAttributeQueryProductFixed( varProductHSIRepeater.get(l),"WarrantyStartDate" );
								TmpMapRepeater.put("startTime",varWarrantyStartDate.get("value"));
								TmpMapRepeater.put("id",varProductHSIRepeater.get(l).get("serviceCatalog").get("ID"));
								TmpMapRepeater.put("subGroup1","0");
								TmpMapRepeater.put("subGroup2","0");
								log.info(LOG_HEADER + "TmpMapRepeater map 1"+TmpMapRepeater);
								TmpListEProduct.add(TmpMapRepeater);
								log.info(LOG_HEADER + "TmpListEProduct"+TmpListEProduct);
							}
							
						}
////INICIO Datos a HSI si existe la lista productList 
log.info(LOG_HEADER + " procesaQueryCustomerFull Antes Enguage hsiList [" + result.get("hsiList") + "]");
						if (result.get("hsiList") != null) {
							//var TmpListHSI = new java.util.ArrayList();
							var TmpListHSI = result.get("hsiList").get(0).get("productList");
							for (var x = 0; x < TmpListHSI.size(); x++){
								TmpListEProduct.add(TmpListHSI.get(x));
							}
							result.get("hsiList").get(0).put("productList",TmpListEProduct);
						}
// FIN Agregar Datos a HSI si existe la lista productList
					}
					else if (listService.get(k).get("instanceName") == "Broadband"){
						hsiServiceSubscribed=true;
						var TmpListHSI = new java.util.ArrayList();
						var TmpMapHSI = new java.util.HashMap();

log.info(LOG_HEADER + " procesaQueryCustomerFull Producto HSI 20211220 13:30 Generic ");
// HSI Generic
						nodoHSIList.put("area","000");
						nodoHSIList.put("phoneNumber",subscriberId.substring(3));
						nodoHSIList.put("activationDate",listService.get(k).get("statusDate"));
						//nodoHSIList.put("accountNumber",""); 
						//nodoHSIList.put("zone",);
						//nodoHSIList.put("commercialPlant",);
						nodoHSIList.put("installationDate",listService.get(k).get("statusDate"));
						//nodoHSIList.put("lineType",);
						//nodoHSIList.put("lineStatus",);
						//nodoHSIList.put("agency",);
						if (listService.get(k).get("statusTitle") != "Activo" ) {
							nodoHSIList.put("status", "inactive" );
						} else {
							nodoHSIList.put("status", "Active" );

						}
// HSI FIgeneric
						
// HSI PLAN
						var planHSI=Believe.searchProductUserInformation( mapRequestUserInformation, "Broadband" );
						TmpMapHSI.put("startTime",listService.get(k).get("statusDate"));
						TmpMapHSI.put("description",planHSI.get("plan").get("displayDescription"));
						TmpMapHSI.put("id",planHSI.get("plan").get("catalogItemID"));
						TmpMapHSI.put("subGroup1","0");
						TmpMapHSI.put("subGroup2","0");
						
						TmpListHSI.add(TmpMapIPTV);
						
						for (var x = 0; x < TmpListEProduct.size(); x++){
							TmpListHSI.add(TmpListEProduct.get(x));
						}						

						nodoHSIList.put("installationStreet",planHSI.get("address").get("streetName"));//$.datos.content.ClientUserContext.allProducts[?(@.customerIdX9=='' && @.productName=='Equipamiento del producto')].address.streetName
						nodoHSIList.put("installationNumber",planHSI.get("address").get("streetNumber"));
						nodoHSIList.put("installationFloor",planHSI.get("address").get("floor"));
						nodoHSIList.put("installationDepartment",planHSI.get("address").get("apartment"));
						nodoHSIList.put("installationPostal",planHSI.get("address").get("postCode"));
						nodoHSIList.put("installationComune",planHSI.get("address").get("communeValue"));
						nodoHSIList.put("installationComuneCod",planHSI.get("address").get("commune"));
						nodoHSIList.put("installationCity",planHSI.get("address").get("communeValue"));
						nodoHSIList.put("billingStreet",planHSI.get("address").get("streetName"));
						//nodoHSIList.put("SigresState",);

//networkType	
						var serviceId = listService.get(k).get("serviceId");
						nodoHSIList.put("serviceId",serviceId);
						mapRequestqueryProductFixed = Believe.executeRequestqueryProductFixed(serviceId,tokenAxway);	

						var varAccessHSIPlan = Believe.searchEquipmentQueryProductFixed( mapRequestqueryProductFixed, "Access" );	
						var varNetwork_technology = Believe.searchAttributeQueryProductFixed( varAccessHSIPlan.get(0), "Network_technology" );
						var varNetworkType=varNetwork_technology.get("value");
						result.put("networkType",varNetworkType);

						var varProductHSIPlan = Believe.searchEquipmentQueryProductFixed( mapRequestqueryProductFixed, "Broadband Plan" );	
						var varUpload_speed = Believe.searchAttributeQueryProductFixed( varProductHSIPlan.get(0), "Upload_speed" );
						nodoHSIList.put("upstreamBelieve",varUpload_speed.get("value").replace("Mbps",""));
						var varDownload_Speed = Believe.searchAttributeQueryProductFixed( varProductHSIPlan.get(0), "Download_Speed" );
						nodoHSIList.put("downstreamBelieve",varDownload_Speed.get("value").replace("Mbps",""));	//Falta programar
						var varPSIsp = Believe.searchAttributeQueryProductFixed( varProductHSIPlan.get(0), "PS_isp" );
						var varPsAccess = Believe.searchAttributeQueryProductFixed( varProductHSIPlan.get(0), "PS_accesso" );
						var psIspFromCRM = varPSIsp.get("value");
						var psAccessFromCRM = varPsAccess.get("value");
						result.put("PsAccess",psAccessFromCRM);
						result.put("PsIsp",psIspFromCRM);

						if (listService.get(k).get("statusTitle") == "Activo" ) {
							nodoHSIList.put("status", "Active" );
						}
						else if (listService.get(k).get("statusTitle") == "Suspendido" ){
							nodoHSIList.put("status", "Suspendido" );
							result.put("accountStatus","Suspendido");
							result.put("accountStatusUNIFICA","SUSPENDIDO");
						} else {
							nodoHSIList.put("status", "Cesado" );
							result.put("accountStatus","Cesado");
							result.put("accountStatusUNIFICA","CESADO");
						}

						nodoHSIList.put("productList",TmpListHSI);
						hsiList.add(nodoHSIList);
						result.put("hsiList",hsiList);
					}					
					else if (listService.get(k).get("instanceName") == "Producto IPTV"){
log.info(LOG_HEADER + " procesaQueryCustomerFull Producto IPTV");
						iptvServiceSubscribed=true;
						var TmpListIPTV = new java.util.ArrayList();
						var TmpMapIPTV = new java.util.HashMap();
						var TmpMapIPTVPkg = new java.util.HashMap();
						var TmpListIPTVPkg = new java.util.ArrayList();
						var TmpMapPlanCloud = new java.util.HashMap();
// IPTV
						var planIPTV=Believe.searchProductUserInformation( mapRequestUserInformation, "Producto IPTV" );
						TmpMapIPTV.put("startTime",listService.get(k).get("statusDate"));
						TmpMapIPTV.put("description",planIPTV.get("plan").get("displayDescription"));
						TmpMapIPTV.put("id",planIPTV.get("plan").get("catalogItemID"));
						TmpMapIPTV.put("subGroup1","0");
						TmpMapIPTV.put("subGroup2","0");
						TmpListIPTV.add(TmpMapIPTV);
		
// IPTV -- Main STB
						var serviceId = listService.get(k).get("serviceId");
						mapRequestqueryProductFixed = Believe.executeRequestqueryProductFixed(serviceId,tokenAxway);	
						
log.info(LOG_HEADER + " procesaQueryCustomerFull Producto IPTV");
						var varAccessIPTVPlan = Believe.searchEquipmentQueryProductFixed( mapRequestqueryProductFixed, "Access" );	
						var varNetwork_technology = Believe.searchAttributeQueryProductFixed( varAccessIPTVPlan.get(0), "Network_technology" );
						var varNetworkType=varNetwork_technology.get("value");
						result.put("networkType",varNetworkType);
						
						var varProductIPTVMainSTB = Believe.searchEquipmentQueryProductFixed( mapRequestqueryProductFixed, "Main STB" );	
						var varSTBType = Believe.searchAttributeQueryProductFixed( varProductIPTVMainSTB.get(0), "STB_Type" );
						TmpMapMainSTB.put("description",varSTBType.get("value"));
						var varWarrantyStartDate = Believe.searchAttributeQueryProductFixed( varProductIPTVMainSTB.get(0), "WarrantyStartDate" );
						var varStartTime = varWarrantyStartDate.get("value");
						//Formateo de la fecha
						varStartTime = varStartTime.split(" ")[0]; 
						varStartTime = varStartTime.split("/");
						varStartTime = varStartTime[2]+"-"+varStartTime[1]+"-"+varStartTime[0]
						//Fin Formateo
						TmpMapMainSTB.put("startTime", varStartTime);
						TmpMapMainSTB.put("id",varProductIPTVMainSTB.get(0).get("serviceCatalog").get("ID"));
						TmpMapMainSTB.put("subGroup1","0");
						TmpMapMainSTB.put("subGroup2","0");						
log.info(LOG_HEADER + " procesaQueryCustomerFull \"IPTV Main STB\"  [" + TmpMapMainSTB + "]");
						TmpListIPTV.add(TmpMapMainSTB);

// Deco DTH adicional--DTH Additional STB
						var varProductIPTVAdditionalSTB = Believe.searchEquipmentQueryProductFixed( mapRequestqueryProductFixed, "Additional STB" );

						for (var l = 0; l < varProductIPTVAdditionalSTB.size(); l++){
log.info(LOG_HEADER + " procesaQueryCustomerFull Producto IPTV 4");
							var TmpMapAdditionalSTB= new java.util.HashMap();
							//TmpMapAdditionalSTB.put("description",varProductDTHAdditionalSTB.get("plan").get("displayDescription"));
							var varSTBType = Believe.searchAttributeQueryProductFixed( varProductIPTVAdditionalSTB.get(l), "STB_Type" );
							TmpMapAdditionalSTB.put("description",varSTBType.get("value"));
							var varWarrantyStartDate = Believe.searchAttributeQueryProductFixed( varProductIPTVAdditionalSTB.get(l), "WarrantyStartDate" );
							TmpMapAdditionalSTB.put("startTime", varWarrantyStartDate.get("value"));
							TmpMapAdditionalSTB.put("id",varProductIPTVAdditionalSTB.get(l).get("serviceCatalog").get("ID"));
							TmpMapAdditionalSTB.put("subGroup1","0");
							TmpMapAdditionalSTB.put("subGroup2","0");
							TmpListIPTV.add(TmpMapAdditionalSTB);
log.info(LOG_HEADER + " procesaQueryCustomerFull \"DTH Additional STB\"  [" + TmpMapAdditionalSTB + "]");
						}
						var isfiberB = fnIsFiber(serviceId);
						
						if(isfiberB == true){
							TmpMapPlanCloud.put("id","1019");
							TmpMapPlanCloud.put("description"," PLAN CLOUD PVR");
							TmpMapPlanCloud.put("startTime",listService.get(k).get("statusDate"));
							TmpMapPlanCloud.put("subGroup1","0");
							TmpMapPlanCloud.put("subGroup2","0");
						}
						TmpListIPTV.add(TmpMapPlanCloud);
						nodoIPTVList.put("description","IPTV");
						if (listService.get(k).get("statusTitle") == "Activo" ) {
							nodoIPTVList.put("status", "Active" );
						}
						else if (listService.get(k).get("statusTitle") == "Suspendido" ) {
							nodoIPTVList.put("status", "Suspendido" );
							result.put("accountStatus","Suspendido");
							result.put("accountStatusUNIFICA","SUSPENDIDO");
						} else {
							nodoIPTVList.put("status", "Cesado" );
							result.put("accountStatus","Cesado");
							result.put("accountStatusUNIFICA","CESADO");
						}
						nodoIPTVList.put("startTime",listService.get(k).get("statusDate"));
						nodoIPTVList.put("productList",TmpListIPTV);
						nodoIPTVList.put("serviceId",serviceId);
						iptvList.add(nodoIPTVList);
						result.put("iptvList",iptvList);
log.info(LOG_HEADER + " procesaQueryCustomerFull Producto IPTV 6 [" + result + "]");
						if (result.get("iptvList").size() > 0){
							var iptvProductList = result.get("iptvList").get(0).get("productList");
							if(iptvProductList!= null && !iptvProductList.isEmpty()){
								iptvServiceSubscribed = "true";
								TmpMapIPTVPkg.put("Description",planIPTV.get("plan").get("displayDescription"));
								TmpMapIPTVPkg.put("PS",planIPTV.get("plan").get("catalogItemID"));
								var varProductIPTVPlan = Believe.searchEquipmentQueryProductFixed( mapRequestqueryProductFixed, "IPTV Plan" );	
								var varMapFulfillment_Code = Believe.searchAttributeQueryProductFixed(varProductIPTVPlan.get(0), "Fulfillment_Code");
								var TmpIPTVFulfillment_Code = new java.util.ArrayList();
								TmpIPTVFulfillment_Code.add(varMapFulfillment_Code.get("value"));
								TmpMapIPTVPkg.put("CodeList",TmpIPTVFulfillment_Code);
								TmpListIPTVPkg.add(TmpMapIPTVPkg);
								result.put("iptvPkgList",TmpListIPTVPkg);
								result.put("ottPkgList",result.get("iptvPkgList"));
							}
						}

					}
					else if (listService.get(k).get("instanceName") == "Telefonía por IP"){
						var TmpListTOIP = new java.util.ArrayList();
log.info(LOG_HEADER + " procesaQueryCustomerFull Telefonía por IP INICIO 0");
						voiceServiceSubscribed="true";
						nodoVOICEList.put("ratePlan","");
						var serviceId = listService.get(k).get("serviceId");
						mapRequestqueryProductFixed = Believe.executeRequestqueryProductFixed(serviceId,tokenAxway);	
						nodoVOICEList.put("vmProv","No"); //voiceMail

						//conference  == 3 way calling
						var varcnfProv = Believe.searchEquipmentQueryProductFixed( mapRequestqueryProductFixed, "3 way calling" );	
						if (varcnfProv.size() > 0){
							nodoVOICEList.put("cnfProv","Yes"); 
							var mapTemp = new java.util.HashMap();
							mapTemp.put("description",waycalling.get(0).get("serviceCatalog").get("name"));
							mapTemp.put("id",waycalling.get(0).get("serviceCatalog").get("ID"));
							mapTemp.put("cant","1");
							TmpListTOIP.add(mapTemp);	
						}
						else
						{
							nodoVOICEList.put("cnfProv","No"); 
						}
						nodoVOICEList.put("ccbProv","No");
						nodoVOICEList.put("dndProv","No"); //doNotDisturb
						nodoVOICEList.put("description","TOIP");
						
						//callerId    Caller ID
						var varclipProv = Believe.searchEquipmentQueryProductFixed( mapRequestqueryProductFixed, "Caller ID" );	
						if (varclipProv.size() > 0){
							nodoVOICEList.put("clipProv","Yes"); 
							var mapTemp = new java.util.HashMap();
							mapTemp.put("description",callerId.get(0).get("serviceCatalog").get("name"));
							mapTemp.put("id",callerId.get(0).get("serviceCatalog").get("ID"));
							mapTemp.put("cant","1");
							TmpListTOIP.add(mapTemp);
						}
						else
						{
							nodoVOICEList.put("clipProv","No"); 
						}
						nodoVOICEList.put("accountNumber","");
						nodoVOICEList.put("cfuProv","No");
						
						//callWaitingCallerId = Call Waiting View
						var callWaitingView = Believe.searchEquipmentQueryProductFixed( mapRequestqueryProductFixed, "Call Waiting View" );	
						if (callWaitingView.size() > 0){
							nodoVOICEList.put("cwvProv","Yes"); 
							var mapTemp = new java.util.HashMap();
							mapTemp.put("description",callWaitingView.get(0).get("serviceCatalog").get("name"));
							mapTemp.put("id",callWaitingView.get(0).get("serviceCatalog").get("ID"));
							mapTemp.put("cant","1");
							TmpListTOIP.add(mapTemp)
						}
						else
						{
							nodoVOICEList.put("cwvProv","No"); 
						}
						//callWaiting = Call waiting indication
						var callWaitingCallerId = Believe.searchEquipmentQueryProductFixed( mapRequestqueryProductFixed, "Call Waiting Identifier" );	
						if (callWaitingCallerId.size() > 0){
							nodoVOICEList.put("cwProv","Yes"); 
							var mapTemp = new java.util.HashMap();
							mapTemp.put("description",callWaitingCallerId.get(0).get("serviceCatalog").get("name"));
							mapTemp.put("id",callWaitingCallerId.get(0).get("serviceCatalog").get("ID"));
							mapTemp.put("cant","1");
							TmpListTOIP.add(mapTemp);
						}
						else
						{
							nodoVOICEList.put("cwProv","No"); 
						}
						
						var callDivert = Believe.searchEquipmentQueryProductFixed( mapRequestqueryProductFixed, "Call Divert" );
						if (callDivert.size() > 0) {
							var mapTemp = new java.util.HashMap();
							mapTemp.put("description",callDivert.get(0).get("serviceCatalog").get("name"));
							mapTemp.put("id",callDivert.get(0).get("serviceCatalog").get("ID"));
							mapTemp.put("cant","1");
							TmpListTOIP.add(mapTemp);	
						}
						var blockingServices = Believe.searchEquipmentQueryProductFixed( mapRequestqueryProductFixed, "Blocking Services" );
						if (blockingServices.size() > 0) {
							var mapTemp = new java.util.HashMap();
							mapTemp.put("description",blockingServices.get(0).get("serviceCatalog").get("name"));
							mapTemp.put("id",blockingServices.get(0).get("serviceCatalog").get("ID"));
							mapTemp.put("cant","1");
							TmpListTOIP.add(mapTemp);	
						}
						
						nodoVOICEList.put("startTime",listService.get(k).get("statusDate"));
						nodoVOICEList.put("ccbProvType","");
						nodoVOICEList.put("packageName","");
						nodoVOICEList.put("exbProvType","");
						nodoVOICEList.put("exbProv","");
						nodoVOICEList.put("voipPhoneNumber",listService.get(k).get("serviceId"));
						if (listService.get(k).get("statusTitle") == "Activo" ) {
							nodoVOICEList.put("status", "Active" );
						}
						else if (listService.get(k).get("statusTitle") == "Suspendido" ) {
							nodoVOICEList.put("status", "Suspendido" );
							result.put("accountStatus","Suspendido");
							result.put("accountStatusUNIFICA","SUSPENDIDO");
						} else {
							nodoVOICEList.put("status", "Cesado" );
							result.put("accountStatus","Cesado");
							result.put("accountStatusUNIFICA","CESADO");
						}
//PLAN
						var TmpMapVOIP = new java.util.HashMap();
						TmpMapVOIP.put("startTime",listService.get(k).get("statusDate"));
						var planVOICE=Believe.searchProductUserInformation( mapRequestUserInformation, "Telefonía por IP" );
						TmpMapVOIP.put("description",planVOICE.get("plan").get("displayDescription"));
						TmpMapVOIP.put("id",planVOICE.get("plan").get("catalogItemID"));
						TmpListTOIP.add(TmpMapVOIP);
						
						
						
						nodoVOICEList.put("productList",TmpListTOIP);
						voiceList.add(nodoVOICEList);
log.info(LOG_HEADER + " procesaQueryCustomerFull Telefonía por IP FIN result.get('voipList')" + result.get("voipList"));
						result.put("voiceList",voiceList);
						result.put("voipList",voiceList);
log.info(LOG_HEADER + " procesaQueryCustomerFull Telefonía por IP FIN" + voiceList);
log.info(LOG_HEADER + " procesaQueryCustomerFull Telefonía por IP FIN result.get('voiceList' 2)" + result.get("voiceList"));
					}
					else if (listService.get(k).get("instanceName") == "OTT"){
						//Falta aclarar
log.info(LOG_HEADER + " procesaQueryCustomerFull OTT");
					}
					else if (listService.get(k).get("instanceName") == "DTH"){
						var TmpListDTH = new java.util.ArrayList();
						var TmpMapDTH= new java.util.HashMap();
						var TmpMapMainSTB= new java.util.HashMap();
						var TmpMapAdditionalSTB= new java.util.HashMap();

						dthServiceSubscribed=true;
			
// DTH PLAN --DTH
						TmpMapDTH.put("startTime",listService.get(k).get("statusDate"));
						var planDTH=Believe.searchProductUserInformation( mapRequestUserInformation, "DTH" );
//**Generales
//						result.put("subscriberCity",planDTH.get("address").get("communeValue"));//userInformation	$.datos.content.ClientUserContext.allProducts[?(@.customerIdX9=='' && @.productName=='Equipamiento del producto')].address.communeValue
//						result.put("subscriberComune",planDTH.get("address").get("communeValue"));
//						result.put("subscriberStreet",planDTH.get("address").get("streetName"));
//						result.put("subscriberNumber",planDTH.get("address").get("streetNumber"));
//						result.put("subscriberApartment",planDTH.get("address").get("apartment"));
//						result.put("subscriberFloor",planDTH.get("address").get("floor"));
//						result.put("subscriberRegion",planDTH.get("address").get("region"));
//						result.put("normalizedId",planDTH.get("address").get("normalizationCode"));
//**Fin Generales
						TmpMapDTH.put("description",planDTH.get("plan").get("displayDescription"));
						TmpMapDTH.put("id",planDTH.get("plan").get("catalogItemID"));
						TmpMapDTH.put("subGroup1","0");
						TmpMapDTH.put("subGroup2","0");
log.info(LOG_HEADER + " procesaQueryCustomerFull \"DTH\"  [" + TmpMapDTH + "]");
						TmpListDTH.add(TmpMapDTH);
// Deco DTH principal--DTH Main STB
						mapRequestqueryProductFixed = Believe.executeRequestqueryProductFixed(accesId,tokenAxway);	
						var varProductDTHMainSTB = Believe.searchEquipmentQueryProductFixed( mapRequestqueryProductFixed, "DTH Main STB" );	
						var varSTBType = Believe.searchAttributeQueryProductFixed( varProductDTHMainSTB.get(0), "STB_Type" );
						TmpMapMainSTB.put("description",varSTBType.get("value"));
						var varWarrantyStartDate = Believe.searchAttributeQueryProductFixed( varProductDTHMainSTB.get(0), "WarrantyStartDate" );
						var varStartTime = varWarrantyStartDate.get("value");
						//Formateo de la fecha
						varStartTime = varStartTime.split(" ")[0]; 
						varStartTime = varStartTime.split("/");
						varStartTime = varStartTime[2]+"-"+varStartTime[1]+"-"+varStartTime[0]
						//Fin Formateo
						TmpMapMainSTB.put("startTime", varStartTime);
						TmpMapMainSTB.put("id",varProductDTHMainSTB.get(0).get("serviceCatalog").get("ID"));
						TmpMapMainSTB.put("subGroup1","0");
						TmpMapMainSTB.put("subGroup2","0");
log.info(LOG_HEADER + " procesaQueryCustomerFull \"DTH Main STB\"  [" + TmpMapMainSTB + "]");
						TmpListDTH.add(TmpMapMainSTB);
// Deco DTH adicional--DTH Additional STB
						var varProductDTHAdditionalSTB = Believe.searchEquipmentQueryProductFixed( mapRequestqueryProductFixed, "DTH Additional STB" );
						for (var l = 0; l < varProductDTHAdditionalSTB.size(); l++){
							var varSTBType = Believe.searchAttributeQueryProductFixed( varProductDTHAdditionalSTB.get(l), "STB_Type" );
							TmpMapAdditionalSTB.put("description",varSTBType.get("value"));
							var varWarrantyStartDate = Believe.searchAttributeQueryProductFixed( varProductDTHAdditionalSTB.get(l), "WarrantyStartDate" );
							TmpMapAdditionalSTB.put("startTime", varWarrantyStartDate.get("value"));
							TmpMapAdditionalSTB.put("id",varProductDTHAdditionalSTB.get(l).get("serviceCatalog").get("ID"));
							TmpMapAdditionalSTB.put("subGroup1","0");
							TmpMapAdditionalSTB.put("subGroup2","0");
							TmpListDTH.add(TmpMapAdditionalSTB);							
log.info(LOG_HEADER + " procesaQueryCustomerFull \"DTH Additional STB\"  [" + TmpMapAdditionalSTB + "]");
						}
//Planes UTX ????




//Fin planes UTX
						nodoDTHList.put("productList",TmpListDTH);
						nodoDTHList.put("serviceId",accesId);
						subscriberNotFound = false;
						dthList.add(nodoDTHList);						
						result.put("dthList",dthList);					

						if (listService.get(k).get("statusTitle") == "Activo" ) {
							nodoHSIList.put("status", "Active" );
						}
						else if (listService.get(k).get("statusTitle") == "Suspendido" ) {
							nodoHSIList.put("status", "Suspendido" );
							result.put("accountStatus","Suspendido");
							result.put("accountStatusUNIFICA","SUSPENDIDO");
						} else {
							nodoHSIList.put("status", "Cesado" );
							result.put("accountStatus","Cesado");
							result.put("accountStatusUNIFICA","CESADO");
						}
						dthList.add(nodoDTHList);
						result.put("dthList",dthList);
						//Falta aclarar
					}
					else if (listService.get(k).get("instanceName") == "LTE"){
						//Falta definir
log.info(LOG_HEADER + " procesaQueryCustomerFull LTE");
					}
					else if (listService.get(k).get("instanceName") == "FWT"){
						//Falta definir
log.info(LOG_HEADER + " procesaQueryCustomerFull FWT");
					}
				}
				//Si ya encontre el dato que quiero analizar me salgo del loop
				subscriberNotFound = false;
log.info(LOG_HEADER + " procesaQueryCustomerFull result dentro if de coincidencia [" + result + "]");
			}
		}
	}
log.info(LOG_HEADER + " procesaQueryCustomerFull DTH 3 ");
	if (findForAccesId==false){
		//si no encontro por accesID debo buscar por cada uno de los servicios
		isFiber=false;
		result.put("isPortedCustomer","false");		
		for(var i = 0; i<listCustomers.size(); i++){
			var listProductBelieve=listCustomers.get(i).get("productBelieve");
			for (var j = 0; j < listProductBelieve.size(); j++){
				var listService=listProductBelieve.get(j).get("service");
				for (var k = 0; k < listService.size(); k++){
					if (listService.get(k).get("serviceId") == accesId){
						var TmpListDTH = new java.util.ArrayList();
						var TmpMapDTH= new java.util.HashMap();
						var TmpMapMainSTB= new java.util.HashMap();
						var TmpMapAdditionalSTB= new java.util.HashMap();

						dthServiceSubscribed=true;
			
// DTH PLAN --DTH
						TmpMapDTH.put("startTime",listService.get(k).get("statusDate"));
						var planDTH=Believe.searchProductUserInformation( mapRequestUserInformation, "DTH" );
//**Generales
						result.put("subscriberCity",planDTH.get("address").get("communeValue"));//userInformation	$.datos.content.ClientUserContext.allProducts[?(@.customerIdX9=='' && @.productName=='Equipamiento del producto')].address.communeValue
						result.put("subscriberComune",planDTH.get("address").get("communeValue"));
						result.put("subscriberStreet",planDTH.get("address").get("streetName"));
						result.put("subscriberNumber",planDTH.get("address").get("streetNumber"));
						result.put("subscriberApartment",planDTH.get("address").get("apartment"));
						result.put("subscriberFloor",planDTH.get("address").get("floor"));
						result.put("subscriberRegion",planDTH.get("address").get("region"));
						result.put("normalizedId",planDTH.get("address").get("normalizationCode"));
//**Fin Generales
						TmpMapDTH.put("description",planDTH.get("plan").get("displayDescription"));
						TmpMapDTH.put("id",planDTH.get("plan").get("catalogItemID"));
						TmpMapDTH.put("subGroup1","0");
						TmpMapDTH.put("subGroup2","0");
log.info(LOG_HEADER + " procesaQueryCustomerFull \"DTH\"  [" + TmpMapDTH + "]");
						TmpListDTH.add(TmpMapDTH);
// Deco DTH principal--DTH Main STB
						mapRequestqueryProductFixed = Believe.executeRequestqueryProductFixed(accesId,tokenAxway);	
						var varProductDTHMainSTB = Believe.searchEquipmentQueryProductFixed( mapRequestqueryProductFixed, "DTH Main STB" );	
						var varSTBType = Believe.searchAttributeQueryProductFixed( varProductDTHMainSTB.get(0), "STB_Type" );
						TmpMapMainSTB.put("description",varSTBType.get("value"));
						var varWarrantyStartDate = Believe.searchAttributeQueryProductFixed( varProductDTHMainSTB.get(0), "WarrantyStartDate" );
						var varStartTime = varWarrantyStartDate.get("value");
						//Formateo de la fecha
						varStartTime = varStartTime.split(" ")[0]; 
						varStartTime = varStartTime.split("/");
						varStartTime = varStartTime[2]+"-"+varStartTime[1]+"-"+varStartTime[0]
						//Fin Formateo
						TmpMapMainSTB.put("startTime", varStartTime);
						TmpMapMainSTB.put("id",varProductDTHMainSTB.get(0).get("serviceCatalog").get("ID"));
						TmpMapMainSTB.put("subGroup1","0");
						TmpMapMainSTB.put("subGroup2","0");
log.info(LOG_HEADER + " procesaQueryCustomerFull \"DTH Main STB\"  [" + TmpMapMainSTB + "]");
						TmpListDTH.add(TmpMapMainSTB);
// Deco DTH adicional--DTH Additional STB
						var varProductDTHAdditionalSTB = Believe.searchEquipmentQueryProductFixed( mapRequestqueryProductFixed, "DTH Additional STB" );
						for (var l = 0; l < varProductDTHAdditionalSTB.size(); l++){
							var varSTBType = Believe.searchAttributeQueryProductFixed( varProductDTHAdditionalSTB.get(l), "STB_Type" );
							TmpMapAdditionalSTB.put("description",varSTBType.get("value"));
							var varWarrantyStartDate = Believe.searchAttributeQueryProductFixed( varProductDTHAdditionalSTB.get(l), "WarrantyStartDate" );
							TmpMapAdditionalSTB.put("startTime", varWarrantyStartDate.get("value"));
							TmpMapAdditionalSTB.put("id",varProductDTHAdditionalSTB.get(l).get("serviceCatalog").get("ID"));
							TmpMapAdditionalSTB.put("subGroup1","0");
							TmpMapAdditionalSTB.put("subGroup2","0");
							TmpListDTH.add(TmpMapAdditionalSTB);							
log.info(LOG_HEADER + " procesaQueryCustomerFull \"DTH Additional STB\"  [" + TmpMapAdditionalSTB + "]");
						}
//Planes UTX ????




//Fin planes UTX
						nodoDTHList.put("productList",TmpListDTH);
						nodoDTHList.put("serviceId",accesId);
						if (listService.get(k).get("statusTitle") != "Activo" ) {
							nodoDTHList.put("status", "inactive" );
							result.put("accountStatus","Inactive");
							result.put("accountStatusUNIFICA","INACTIVO");
						} else {
							nodoDTHList.put("status", "Active" );
							result.put("accountStatus","Active");
							result.put("accountStatusUNIFICA","ACTIVO");
						}
						subscriberNotFound = false;
log.info(LOG_HEADER + " procesaQueryCustomerFull Producto IPTV 5");						
						dthList.add(nodoDTHList);						
						result.put("dthList",dthList);					
						k = listService.size();
						j = listProductBelieve.size();
						i =listCustomers.size();
					}
				}				
			}
		}
	}
	
		//Add extra information
		if( subscriberNotFound == false){

			try{
				//CR-1593
				listaPsFrontEnd= Unifica.listaPsFrontEnd(subscriberId,result.get("activationDate"),additionalInputParams);
			}catch(e){
				log.error(LOG_HEADER + "Failed to call ListaPSFrontEnd " );
			}			
			
			var productResponsMessage = "Success";	
			var productResponsCode = "0";	
			var productErrCode = "";

			resultKey = resultKey + ",consultaQueryProduct";
			try{
				//CR-1560
log.error(LOG_HEADER + "invocando QueryProduct ");				
log.error(LOG_HEADER + "invocando QueryProduct additionalInputParams[" + additionalInputParams + "]");		
				//productRespons = QueryProduct.consultaQueryProduct(subscriber.get("subscriberId"),"","",additionalInputParams);
				productRespons = QueryProduct.consultaQueryProduct(subscriberId,"","",additionalInputParams);
			}catch(e){
				log.error(LOG_HEADER + "Failed to call QueryProduct ");
			}
log.info(LOG_HEADER + " procesaQueryCustomerFull 14 productRespons [" + productRespons + "]");
log.info(LOG_HEADER + " procesaQueryCustomerFull 14.1 productResponsCode [" + productResponsCode + "]");
log.info(LOG_HEADER + " procesaQueryCustomerFull 14.1 resultCode [" + productRespons.get("resultCode") + "]");


			if (productRespons == null){
				productResponsCode = "-1";
				productResponsMessage = " Response from QueryProduct is empty";
			} else if ("0".equals(productRespons.get("resultCode"))){
log.info(LOG_HEADER + " procesaQueryCustomerFull 14.2 ");
				if (result.get("hsiList")!= null && result.get("hsiList").size() > 0){
					if (productRespons.get("hsiList")!=null && productRespons.get("hsiList").size()>0){
						result.get("hsiList").get(0).put("productList",productRespons.get("hsiList").get(0).get("productList"));
                        updateHSILidesForOperation(result);
						if(productRespons.get("hsiList").get(0).get("productList")!= null && !productRespons.get("hsiList").get(0).get("productList").isEmpty())
							hsiServiceSubscribed = "true";
					}
				}
				if (productRespons.get("ottList") != null){
					result.put("ottList",productRespons.get("ottList"));
				}
				if (productRespons.get("iptvList") != null){
					if (productRespons.get("iptvList").size() > 0){
						var serviceTmp=result.get("iptvList").get(0).get("serviceId");
						result.get("iptvList").get(0).put("serviceId",serviceTmp);
						var iptvProductList = productRespons.get("iptvList").get(0).get("productList");
						if(iptvProductList!= null && !iptvProductList.isEmpty()){
							iptvServiceSubscribed = "true";
						//result.put("iptvPkgList",createIpTvPackageList(productRespons, subscriberId, additionalInputParams));
							result.put("ottPkgList",result.get("iptvPkgList"));
						}
					}
				}
				if (productRespons.get("voiceList") != null){
					result.put("voiceList",productRespons.get("voiceList"));
					log.info(LOG_HEADER + " procesaQueryCustomerFull Telefonía por IP FIN result.get('voiceList' 3)" + result.get("voiceList"));
					result.put("voipListFrmCRM",productRespons.get("voipListFrmCRM"));
					if (productRespons.get("voiceList").size() > 0){
						if(productRespons.get("voiceList").get(0).get("productList")!= null && !productRespons.get("voiceList").get(0).get("productList").isEmpty())
						{
							voiceServiceSubscribed = "true";
						}
					}
				}
				if (listaPsFrontEnd.get("stbDeviceIdList") != null )		
					result.put("stbDeviceIdList",listaPsFrontEnd.get("stbDeviceIdList"));			
				if (listaPsFrontEnd.get("stbList") != null ){		
					result.put("stbList",listaPsFrontEnd.get("stbList"));						
					result.put("STBInWarranty",checkSTBInWarranty(listaPsFrontEnd.get("stbList")));
				}
				/*Added for Voice RTB Start*/
				if(productRespons.get("rtbList")!=null){
						result.put("rtbList",productRespons.get("rtbList"));
						log.info('RTB PSCode List From function::: productRespons.get("rtbList"):'+productRespons.get("rtbList"));
						log.info('RTB PSCode List From function::: productRespons.get("rtbList").isEmpty(): '+ productRespons.get("rtbList").isEmpty());
						log.info('RTB PSCode List From function::: !productRespons.get("rtbList").isEmpty():'+!productRespons.get("rtbList").isEmpty());
						if(!productRespons.get("rtbList").isEmpty() && productRespons.get("rtbList").get(0)!=null && !productRespons.get("rtbList").get(0).isEmpty() 
							&& productRespons.get("rtbList").get(0).get("productList")!= null && !productRespons.get("rtbList").get(0).get("productList").isEmpty()){
								rtbServiceSubscribed = "true";
								log.info('RTB PSCode List From function::: step2');
								var psCodeForService =RTB.getServicePsCode(productRespons.get("rtbList").get(0).get("productList"));
								log.info('RTB PS Code For service:::'+psCodeForService);
								productRespons.get("rtbList").get(0).put("psCodeForService",psCodeForService);
						}
					}
				/*Added for Voice RTB End*/
				if (productRespons.get("dthList") != null ) {
					result.put("dthList",productRespons.get("dthList"));
					if(productRespons.get("dthList").size()>0) {
						if(productRespons.get("dthList").get(0).get("productList")!= null && !productRespons.get("dthList").get(0).get("productList").isEmpty()){
							dthServiceSubscribed = true;
							var OResultMap = getDTHDecoderCountAndChannelPackages(productRespons.get("dthList"));
							log.info(LOG_HEADER+ " Unifica.getSubscriberDetails getCustomerDTHChannelPackages:: OResultMap 3 " + OResultMap);
							result.put("channelPackagesDTH",OResultMap.get("userDTHPSCodes"));
							result.put("channelIdPackagesDTH",OResultMap.get("userDTHPSIdCodes"));
							result.put("decodifierCountCRM",OResultMap.get("decodifierCountCRM"));
							result.put("decoderListCRM",OResultMap.get("decoderListCRM"));
							//result.put("ottPkgList",createDthPackageList(productRespons, OResultMap.get("userDTHPSIdCodes"), subscriberId, additionalInputParams));
							//CR-1412 Start
							result.put("decoStatusMap",OResultMap.get("decoStatusMap"));
							result.put("plansListOfMaps",OResultMap.get("plansListOfMaps"));
							log.info(LOG_HEADER + "|getSubscriberDetails|OResultMap|" + OResultMap);
							//CR-1412 End
							dthServiceSubscribed=true;
						}
					}
				}
				//add Movistar service status
				result.put("ottServiceStatus",productRespons.get("ottServiceStatus"));
				result.put("ottServiceSubscribed",productRespons.get("ottServiceSubscribed"));
				//CR-1939
				result.put("apSubscribed",productRespons.get("apSubscribed"));
				log.info("CR1939 producResponse: "+productRespons);
				result.put("ottServiceLightSubscribed",productRespons.get("ottServiceLightSubscribed"));
				result.put("ottServiceFullSubscribed",productRespons.get("ottServiceFullSubscribed"));
//				resultMessageKey = resultMessageKey + "," + "Success"; //added for common changes;
			} else {
log.info(LOG_HEADER + " procesaQueryCustomerFull DTH 23.5 resultCode [" + productRespons.get("resultCode") + "]");
				productResponsCode = productRespons.get("resultCode");
				productResponsMessage = productRespons.get("resultMessage");
				productErrCode = productRespons.get("codError");			
			}			
			result.put("rtbServiceSubscribed", rtbServiceSubscribed);//Added for Voice RTB
			log.debug(LOG_HEADER+" resultCode:"+resultCode+" productResponsCode:"+productResponsCode);
			if ( ("010".equals(productErrCode)
				|| ((result.get("voiceList")== null || result.get("voiceList").isEmpty()) && (result.get("iptvList")== null || result.get("iptvList").isEmpty()) && (result.get("hsiList").get(0).get("productList")== null || result.get("hsiList").get(0).get("productList").isEmpty())&& (result.get("rtbList")== null || result.get("rtbList").isEmpty()) && (result.get("dthList")== null || result.get("dthList").isEmpty())))
				&& (resultCode == null || resultCode.equals("") || resultCode.equals("0"))){
				try{
					//CR-1560 removing
					 if ("0".equals(listaPsFrontEnd.get("resultCode"))){
					 	log.info(LOG_HEADER + "Populating from ListaPSFrontEnd" + listaPsFrontEnd);
						result.get("hsiList").get(0).put("productList",listaPsFrontEnd.get("hsiList"));
						result.put("voiceList", listaPsFrontEnd.get("voipList"));
						log.info(LOG_HEADER + " procesaQueryCustomerFull Telefonía por IP FIN result.get('voiceList' 4)" + result.get("voiceList"));
						result.put("iptvList", listaPsFrontEnd.get("iptvList"));
						result.put("ottList", listaPsFrontEnd.get("ottList"));
						result.put("rtbList", listaPsFrontEnd.get("voiceList"));
						result.put("dthList",listaPsFrontEnd.get("dthList"));
						result.put("ottServiceSubscribed",listaPsFrontEnd.get("ottServiceSubscribed"));
						//CR-1939
						result.put("apSubscribed",listaPsFrontEnd.get("apSubscribed"));
						log.info("CR1939 listaPsFrontEnd: "+listaPsFrontEnd);
						result.put("ottServiceLightSubscribed",listaPsFrontEnd.get("ottServiceLightSubscribed"));
						result.put("ottServiceFullSubscribed",listaPsFrontEnd.get("ottServiceFullSubscribed"));
						result.put("ottServiceStatus",listaPsFrontEnd.get("ottServiceStatus"));
						result.put("additionalInformationList",listaPsFrontEnd.get("additionalInformationList"));
					if(result.get("hsiList")!= null && !result.get("hsiList").isEmpty())
						if(!result.get("hsiList").get(0).get("productList").isEmpty())
							hsiServiceSubscribed=true;
					if(result.get("iptvList")!= null && !result.get("iptvList").isEmpty())
						if(!result.get("iptvList").get(0).get("productList").isEmpty()){
							iptvServiceSubscribed=true;
							result.put("stbList", listaPsFrontEnd.get("stbList"));
							result.put("stbDeviceIdList", listaPsFrontEnd.get("stbDeviceIdList"));
							//result.put("iptvPkgList",createIpTvPackageList(result, subscriberId, additionalInputParams));
							result.put("ottPkgList",result.get("iptvPkgList"));
							//add check to see if any STB is in warranty
							result.put("STBInWarranty",checkSTBInWarranty(listaPsFrontEnd.get("stbList")));
						}
					if(result.get("voiceList")!= null && !result.get("voiceList").isEmpty())
						if(!result.get("voiceList").get(0).get("productList").isEmpty())
							voiceServiceSubscribed=true;
					if(result.get("rtbList")!= null && !result.get("rtbList").isEmpty())
						if(!result.get("rtbList").get(0).get("productList").isEmpty())
							rtbServiceSubscribed=true;
					if(result.get("dthList")!= null && !result.get("dthList").isEmpty())
						if(!result.get("dthList").get(0).get("productList").isEmpty()){
							dthServiceSubscribed=true;
							log.info(LOG_HEADER + "Unifica.getSubscriberDetails Before calling DTH method");
							var OResultMap = getDTHDecoderCountAndChannelPackages(listaPsFrontEnd.get("dthList"));
							log.info(LOG_HEADER+ " Unifica.getSubscriberDetails getCustomerDTHChannelPackages:: OResultMap 1" + OResultMap);
							result.put("channelPackagesDTH",OResultMap.get("userDTHPSCodes"));
							result.put("channelIdPackagesDTH",OResultMap.get("userDTHPSIdCodes"));
							//result.put("ottPkgList",createDthPackageList(result, OResultMap.get("userDTHPSIdCodes"), subscriberId, additionalInputParams));
							result.put("decodifierCountCRM",OResultMap.get("decodifierCountCRM"));
							result.put("decoderListCRM",OResultMap.get("decoderListCRM"));
							//CR-1412 Start
							result.put("decoStatusMap",OResultMap.get("decoStatusMap"));
							result.put("plansListOfMaps",OResultMap.get("plansListOfMaps"));
							log.info(LOG_HEADER + "|getSubscriberDetails|OResultMap|" + OResultMap);
							//CR-1412 End							
						}
					}
				}catch(e){
				}
			}

			if(resultCode == null || resultCode.equals("")){
				resultCode="0";
				resultMessage="Success";
			}
		}
		//FIN Add extra information

			var lineMap= new java.util.LinkedHashMap();

				    if (isFiber) {
					try {//CR-1560
					//538 call Sigres SDFO
					log.info(LOG_HEADER + "Invoking SigresSDFO.retrieveDataFO");
					//var uniqueId = Utility.generateUniqueId(varsubscriberId);
					var sdfoDetails =Utility.callBlockingCache("SIGRES-SDFO", cacheKey,
								function(){return SigresSDFO.retrieveDataFO(subscriberId,additionalInputParams, "SubscriberInitialization", additionalInputParams.get("uniqueId"))},
								cacheTimeout);	      										
					log.info(LOG_HEADER + "sdfoDetails response: " + sdfoDetails);
					if(sdfoDetails.get("resultCode")!=null && sdfoDetails.get("resultCode").equals("0")){
						sdfoDetails.remove("resultCode");
						sdfoDetails.remove("resultMessage");
						sdfoDetails.put("portType", "LT")
						function replace( oldName, newName, map){
							map.put(newName, map.get(oldName));
							map.remove(oldName);
						}
						var services = sdfoDetails.get("Services");
						var size = services.size();
						var packageName = "";
						if(size >= 1){
							var service = null;
							for(var i = 0; i < services.size(); i++){
								if( services.get(i).get("ServiceFamily").equals("SPEEDY") ){
									service = services.get(i);
								}
								if( packageName == ""){
									packageName  = packageName + services.get(i).get("ServiceFamily");
								}else{
									packageName  = packageName + "+" + services.get(i).get("ServiceFamily");
								}
							}
							if( service != null ){
								sdfoDetails.putAll(service);
								sdfoDetails.put("UpSpeed",service.get("upSpeed"));
								sdfoDetails.remove("upSpeed");
							}
						}

						sdfoDetails.put("telefono", subscriberId);
						replace("ServiceFamily","familyService", sdfoDetails);
						replace("NasIP","nasIp", sdfoDetails);
						replace("NasPort","nasPort", sdfoDetails);
						replace("GeneralStatus","generalState", sdfoDetails);
						replace("DownSpeed","downstream", sdfoDetails);
						replace("UpSpeed","upstream", sdfoDetails);
						replace("SVlanId","vpiNetwork", sdfoDetails);
						sdfoDetails.put("ratePlan","3630919");
						sdfoDetails.put("vpiSvlan","");
						sdfoDetails.put("vciSvlan","2");
						sdfoDetails.put("vciNetwork","421");
						replace("ServiceType","serviceType", sdfoDetails);
						sdfoDetails.put("modelo", sdfoDetails.get("Equipment").get(0).get("Model"));
						sdfoDetails.put("fabricante", sdfoDetails.get("Equipment").get(0).get("Vendor"));
						sdfoDetails.put("hostname", sdfoDetails.get("Equipment").get(0).get("NetworkName"));
						sdfoDetails.put("ipAddress", sdfoDetails.get("Equipment").get(0).get("IpAddress"));
						sdfoDetails.put("rack", sdfoDetails.get("Equipment").get(0).get("Rack"));
						sdfoDetails.put("subRack", sdfoDetails.get("Equipment").get(0).get("SubRack"));
						sdfoDetails.put("slot", sdfoDetails.get("Equipment").get(0).get("Slot"));
						sdfoDetails.put("subSlot", sdfoDetails.get("Equipment").get(0).get("SubSlot"));
						sdfoDetails.put("portPon", sdfoDetails.get("Equipment").get(0).get("PortPON"));
						sdfoDetails.put("ontId", sdfoDetails.get("Equipment").get(0).get("ONTID"));
						sdfoDetails.put("slid", sdfoDetails.get("Equipment").get(0).get("SLID"));
						sdfoDetails.put("oltCT", sdfoDetails.get("Equipment").get(0).get("OLTCardType"));
						sdfoDetails.put("emplazamiento",sdfoDetails.get("CentralOfficeCode"));
						sdfoDetails.put("zone",sdfoDetails.get("CentralOfficeCode"));
						sdfoDetails.put("packageName",packageName);
						if( sdfoDetails.get("downstream").contains("M") ){
							var ds = sdfoDetails.get("downstream").replace("M","") +"000";
							sdfoDetails.put("downstream", ds);	
						}else if(sdfoDetails.get("downstream").contains("K") ){
							var ds = sdfoDetails.get("downstream").replace("K","") + "00";
							sdfoDetails.put("downstream", ds);
						}
						if( sdfoDetails.get("upstream") != null && sdfoDetails.get("upstream").contains("M") ){
							var ds = sdfoDetails.get("upstream").replace("M","")+"000";
							sdfoDetails.put("upstream", ds);	
						}else if(sdfoDetails.get("upstream") != null && sdfoDetails.get("upstream").contains("K") ){
							var ds = sdfoDetails.get("upstream").replace("K","")+"00";
							sdfoDetails.put("upstream", ds);
						}
						sdfoDetails.put("status","Active");
						lineMap.putAll(sdfoDetails);
						result.put("nasPort", lineMap.get("nasPort"));
						result.put("nasIp", lineMap.get("nasIp"));
						result.put("subscribedServices",	sdfoDetails.get("ServiceFamily"));
					}
					result.put("networkType", "LT");
				}
				catch (e){
					log.debug(LOG_HEADER + " invocando a SigresSDFO.retrieveDataFO " + e );
				}
				
				// INI 1er bloque
				
								try{
								var x  = new java.lang.Integer(lineMap.get("upstream"));
								}catch(e){
									lineMap.put("upstream","0")
								}
								try{
									var x  = new java.lang.Integer(lineMap.get("downstream"));
								}catch(e){
									lineMap.put("downstream","0")
								}
								
								/*if( (serviceDetails != null && serviceDetails.get("resultCode")!=null && serviceDetails.get("resultCode").equals("0")) 
									||  (sdfoDetails != null && sdfoDetails.get("resultCode")!=null && sdfoDetails.get("resultCode").equals("0")) ) {
									lineMap.put("status","Inactive");
									resultCode = "0";
									if( sdfoDetails != null ){
										resultMessage= sdfoDetails.get("resultMessage");
									}else{
										resultMessage= serviceDetails.get("resultMessage");
									}
									
								}
								if ( serviceDetails != null  && serviceDetails.get("migrationFO") == true){
									lineMap.put("status","Active");
									resultCode = "0";
								}*/
				
				// EBD 1er Bloquer
				try{
					var res = result.get("hsiList").get(0);
					res.putAll(lineMap);
					result.remove("hsiList");
					
					var hsiListTemp = new java.util.ArrayList();
					hsiListTemp.add(res)
				
				}catch(e){
					log.error(LOG_HEADER + "Error received: " + e);
				}
				
				result.put("hsiList",hsiListTemp);
				
				} //en if fiber

		result.put("dthServiceSubscribed", dthServiceSubscribed);
		result.put("hsiServiceSubscribed", hsiServiceSubscribed);
		result.put("iptvServiceSubscribed", iptvServiceSubscribed);
		result.put("voiceServiceSubscribed", voiceServiceSubscribed);
		result.put("rtbServiceSubscribed", rtbServiceSubscribed)
		
	log.info(LOG_HEADER + " procesaQueryCustomerFull DTH 27 ");

	
	log.info(LOG_HEADER + " procesaQueryCustomerFull Fin result[" +  result +  "]");
}

try {
	log.info(LOG_HEADER + " 20220121  1326 ")
	//return Believe.getSubscriberDetails(subscriberId,additionalInputParams);

	//var accessID=subscriberId.substring(3);
	tokenAxway = Security.getToken();    //Security Token
	log.info(LOG_HEADER + " tokenAxway[" + tokenAxway + "]");
	var resultMapTokenAMDOCS = Security.tokenAmdocs(rutAmdocs, tokenAxway);
	additionalInputParams.put("rutBelieve",rutAmdocs);
	tokenAmdocs=resultMapTokenAMDOCS.get("tokenAMDOCS");
	log.info(LOG_HEADER + " resultMapTokenAMDOCS: tokenAmdocs["+ resultMapTokenAMDOCS + "]");
	
	var largoNumeroRut= new java.lang.Integer(rutAmdocs.length()-2);
	mapRequestQueryCustomerFull = Believe.executeRequestQueryCustomerFull(rutAmdocs,tokenAxway);
	var mapcustomerID= Believe.searchCustomerQueryCustomerFull(mapRequestQueryCustomerFull,accesId);
	log.info(LOG_HEADER + " accesId->["+accesId+"]mapcustomerID["+mapcustomerID+"]");

	log.info(LOG_HEADER + "rutAmdocs (line 1553): "+rutAmdocs);


	//! START CODE BRAULIO PIZARRO.
	if(rutAmdocs == '12490452-8'){ //* CODE TEST

		var mapaCustomerIdPSSBA = AAA.getCustomerIdPSSBA(subscriberId, rutAmdocs);
		log.info(LOG_HEADER + "mapaCustomerIdPSSBA: "+mapaCustomerIdPSSBA);
		log.info(LOG_HEADER + "Cantidad de elementos mapaCustomerIdPSSBA: "+mapaCustomerIdPSSBA.size());

		if(mapaCustomerIdPSSBA.size() != 0){

			var customerId = mapaCustomerIdPSSBA.get('customerId');

			//* Ejecuta servicio N°3 contextualizarBillingCustomer
			//* Sin este servicio no se puede acceder a las APIs de las ordenes
			var dataBillingCustomer = Believe.executeRequestUserInformation(customerId, subscriberId, tokenAxway, tokenAmdocs);
        	log.info(LOG_HEADER + " dataBillingCustomer: "+dataBillingCustomer);

			var resultMapOrdersList = Believe.getOrdersList(customerId,tokenAxway,tokenAmdocs);	
			log.info(LOG_HEADER + "resultMapOrdersList: "+resultMapOrdersList);

			var referenceNumber = resultMapOrdersList.get('listOfPetitions').get('peticionId');
			log.info(LOG_HEADER + "get referenceNumber: "+referenceNumber);
			var time = resultMapOrdersList.get('listOfPetitions').get('time');
			log.info(LOG_HEADER + "get time: "+time);

			var resultMapOrdersDetail = Believe.getOrdersDetail(referenceNumber,customerId,time,tokenAmdocs,tokenAxway);	
			log.info(LOG_HEADER + "resultMapOrdersDetail: "+resultMapOrdersDetail);
		}
	}
	//! END CODE BRAULIO PIZARRO.


	if 	(mapcustomerID == null) {
//		var varCustomerID=accesId;
//		log.info(LOG_HEADER + " BRAULIO BUSCA LISTADO DE ORDEN");
//		var resultMapOrders = new java.util.HashMap();
//		resultMapOrders = Believe.getOrdersList(varCustomerID,tokenAxway,tokenAmdocs);
//		log.info(LOG_HEADER + " BRAULIO resultMapOrders [" + resultMapOrders + "]");	
		//Believe.getOrdersDetail();
//		log.info(LOG_HEADER + " BRAULIO BUSCA DETALLE DE ORDEN");
//		var resultMapOrdersDetails = new java.util.HashMap();
//		resultMapOrdersDetails = Believe.getOrdersDetail();
//		log.info(LOG_HEADER + " BRAULIO resultMapOrdersDetail " + resultMapOrdersDetails);
		log.info(LOG_HEADER + " DEBE IR CODIGO SIMILAR A VPI");
	}
	else 
	{	
		var customerID= mapcustomerID.get("customerID");
		log.info(LOG_HEADER + " ANTES DE Believe.executeRequestUserInformation customerID["+ customerID + "]tokenAxway["+ tokenAxway + "]tokenAmdocs["+ tokenAmdocs + "]");
		mapRequestUserInformation = Believe.executeRequestUserInformation(customerID,accesId,tokenAxway,tokenAmdocs);
						
		procesaQueryCustomerFull(accesId,mapRequestQueryCustomerFull);
		
		//DATA DE RELLENO PARA VALIDAR
		log.info(LOG_HEADER + " Antes de procesar data de relleno");
		result.put("ottList",new java.util.ArrayList());
		//result.put("voiceList",new java.util.ArrayList());
		//result.put("rtbList",new java.util.ArrayList());
		//result.put("stbList",new java.util.ArrayList());
		result.put("isFiber",isFiber);
		result.put("customerID",customerID);
		
		//--Duda numero fijo 
		//Numero de contacto
		var varPhoneContact = mapRequestQueryCustomerFull.get("datos").get("customer").get(0).get("telephoneNumber");
		result.put("area",varPhoneContact.substring(0,3));
		result.put("phoneNumber",varPhoneContact.substring(3));
		//result.put("area",subscriberId.substring(0,3));
		//result.put("phoneNumber",subscriberId.substring(3));
		
		//mapRequestQueryCustomerFull.get("datos").get("customer").get(0).get("telephoneNumber");
		result.put("preferredContactNumber","55851549");
		result.put("preferredContactNumberArea","9");
		result.put("lineId",subscriberId); //solo TOIP serviceID, para el resto 000accesID
		//--Estado
		//Segmento-subsegmento
		
		log.info(LOG_HEADER + " procesaQueryCustomerFull Producto   20211123 1130");
		var varStartDateTime = mapRequestQueryCustomerFull.get("datos").get("customer").get(0).get("startDateTime");
		log.info(LOG_HEADER + " procesaQueryCustomerFull Producto   001.1 [" + varStartDateTime + "]");
		result.put("accountType",mapRequestQueryCustomerFull.get("datos").get("customer").get(0).get("customerTypeTitle")); //Segmento
		log.info(LOG_HEADER + " procesaQueryCustomerFull Producto   002");
		log.info(LOG_HEADER + " procesaQueryCustomerFull Producto   003[" + varStartDateTime.substring(0,10) + "]");
		result.put("activationDate", varStartDateTime.substring(0,10)); //Alta cliente en unifica startdate (ex fecha naciemiento)
		//result.put("activationDate", "");
		//result.put("clientRegistryDate", varStartDateTime.substring(0,10)); //Alta cliente en unifica startdate (ex fecha naciemiento)
		result.put("clientRegistryDate", "");
		result.put("segment",mapRequestQueryCustomerFull.get("datos").get("customer").get(0).get("customerTypeCode"));   //Codigo de Segmento
		result.put("subSegment",mapRequestQueryCustomerFull.get("datos").get("customer").get(0).get("customerTypeTitle")); //Segmento
		result.put("subSegmentCode",mapRequestQueryCustomerFull.get("datos").get("customer").get(0).get("customerTypeCode")); //Codigo de Segmento
		result.put("apSubscribed","No");
		result.put("clientSeq","0"); //Colocar 0 --> 000+AccesID(subscriberID) por Unifica.queryPreferredContact
		log.info(LOG_HEADER + " procesaQueryCustomerFull Producto   008");
		result.put("isCeased","false");  //false pormomento David Validara?????
		//result.put("mpc","M"); //no se ocupa
		result.put("ottServiceFullSubscribed","No");
		result.put("ottServiceLightSubscribed","No");
		result.put("ottServiceStatus","inactive");
		
		log.info(LOG_HEADER + " procesaQueryCustomerFull Producto   009");
		result.put("resultKey",resultKey);
		result.put("resultMessage","Success,Success,Success");
		result.put("resultMessageDisplay","Success");
		result.put("subscribedServices","null");
		result.put("userId","null");
		result.put("voipListFrmCRM","null");
		log.info(LOG_HEADER + " rutAmdocs [" +rutAmdocs +"]");
		result.put("ottServiceSubscribed","No");
		result.put("rtbServiceSubscribed","false");
		result.put("resultCode","0");
		log.info(LOG_HEADER + " procesaQueryCustomerFull Producto   010");
		//--- OK  rutAmdocs
		//result.put("fullRut",computeFullRut(rutTmp.substring(0,largoNumeroRut.intValue()), rutTmp.substring(largoNumeroRut.intValue() + 1 ) ) );
		//result.put("rut",rutTmp.substring(0,largoNumeroRut.intValue()));
		//result.put("rutDV", rutTmp.substring(largoNumeroRut.intValue() + 1 ));
		
		result.put("fullRut",computeFullRut(rutAmdocs.substring(0,largoNumeroRut.intValue()), rutAmdocs.substring(largoNumeroRut.intValue() + 1 ) ) );
		result.put("rut",rutAmdocs.substring(0,largoNumeroRut.intValue()));
		result.put("rutDV", rutAmdocs.substring(largoNumeroRut.intValue() + 1 ));
		
		//---
		
		log.info(LOG_HEADER + " Fin procesar data de relleno");
		
		
			
		///dvrServiceActive
		var serviceSubscribed = "false";
		var iptvList = result.get('iptvList');
		var hsiList = result.get('hsiList');
		var voiceList = result.get('voiceList');
		
		if (inputTechnology != null && "FTC_IPTV".equalsIgnoreCase(inputTechnology))
		{
			if (iptvList != null && iptvList != "" && !iptvList.isEmpty()) {
				var psId = Utility.getApplicationProperty("IPTV.PS.DVR");
				log.info("Verifying if the customer has subscribed psId " + psId);
				var productList = iptvList.get(0).get("productList");
				var i = 0;
				while (i < productList.size() && "false".equalsIgnoreCase(serviceSubscribed)) { 
					var id = productList.get(i).get("id");
					//Comparing numeric values
					if (id == psId) {
						log.info("Ps Found, Service is subscribed");
						serviceSubscribed = "true";
					}
					i++;
				}	
			}
		}
		result.put("dvrServiceActive",serviceSubscribed);
		
		if (inputTechnology != null && "FTC_HSI".equalsIgnoreCase(inputTechnology))
		{
			if (hsiList != null && hsiList != "" && !hsiList.isEmpty()) {
				serviceSubscribed = "true";
			}
		}
		
		if (inputTechnology != null && "FTC_VOICE".equalsIgnoreCase(inputTechnology))
		{
			if (voiceList != null && voiceList != "" && !voiceList.isEmpty()) {
				serviceSubscribed = "true";
			}
		}
	}

}catch (e){
	log.error(LOG_HEADER + "Error received: " + e)
	result.put("resultCode","-1");
	result.put("resultMessage",backend+"."+operationName+doubleColon+ e);
	
}

function fnIsFiber(serviceId){

	log.info(LOG_HEADER + " Inicio fnIsFiber [" + serviceId +  "]")
	//$.datos.equipmentList[?(@.serviceCatalog.name=='Access')].attributesList[?(@.code=='Network_technology')].value
	var mapRequestqueryProductFixed = Believe.executeRequestqueryProductFixed(serviceId, tokenAxway);
	log.info(LOG_HEADER + " mapRequestqueryProductFixed fnIsFiber [" + mapRequestqueryProductFixed +  "]")
	var fiber = Believe.searchEquipmentQueryProductFixed(mapRequestqueryProductFixed, "Access");
	log.info(LOG_HEADER + " fiber fnIsFiber [" + fiber +  "]")
	var isFiber = Believe.searchAttributeQueryProductFixed(fiber.get(0), "Network_technology");
	log.info(LOG_HEADER + " fiber isFiber [" + isFiber +  "]")
	var validadorFiber = new java.lang.String(isFiber.get("value"));
	log.info(LOG_HEADER + " validadorFiber [" + validadorFiber +  "]")
	if(validadorFiber == "FTTH"){
		return true;
	}else{
		return false;
	}

}
						
log.info(LOG_HEADER + "Response: " + result)
return result;