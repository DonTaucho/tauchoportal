const extractionoperators = ["PARAM"];
const booleanoperators = ["AND", "OR", "NOT"];
const compoperators = ["EQUALS", "GREATER_THAN", "LESS_THAN"];
const textoperators = ["INCLUDES", "REGEX_MATCH"];
const groupoperators = ["COUNT", "SUM"];
const calcoperators = ["ADD", "SUBTRACT", "MULTIPLY", "DIVIDE", "MODULO"];
const convoperators = ["PARSEINT", "EXCHANGE"];
const namingmap = {"AND":"and", "OR":"or", "NOT":"not", "EQUALS":"equals", "GREATER_THAN":"geater_than", "LESS_THAN":"less_than", "INCLUDES":"includes", "REGEX_MATCH":"regex_match", "COUNT":"count", "SUM":"sum", "ADD":"add", "SUBTRACT":"subtract", "MULTIPLY":"multiply", "DIVIDE":"divide", "MODULO":"modulo", "PARSEINT":"parseint", "EXCHANGE":"exchange", "PARAM":"param"};
const reverselookuptype = {"AND":"boolean", "OR":"boolean", "NOT":"boolean", "EQUALS":"comp", "GREATER_THAN":"comp", "LESS_THAN":"comp", "INCLUDES":"text", "REGEX_MATCH":"text", "COUNT":"group", "SUM":"group", "ADD":"calc","SUBTRACT":"calc","MULTIPLY":"calc","DIVIDE":"calc","MODULO":"calc", "PARSEINT":"conv","EXCHANGE":"conv", "PARAM":"extract"};

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
				variableitem.setAttribute("path", path);
				variableitem.setAttribute("index", iv);
				variableitem.onclick=editVariable;
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
            asktextbutton.onclick = function(){askText(true, true)};
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
        if (node.Operator == "AND") {
            var items = [];
            for (i in node.SubConditions) {
                items.push("<span class='or'>" + summarize(node.SubConditions[i]) + "</span>");
            }
			if (items.length) {
				return items.join(translations["and-joint"]);
			}else {
				return translations["and-notset"];
			}
        }
        if (node.Operator == "OR") {
            var items = [];
            for (i in node.SubConditions) {
                items.push("<span class='or'>" + summarize(node.SubConditions[i]) + "</span>");
            }
			if (items.length) {
				return items.join(translations["or-joint"]);
			}else {
				return translations["or-notset"];
			}
        }
        if (node.Operator == "NOT") {
            var items = [];
            for (i in node.SubConditions) {
                items.push("<span class='or'>" + summarize(node.SubConditions[i]) + "</span>");
            }
			if (items.length) {
				return translations["not-sentense"].replace("{0}", items.join(translations["or-joint"]));
			}else {
				return translations["not-notset"];
			}
        }
        if (node.Operator == "EQUALS") {
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
        }
        if (node.Operator == "PARAM") {
            var items = [];
            for (i in node.SubConditions) {
                items.push(summarize(node.SubConditions[i]));
            }
            for (i in node.Variables) {
                items.push("<span class='param'>" + translations[node.Variables[i]] + "</span>");
            }
            return translations["valueof-sentense"].replace("{0}", items.join(translations["valueof-joint"]));
        }
    }
    return null;
}
function openBoolDialog(){
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
    var paths = document.getElementById("boolPath").value.split("/");
    var jsonarea = document.getElementById("conditionLogicInput");
    var json = JSON.parse(jsonarea.value);
    var currentnode = json;
	
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

	for (var i in paths.slice(1)){
		currentnode = currentnode.SubConditions[paths.slice(1)[i]]
	}
	currentnode.SubConditions.push(elem);
    jsonarea.value = JSON.stringify(json, null, 2);
    document.getElementById("boolModal").style["display"] = "none";
    refreshSummary();
}
function askTextCompare(){
    document.getElementById("comparisonTextBody").className = "";
    document.getElementById("comparisonTextBody").classList.add("modal-body");
    document.getElementById("comparisonTextBody").classList.add("textselection");
    document.getElementById("comparisonTextModal").style["display"] = "block";
    document.getElementById("comparisonTextModalButton").onclick = function(){

    }
}
function askExtractor(){
    document.getElementById("extractorequalradio").checked = false;
    document.getElementById("extractoregexradio").checked = false;
    document.getElementById("extractorModalButton").checked = false;
    document.getElementById("extractorModal").style["display"] = "block";
}
function askNum(){
    document.getElementById("numModal").style["display"] = "block";
}
function askText(currentvalue, currenttype, includeenter, includeenv, callback){
    document.getElementById("textBody").className = "";
    document.getElementById("textBody").classList.add("modal-body");
    document.getElementById("textBody").classList.add("textselection");
    document.getElementById("textenvradio").checked = currenttype == "env";
    document.getElementById("textEnvSelect").value = currenttype == "env" ? currentvalue : "event_message";
    document.getElementById("textenterradio").checked = currenttype == "variable";
    document.getElementById("textEnter").value = currenttype == "variable" ? currentvalue : "";

    document.getElementById('textEnterArea').classList.remove('available');
    document.getElementById('textEnvArea').classList.remove('available');
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
function extractorDialogValidator(){
    
}
function numDialogValidator(){
    
}
function editItem(){
	var operator = event.target.getAttribute("operator");
	var path = event.target.getAttribute("path");

//
//
//
//


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
function editVariable(){
	var operator = event.target.getAttribute("operator");
	var ind = event.target.getAttribute("index");
	var paths = event.target.getAttribute("path").split("/");
	document.getElementById("singleValueEditText").value = event.target.innerText;
	document.getElementById("singleValueModal").style["display"] = "block";
    var jsonarea = document.getElementById("conditionLogicInput");
    var json = JSON.parse(jsonarea.value);
    var currentnode = json;
	
	for (var i in paths.slice(1)){
		currentnode = currentnode.SubConditions[paths.slice(1)[i]];
	}
	singleValueModalButton.onclick =function(){
		
		currentnode.Variables[ind] = document.getElementById("singleValueEditText").value;
		jsonarea.value = JSON.stringify(json, null, 2);
		refreshSummary();
		document.getElementById("singleValueModal").style["display"] = "none";
	}
}
function refreshSummary(){
    // to make really sure having not difference between what is shown and the actual data, load from object not the json just made
    jsonLoader(JSON.parse(document.getElementById("conditionLogicInput").value), document.getElementById("drawingArea"));
    document.getElementById("logictotaldescription").innerHTML = summarize(JSON.parse(document.getElementById("conditionLogicInput").value));
}