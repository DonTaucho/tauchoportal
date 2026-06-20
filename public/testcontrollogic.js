const extractionoperators = ["PARAM"];
const booleanoperators = ["AND", "OR", "NOT"];
const compoperators = ["EQUIVALENT", "GREATER_THAN", "LESS_THAN"];
const textoperators = ["EQUALS", "INCLUDES", "REGEX_MATCH"];
const groupoperators = ["COUNT", "SUM"];
const calcoperators = ["ADD", "SUBTRACT", "MULTIPLY", "DIVIDE", "MODULO"];
const convoperators = ["PARSEINT", "EXCHANGE"];
const namingmap = {"AND":"and", "OR":"or", "NOT":"not", "EQUALS":"equals", "GREATER_THAN":"geater_than", "LESS_THAN":"less_than", "INCLUDES":"includes", "EQUIVALENT":"equivalent", "REGEX_MATCH":"regex_match", "COUNT":"count", "SUM":"sum", "ADD":"add", "SUBTRACT":"subtract", "MULTIPLY":"multiply", "DIVIDE":"divide", "MODULO":"modulo", "PARSEINT":"parseint", "EXCHANGE":"exchange", "PARAM":"param"};
const reverselookuptype = {"AND":"boolean", "OR":"boolean", "NOT":"boolean", "EQUIVALENT":"text", "GREATER_THAN":"comp", "LESS_THAN":"comp", "EQUALS":"comp", "INCLUDES":"text", "REGEX_MATCH":"text", "COUNT":"group", "SUM":"group", "ADD":"calc","SUBTRACT":"calc","MULTIPLY":"calc","DIVIDE":"calc","MODULO":"calc", "PARSEINT":"conv","EXCHANGE":"conv", "PARAM":"extract"};

function jsonLoader(jsonnode, area, path){
    path = path??"0";
    var operator = jsonnode.Operator;
    area.replaceChildren();
    var legendtag = document.createElement("legend");
	legendtag.innerText = translations[jsonnode.Operator];
	area.appendChild(legendtag);
	var editarea = document.createElement("div");
	editarea.classList.add("icons");
    var edittag = document.createElement("a");
	edittag.classList.add("edit");
	edittag.innerText = "✏️";
	edittag.setAttribute("path", path);
	edittag.setAttribute("operator", jsonnode.Operator);
	edittag.onclick=editItem;
	editarea.appendChild(edittag);
    var removetag = document.createElement("a");
	removetag.classList.add("remove");
	removetag.innerText = "🗑️";
	removetag.setAttribute("path", path);
	removetag.setAttribute("operator", jsonnode.Operator);
	removetag.onclick=deleteItem;
	editarea.appendChild(removetag);
	area.appendChild(editarea);
    if (jsonnode.SubConditions || jsonnode.Variables) {
        area.classList.add(namingmap[jsonnode.Operator]);

        // Only for the top level (has only one "/"), show summary
        if (path.split("/").length == 2) {
            var summarized = document.createElement("div");
            summarized.classList.add("summary");
            if (jsonnode.SubConditions) {
                summarized.innerHTML = summarize(jsonnode);
            }
            area.appendChild(summarized);
        }
		var detailarea = document.createElement("div");
		detailarea.classList.add("detailarea");
        if (jsonnode.SubConditions && jsonnode.SubConditions.length) {
            var subconarea = document.createElement("div");
            subconarea.classList.add("subcondition");
            for (var is in jsonnode.SubConditions) {
                var childarea = document.createElement("fieldset");
                childarea.classList.add("item");
                jsonLoader(jsonnode.SubConditions[is], childarea, path+"/"+is);
                subconarea.append(childarea);
            }
            detailarea.appendChild(subconarea);
        }
        for (var iv in jsonnode.Variables) {
            var variableitem = document.createElement("div");
            variableitem.classList.add("variable");
            variableitem.innerText = jsonnode.Variables[iv];
			if (jsonnode.Operator!="PARAM") {
				variableitem.setAttribute("operator", "_variable");
				variableitem.setAttribute("path", path);
				variableitem.setAttribute("index", iv);
				variableitem.onclick=editItem;
			}
            detailarea.appendChild(variableitem);
        }
		area.appendChild(detailarea);

        if (booleanoperators.includes(operator)) {
            // NOT only allows 1 child. Even if systematically handles multiple (will be not-or), limits 1 for suppress complication
            if (operator != "NOT" || jsonnode.SubConditions.length < 1) {
                var addbutton = document.createElement("div");
                addbutton.classList.add("addbutton");
                addbutton.innerText = "+";
                addbutton.setAttribute("path", path);
                addbutton.setAttribute("operator", operator);
                addbutton.onclick = openBoolDialog;
                area.append(addbutton);
            }
        } else if (compoperators.includes(operator) && (
            (!jsonnode.Variables || jsonnode.Variables.length < 1)||
            (!jsonnode.SubConditions || jsonnode.SubConditions.length < 1)
        )) {
            var addcompbutton = document.createElement("div");
            addcompbutton.classList.add("addcompbutton");
            addcompbutton.innerText = "+";
            addcompbutton.setAttribute("path", path);
            addcompbutton.setAttribute("operator", operator);
            addcompbutton.onclick = askTextCompare;
            area.append(addcompbutton);
        } else if (textoperators.includes(operator)) {
			if (!jsonnode.SubConditions || jsonnode.SubConditions.length < 1) {
				var askenvbutton = document.createElement("div");
				askenvbutton.classList.add("askenvbutton");
				askenvbutton.innerText = "+";
				askenvbutton.setAttribute("path", path);
				askenvbutton.setAttribute("operator", operator);
				askenvbutton.onclick = function(){askText(null, null, true, false, function(disp, type){
					var parentjson = JSON.parse(document.getElementById("conditionLogicInput").value);
					var currentnode = getSubCondition(parentjson, path);
					currentnode.SubConditions = [];
					currentnode.SubConditions.push({"Operator": "PARAM", "Variables": [type],"SubConditions": null});
					document.getElementById("conditionLogicInput").value = JSON.stringify(parentjson, null, 2);
					refreshSummary();
				})};
				area.append(askenvbutton);
			}
			if (!jsonnode.Variables || !jsonnode.Variables.length) {
				var asktextbutton = document.createElement("div");
				asktextbutton.classList.add("asktextbutton");
				asktextbutton.innerText = "+";
				asktextbutton.setAttribute("path", path);
				asktextbutton.setAttribute("operator", operator);
				asktextbutton.onclick = function(){askText(null, null, true, function(){
					
				})};
				area.append(asktextbutton);
			}
        } else if (calcoperators.includes(operator)) {
            var asknumbutton = document.createElement("div");
            asknumbutton.classList.add("asknumbutton");
            asknumbutton.innerText = "+";
            asknumbutton.setAttribute("path", path);
            asknumbutton.setAttribute("operator", operator);
            asknumbutton.onclick = askNumber;
            area.append(asknumbutton);
        } else if ((extractionoperators.includes(operator) ||
            textoperators.includes(operator) ||
            convoperators.includes(operator))
            &&!jsonnode.Variables
        ) {
            var asktextbutton = document.createElement("div");
            asktextbutton.classList.add("asktextbutton");
            asktextbutton.innerText = "?";
            asktextbutton.setAttribute("path", path);
            asktextbutton.setAttribute("operator", operator);
            asktextbutton.onclick = function(){askText(null, null, true, true)};
            area.append(asktextbutton);
        }
    } else if (jsonnode[0]) {
        for (var i in jsonnode){
            jsonLoader(jsonnode[i], area, i)
        }
    }
}
function summarize(node){
    if (node) {
		switch (node.Operator) {
		case "AND":
            var items = [];
            for (i in node.SubConditions) {
                items.push("<span class='or'>" + summarize(node.SubConditions[i]) + "</span>");
            }
			if (items.length) {
				return items.join(translations["and-joint"]);
			}else {
				return translations["and-notset"];
			}
			break;
		case "OR":
            var items = [];
            for (i in node.SubConditions) {
                items.push("<span class='or'>" + summarize(node.SubConditions[i]) + "</span>");
            }
			if (items.length) {
				return items.join(translations["or-joint"]);
			}else {
				return translations["or-notset"];
			}
			break;
		case "NOT":
            var items = [];
            for (i in node.SubConditions) {
                items.push("<span class='or'>" + summarize(node.SubConditions[i]) + "</span>");
            }
			if (items.length) {
				return translations["not-sentense"].replace("{0}", items.join(translations["or-joint"]));
			}else {
				return translations["not-notset"];
			}
			break;
		case "EQUIVALENT":
            var items = [];
            for (i in node.SubConditions) {
                items.push(summarize(node.SubConditions[i]));
            }
            for (i in node.Variables) {
                items.push("<span class='static'>" + translations["staticvalue"].replace("{0}", node.Variables[i]) + "</span>");
            }
			if (!items.length) {
				return "<span class='novalue'>" + translations["equivalent-novalue"] + "</span>";
			} else if (items.length == 1) {
				items.push("<span class='missingvalue'>" + translations["equivalent-missingvalue"] + "</span>");
				return translations["equivalent-sentense"].replace("{0}", items.join(translations["equivalent-joint"]));
			} else {
				return translations["equivalent-sentense"].replace("{0}", items.join(translations["equivalent-joint"]));
			}
			break;
		case "GREATER_THAN":
		case "GREATER_OR_EQUAL":
		case "LESS_THAN":
		case "LESS_OR_EQUAL":
			var target;
            var items = [];
			var sentense = 
			    node.Operator=="GREATER_THAN"?"greaterthan-sentense":
				node.Operator=="GREATER_OR_EQUAL"?"greaterorequal-sentense":
				node.Operator=="LESS_THAN"?"lessthan-sentense":
				node.Operator=="LESS_OR_EQUAL"?"lessorequal-sentense":"";
			if (node.SubConditions.length>0) {
			    target = summarize(node.SubConditions[0]);
			    for (i in node.SubConditions.slice(1)) {
			        items.push(summarize(node.SubConditions[i]));
			    }
			} else {
			    target = "<span class='novalue'>" + translations["compare-missingvalue"] + "</span>";
			}
            for (i in node.Variables) {
                items.push("<span class='static'>" + translations["staticvalue"].replace("{0}", node.Variables[i]) + "</span>");
            }
			if (!items.length) {
				items.push("<span class='novalue'>" + translations["compare-novalue"] + "</span>");
			}
			return translations[sentense].replace("{0}", target).replace("{0}", items.join(translations["equals-joint"]));
			break;
		case "EQUALS":
            var items = [];
            for (i in node.SubConditions) {
                items.push(summarize(node.SubConditions[i]));
            }
            for (i in node.Variables) {
                items.push("<span class='static'>" + translations["staticvalue"].replace("{0}", node.Variables[i]) + "</span>");
            }
			if (!items.length) {
				return "<span class='novalue'>" + translations["equals-novalue"] + "</span>";
			} else if (items.length == 1) {
				items.push("<span class='missingvalue'>" + translations["equals-missingvalue"] + "</span>");
				return translations["equals-sentense"].replace("{0}", items.join(translations["equals-joint"]));
			} else {
				return translations["equals-sentense"].replace("{0}", items.join(translations["equals-joint"]));
			}
			break;
		case "INCLUDES":
			var target;
            var rangefrom = "";
            var rangeto = "";
			if (node.SubConditions.length>0) {
			    target = summarize(node.SubConditions[0]);
			    for (i in node.SubConditions.slice(1)) {
			        items.push(summarize(node.SubConditions[i]));
			    }
			} else {
			    target = "<span class='novalue'>" + translations["includes-novalue"] + "</span>";
			}
			if (node.Variables.length > 0 && parseInt(node.Variables[0])) {
				rangefrom = parseInt(node.Variables[0]);
			}
			if (node.Variables.length > 1 && parseInt(node.Variables[1])) {
				rangeto = parseInt(node.Variables[1]);
			}
			var comparar;
			if (items.lange) {
				comparar = items.join(translations["valueof-joint"]);
			} else {
				comparar = "<span class='novalue'>" + translations["includes-missingvalue"] + "</span>";
			}
			if (!rangefrom&&!rangeto || rangefrom==1&&!rangeto) {
			    return translations["includes-sentense_one"].replace("{0}", target).replace("{1}", comparar);
			} else if (rangefrom&&!rangeto) {
			    return translations["includes-sentense_rangefrom"].replace("{0}", target).replace("{1}", comparar).replace("{2}", rangefrom);
			} else if (!rangefrom&&rangeto) {
			    return translations["includes-sentense_rangeto"].replace("{0}", target).replace("{1}", comparar).replace("{2}", rangeto);
			} else if (rangefrom&&rangeto) {
			    return translations["includes-sentense_rangefromto"].replace("{0}", target).replace("{1}", comparar).replace("{2}", rangefrom).replace("{3}", rangeto);
			}
			break;
		case "REGEX_MATCH":
			var items = [];
            var regexs = [];
			for (i in node.SubConditions) {
				items.push(summarize(node.SubConditions[i]));
			}
            for (i in node.Variables) {
                regexs.push("<span class='regexparam'>" + translations["regexparam"].replace("{0}", node.Variables[i]) + "</span>");
            }
			var target;
			if (items.lange) {
				target = items.join(translations["valueof-joint"]);
			} else {
				target = "<span class='novalue'>" + translations["regex-missingvalue"] + "</span>";
			}
			var regex;
			if (items.lange) {
				regex = items.join(translations["valueof-joint"]);
			} else {
				regex = "<span class='novalue'>" + translations["regex-missingvalue"] + "</span>";
			}
			
			return translations["regex-sentense"].replace("{0}", target).replace("{1}", regex);
			break;
		case "ADD":
		    var items = [];
			for (i in node.SubConditions) {
				items.push(summarize(node.SubConditions[i]));
			}
            for (i in node.Variables) {
                items.push(node.Variables[i]);
            }
			if (items.length) {
				return items.join(translations["add-joint"]);
			} else {
				return translations["calc-missingvalue"];
			}
			break;
		case "SUBTRACT":
		    var orig;
		    var items = [];
			if (node.SubConditions.length>0) {
				orig = summarize(node.SubConditions[i]);
				for (i in node.SubConditions.slice(1)) {
					items.push(summarize(node.SubConditions[i]));
				}
			} else {
				orig = translations["calc-missingvalue"];
			}
            for (i in node.Variables) {
                items.push(node.Variables[i]);
            }
			if (items.length) {
				return orig + translations["subtract-joint"] + items.join(translations["subtract-joint"]);
			} else {
				return orig + translations["subtract-joint"] + translations["calc-missingvalue"];
			}
			break;
		case "MULTIPLY":
		    var items = [];
			for (i in node.SubConditions) {
				items.push(summarize(node.SubConditions[i]));
			}
            for (i in node.Variables) {
                items.push(node.Variables[i]);
            }
			if (items.length) {
				return items.join(translations["multiply-joint"]);
			} else {
				return translations["calc-missingvalue"];
			}
			break;
		case "DIVIDE":
		    var orig;
		    var items = [];
			if (node.SubConditions.length>0) {
				orig = summarize(node.SubConditions[i]);
				for (i in node.SubConditions.slice(1)) {
					items.push(summarize(node.SubConditions[i]));
				}
			} else {
				orig = translations["calc-missingvalue"];
			}
            for (i in node.Variables) {
                items.push(node.Variables[i]);
            }
			if (items.length) {
				return orig + translations["divide-joint"] + items.join(translations["subtract-joint"]);
			} else {
				return orig + translations["divide-joint"] + translations["calc-missingvalue"];
			}
			break;
		case "MODULO":
		    var orig;
		    var items = [];
			if (node.SubConditions.length>0) {
				orig = summarize(node.SubConditions[i]);
				for (i in node.SubConditions.slice(1)) {
					items.push(summarize(node.SubConditions[i]));
				}
			} else {
				orig = translations["calc-missingvalue"];
			}
            for (i in node.Variables) {
                items.push(node.Variables[i]);
            }
			if (items.length) {
				return translations["modulo-sentense"].replace("{0}", orig).replace(items.join(translations["subtract-joint"]));
			} else {
				return translations["modulo-sentense"].replace("{0}", orig).replace(translations["calc-missingvalue"]);
			}
			break;
		case "PARSEINT":
		    var items = [];
			for (i in node.SubConditions) {
				items.push(summarize(node.SubConditions[i]));
			}
            for (i in node.Variables) {
                items.push(node.Variables[i]);
            }
			if (items.length) {
				return "<span class='parseint'>" + items.join(translations["value-joint"]) + "</span>";
			} else {
				return translations["calc-missingvalue"];
			}
			break;
		case "EXCHANGE":
		    var items = [];
		    var currency;
			for (i in node.SubConditions) {
				items.push(summarize(node.SubConditions[i]));
			}
            if (node.Variables.length) {
                currency = node.Variables[0];
            } else {
				currency = translations["calc-missingvalue"];
			}
			if (items.length) {
				return translations["exchange-sentense"].replace("{0}", items.join(translations["value-joint"])).replace("{1}", currency);
			} else {
				return translations["calc-missingvalue"];
			}
			break;
		case "PARAM":
            var items = [];
            for (i in node.SubConditions) {
                items.push(summarize(node.SubConditions[i]));
            }
            for (i in node.Variables) {
                items.push("<span class='param'>" + translations[node.Variables[i]] + "</span>");
            }
            return translations["valueof-sentense"].replace("{0}", items.join(translations["valueof-joint"]));
			break;
		}
    }
    return null;
}
function openBoolDialog(condition){
    document.getElementById("boolBody").className = "";
    document.getElementById("boolBody").classList.add("modal-body");
    document.getElementById("boolBody").classList.add(namingmap[this.getAttribute("operator")]);
    document.getElementById("boolBody").classList.add(reverselookuptype[this.getAttribute("operator")]);

    document.getElementById("booltextradio").checked = false;
    document.getElementById("bool_text").classList.remove("available");
    document.getElementById("textcomparebasevalue").value = "";
    document.getElementById("textcomparebasetype").value = "";
    document.getElementById("textextractorselectvalue").value = "";
    document.getElementById("textextractorselecttype").value = "";
    document.getElementById("textcomparetargetvalue").value = "";
    document.getElementById("textcomparetargettype").value = "";
    document.getElementById("boolnumericradio").checked = false;
    document.getElementById("bool_numeric").classList.remove("available");
    document.getElementById("numericcomparebasevalue").value = "";
    document.getElementById("numericcomparebasetype").value = "";
    document.getElementById("numericcompareoperator").value = ">";
    document.getElementById("numericcomparetargetvalue").value = "";
    document.getElementById("numericcomparetargettype").value = "";
    document.getElementById("boolconditionradio").checked = false;
    document.getElementById("bool_addmore").classList.remove("available");
    document.getElementById("boolSubmitButton").disabled = "disabled";
    document.getElementById("boolcondition").value = "";

    document.getElementById("boolModal").style["display"] = "block";
    
    document.getElementById("boolPath").value =  this.getAttribute("path");
}
function boolDialogValidator (){
    var classList = document.getElementById("boolBody").classList;
    document.getElementById("boolSubmitButton").disabled = "disabled";
    if (document.getElementById("booltextradio").checked) {
        document.getElementById("boolSubmitButton").disabled =
            document.getElementById("textcomparebasevalue").value &&
            document.getElementById("textcomparebasetype").value && 
            document.getElementById("textextractorselectvalue").value && 
            document.getElementById("textextractorselecttype").value &&  
            document.getElementById("textcomparetargetvalue").value &&   
            document.getElementById("textcomparetargettype").value ? "" : "disabled";
    } else if (document.getElementById("boolnumericradio").checked) {
        document.getElementById("boolSubmitButton").disabled =
            document.getElementById("numericcomparebasevalue").value &&
            document.getElementById("numericcomparebasetype").value && 
            document.getElementById("numericcompareconditionvalue").value && 
            document.getElementById("numericcomparetargetvalue").value &&  
            document.getElementById("numericcomparetargettype").value ? "" : "disabled";
    } else if (document.getElementById("boolconditionradio").checked) {
        document.getElementById("boolSubmitButton").disabled =
            document.getElementById("boolcondition").value ? "" : "disabled";
    }
}
function addBool(){
    var operation = document.getElementById("boolBody").classList;
    var jsonarea = document.getElementById("conditionLogicInput");
    var json = JSON.parse(jsonarea.value);
    var currentnode = getSubCondition(json, document.getElementById("boolPath").value);
	
	var elem = {};
	if (document.getElementById("booltextradio").checked) {
		elem = {"aa": {"aa":123}};
	} else if (document.getElementById("boolnumericradio").checked) {
		elem = {"aa": {"aa":123}};
	} else if (document.getElementById("boolconditionradio").checked) {
		elem["Operator"] = document.getElementById("boolcondition").value;
		elem["Variables"] = [];
		elem["SubConditions"] = [];
	}

	currentnode.SubConditions.push(elem);
    jsonarea.value = JSON.stringify(json, null, 2);
    document.getElementById("boolModal").style["display"] = "none";
    refreshSummary();
}
function askTextCompare(){
    //document.getElementById("comparisonTextBody").className = "";
    //document.getElementById("comparisonTextBody").classList.add("modal-body");
    //document.getElementById("comparisonTextBody").classList.add("textselection");
    //document.getElementById("comparisonTextModal").style["display"] = "block";
    //document.getElementById("comparisonTextModalButton").onclick = function(){
	//
    //}
	document.getElementById("extractorModal").style["display"] = "block";
}
function askText(currentvalue, currenttype, includeenv, includeenter, callback){
    document.getElementById("textBody").className = "";
    document.getElementById("textBody").classList.add("modal-body");
    document.getElementById("textBody").classList.add("textselection");
    document.getElementById("textenvradio").checked = currenttype == "env";
    document.getElementById("textEnvSelect").value = currenttype == "env" ? currentvalue : "event_message";
    document.getElementById("textenterradio").checked = currenttype == "variable";
    document.getElementById("textEnter").value = currenttype == "variable" ? currentvalue : "";

    document.getElementById('textEnterArea').classList.remove('available');
    document.getElementById('textEnvArea').classList.remove('available');
	textDialogValidator();
    if (currenttype == "env") {
        document.getElementById('textEnvArea').classList.add('available');
    } else if (currenttype == "variable") {
        document.getElementById('textEnterArea').classList.add('available');
    }
    if (includeenter) {
        document.getElementById("textBody").classList.add("includeenter");
    }
    if (includeenv) {
        document.getElementById("textBody").classList.add("includeenv");
    }
    document.getElementById("textModal").style["display"] = "block";
    document.getElementById("textSubmitButton").onclick = ()=>{
        var dispval;
        var val;
        var type;
        if (document.getElementById("textenterradio").checked) {
            dispval = document.getElementById("textEnter").value;
            val = document.getElementById("textEnter").value;
            type = "variable";
        } else if (document.getElementById("textenvradio").checked) {
            dispval = translations[document.getElementById("textEnvSelect").value];
            val = document.getElementById("textEnvSelect").value;
            type = "env";
        }
        callback(dispval, val, type);
        document.getElementById("textModal").style["display"] = "none";
    };
}
function textDialogValidator() {
	if (document.getElementById("textenvradio").checked) {
        document.getElementById("textSubmitButton").disabled =
            document.getElementById("textEnvSelect").value ? "" : "disabled";
		return;
	} else if (document.getElementById("textenterradio").checked) {
        document.getElementById("textSubmitButton").disabled =
            document.getElementById("textEnter").value ? "" : "disabled";
		return;
	}
    document.getElementById("textSubmitButton").disabled = "disabled";
}

function askExtractor(){
    document.getElementById("extractorequalradio").checked = false;
    document.getElementById("extractoregexradio").checked = false;
    document.getElementById("extractorModalButton").checked = false;
    document.getElementById("extractrange-from").value = "";
    document.getElementById("extractrange-to").value = "";
    document.getElementById("extractoregex").value = "";
	extractorDialogValidator();
    document.getElementById("extractorModal").style["display"] = "block";
}
function extractorDialogValidator(){
	if (document.getElementById("extractorequalradio").checked) {
        document.getElementById("extractorModalButton").disabled = "";
		return;
	} else if (document.getElementById("extractosomeradio").checked) {
        document.getElementById("extractorModalButton").disabled = "";
		return;
	} else if (document.getElementById("extractoregexradio").checked) {
        document.getElementById("extractorModalButton").disabled =
            document.getElementById("extractoregex").value ? "" : "disabled";
		return;
	}
    document.getElementById("extractorModalButton").disabled = "disabled";
}
function askNum(){
    document.getElementById("numModal").style["display"] = "block";
}

function numDialogValidator(){
    
}
function openComparerDialog(currentnode, operator, callback){
	var condition = currentnode;
    document.getElementById("comparerBody").className = "";
    document.getElementById("comparerBody").classList.add("modal-body");
    document.getElementById("comparerBody").classList.add(namingmap[operator]);
    document.getElementById("comparerBody").classList.add(reverselookuptype[operator]);
	
	if (currentnode.SubConditions.length) {
		document.getElementById("comp_baseplaceholder").style["display"] = "inline-block";
		document.getElementById("comp_basedisplay").style["display"] = "none";
		document.getElementById("comp_basedisplay").innerText = "";
		document.getElementById("comp_basevalue").value = "";
		document.getElementById("comp_basetype").value = "";
	}
	
//	document.getElementById("comp_selectdisplay").style["display"] = "inline-block";
	document.getElementById("comp_selectvalue").innerText = "";
	document.getElementById("comp_selecttype").value = "";
	document.getElementById("comp_targetplaceholder").style["display"] = "inline-block";
	document.getElementById("comp_targetdisplay").style["display"] = "none";
	document.getElementById("comp_targetdisplay").innerText = "";
	document.getElementById("comp_targetvalue").value = "";
	document.getElementById("comp_targettype").value = "";
	
	document.getElementById("comparerSubmitButton").onclick = function(){
		condition.Variables[0] = "yo";
		condition.SubConditions[0].Variables[0] = "yo";
		document.getElementById("comparerModal").style["display"] = "none";
		callback();
		refreshSummary();
	};

    document.getElementById("comparerModal").style["display"] = "block";
}
function editItem(){
	var operator = event.target.getAttribute("operator");
	var path = event.target.getAttribute("path");
    var jsonarea = document.getElementById("conditionLogicInput");
    var json = JSON.parse(jsonarea.value);
	var currentnode = getSubCondition(json, path);
	var finishupdating = function(){
		jsonarea.value = JSON.stringify(json, null, 2);
		refreshSummary();
	}
	if (reverselookuptype[operator]=="boolean") {
		// Will be handled as openBoolDialog() directly. Wouldn't be called
	} else if (reverselookuptype[operator]=="comp") {
		openComparerDialog(currentnode, operator, finishupdating);
	} else if (reverselookuptype[operator]=="text") {
		
	} else if (reverselookuptype[operator]=="group") {
		
	} else if (reverselookuptype[operator]=="calc") {
		
	} else if (reverselookuptype[operator]=="conv") {
		
	} else if (reverselookuptype[operator]=="extract") {
		
	} else if (operator=="_variable") {
		var ind = event.target.getAttribute("index");
		var current = event.target.innerText;
		askText(current, "variable", false, true, function(dispval, val){currentnode.Variables[ind] = val;finishupdating()});
	}

    refreshSummary();
}
function deleteItem(){
	var operator = event.target.getAttribute("operator");
	var paths = event.target.getAttribute("path").split("/");
    var jsonarea = document.getElementById("conditionLogicInput");
    var json = JSON.parse(jsonarea.value);
    var parentnode = json;
    var currentnode = json;
	
	for (var i in paths.slice(1)){
		parentnode = currentnode;
		currentnode = currentnode.SubConditions[paths.slice(1)[i]];
	}
	parentnode.SubConditions.splice(parentnode.SubConditions.indexOf(currentnode), 1);
    jsonarea.value = JSON.stringify(json, null, 2);
	refreshSummary();
}
function getSubCondition(json, pathstring) {
	var paths = pathstring.split("/");
	var currentnode = json;
	for (var i in paths.slice(1)){ // top node (0) is the base. not included in json
		currentnode = currentnode.SubConditions[paths.slice(1)[i]];
	}
	return currentnode;
}
function refreshSummary(){
    // to make really sure having not difference between what is shown and the actual data, load from object not the json just made
    jsonLoader(JSON.parse(document.getElementById("conditionLogicInput").value), document.getElementById("drawingArea"));
    document.getElementById("logictotaldescription").innerHTML = summarize(JSON.parse(document.getElementById("conditionLogicInput").value));
}