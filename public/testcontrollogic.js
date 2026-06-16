const extractionoperators = ["PARAM"];
const booleanoperators = ["AND", "OR", "NOT"];
const compoperators = ["EQUALS", "GREATER_THAN", "LESS_THAN"];
const textoperators = ["INCLUDES", "REGEX_MATCH"];
const groupoperators = ["COUNT", "SUM"];
const calcoperators = ["ADD", "SUBTRACT", "MULTIPLY", "DIVIDE", "MODULO"];
const convoperators = ["PARSEINT", "EXCHANGE"];
const namingmap = {"AND":"and", "OR":"or", "EQUALS":"equals", "PARAM":"param"};
const reverselookuptype = {"AND":"boolean", "OR":"boolean", "NOT":"boolean", "EQUALS":"comp", "GREATER_THAN":"comp", "LESS_THAN":"comp", "INCLUDES":"text", "REGEX_MATCH":"text", "COUNT":"group", "SUM":"group", "ADD":"calc","SUBTRACT":"calc","MULTIPLY":"calc","DIVIDE":"calc","MODULO":"calc", "PARSEINT":"conv","EXCHANGE":"conv", "PARAM":"extract"};

//function refresh (jsoncontainerId, area){
//    jsonLoader(JSON.parse(document.getElementById(jsoncontainerId).value), area);
//    var addButton = document.createElement("div");
//    var area = area;
//    addButton.innerText = "+";
//    addButton.attributes["jsoncontainerid"] = jsoncontainerId;
//    addButton.onclick = function(){
//        var jsoncontainer = document.getElementById(this.attributes["jsoncontainerid"])
//        var newjson = JSON.parse(jsoncontainer.value);
//        newjson.SubConditions.push({"Operator": "AND", "Variables": ["aa"], "SubConditions": []});
//        jsoncontainer.value = JSON.stringify(newjson, null, 2);
//        refresh(this.attributes["jsoncontainerid"], area);
//    };
//    addButton.classList.add("appendnew");
//    area.appendChild(addButton);
//}

function jsonLoader(jsonnode, area, path){
    path = path??"0";
    var operator = jsonnode.Operator;
    area.replaceChildren();
    if (jsonnode.SubConditions || jsonnode.Variables) {
        area.classList.add(namingmap[jsonnode.Operator]);
            
        if (path.split("/").length == 2) {
            var summarized = document.createElement("div");
            summarized.classList.add("summary");
            if (jsonnode.SubConditions) {
                summarized.innerText = summarize(jsonnode);
            }
            area.appendChild(summarized);
        }
        for (var iv in jsonnode.Variables) {
            var variableitem = document.createElement("div");
            variableitem.classList.add("variable");
            variableitem.innerText = jsonnode.Variables[iv];
            area.appendChild(variableitem);
        }
        if (jsonnode.SubConditions && jsonnode.SubConditions.length) {
            var subconarea = document.createElement("div");
            subconarea.classList.add("subcondition");
            for (var is in jsonnode.SubConditions) {
                var childarea = document.createElement("div");
                childarea.classList.add("item");
                jsonLoader(jsonnode.SubConditions[is], childarea, path+"/"+is);
                subconarea.append(childarea);
            }
            area.appendChild(subconarea);
        }

        if (booleanoperators.includes(operator)) {
            // NOT only allows 1 child. Even if systematically handles multiple (will be not-or), limits 1 for suppress complication
            if (operator != "NOT" || jsonnode.SubConditions.length < 1) {
                var addbutton = document.createElement("div");
                addbutton.classList.add("addbutton");
                addbutton.innerText = "+";
                addbutton.setAttribute("path", path);
                addbutton.setAttribute("operator", operator);
                addbutton.onclick = openAddDialog;
                area.append(addbutton);
            }
        } else if (compoperators.includes(operator) && (
            (!jsonnode.Variables || jsonnode.Variables.length < 1)||
            (!jsonnode.SubConditions || jsonnode.SubConditions.length < 1)
        )) {
            var addcompbutton = document.createElement("div");
            addcompbutton.classList.add("addcompbutton");
            addcompbutton.innerText = "cooommp";
            addcompbutton.setAttribute("path", path);
            addcompbutton.setAttribute("operator", operator);
            addcompbutton.onclick = askComparison;
            area.append(addcompbutton);
        }  else if (calcoperators.includes(operator)) {
            var asknumbutton = document.createElement("div");
            asknumbutton.classList.add("asknumbutton");
            asknumbutton.innerText = "numbenubeme";
            asknumbutton.setAttribute("path", path);
            asknumbutton.setAttribute("operator", operator);
            asknumbutton.onclick = askNumber;
            area.append(asknumbutton);
        }else if ((extractionoperators.includes(operator) ||
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
                items.push(summarize(node.SubConditions[i]));
            }
            return items.join(translations["and-joint"]);
        }
        if (node.Operator == "OR") {
            var items = [];
            for (i in node.SubConditions) {
                items.push(summarize(node.SubConditions[i]));
            }
            return items.join(translations["and-joint"]);
        }
        if (node.Operator == "EQUALS") {
            var items = [];
            for (i in node.SubConditions) {
                items.push(summarize(node.SubConditions[i]));
            }
            for (i in node.Variables) {
                items.push(translations["staticvalue"].replace("{0}", node.Variables[i]));
            }
            return translations["equals-sentense"].replace("{0}", items.join(translations["equals-joint"]));
        }
        if (node.Operator == "PARAM") {
            var items = [];
            for (i in node.SubConditions) {
                items.push(summarize(node.SubConditions[i]));
            }
            for (i in node.Variables) {
                items.push(translations[node.Variables[i]]);
            }
            return translations["valueof-sentense"].replace("{0}", items.join(translations["valueof-joint"]));
        }
    }
    return null;
}
function openAddDialog(){
    document.getElementById("addModalBody").className = "";
    document.getElementById("addModalBody").classList.add("modal-body");
    document.getElementById("addModalBody").classList.add(namingmap[this.getAttribute("operator")]);
    document.getElementById("addModalBody").classList.add(reverselookuptype[this.getAttribute("operator")]);
    document.getElementById("addItemModal").style["display"] = "block";
    
    document.getElementById("addModalPath").value =  this.attributes["path"];
}
function addItem(){
    var operation = document.getElementById("addModalBody").classList;
    var paths = document.getElementById("addModalPath").value.split("/");
    var jsonarea = document.getElementById("conditionLogicInput");
    var json = JSON.parse(jsonarea.value);
    var currentnode = json;
    if (operation.contains("and") || operation.contains("or")) {
        var elem = {};
        if (document.getElementById("addtextradio").checked) {
            elem = {"aa": {"aa":123}};
        } else if (document.getElementById("addnumericradio").checked) {
            elem = {"aa": {"aa":123}};
        } else if (document.getElementById("addconditionradio").checked) {
            elem["Operator"] = document.getElementById("addcondition").value;
            elem["Variables"] = [];
            elem["SubConditions"] = [];
        }

        for (var i in paths.slice(1)){
            currentnode = currentnode.SubConditions[paths[i]]
        }
        currentnode.SubConditions.push(elem);
    }
    jsonarea.value = JSON.stringify(json, null, 2);
    // to make really sure having not difference between what is shown and the actual data, load from object not the json just made
    jsonLoader(JSON.parse(document.getElementById("conditionLogicInput").value), document.getElementById("drawingArea"));
    document.getElementById("addItemModal").style["display"] = "none";
    document.getElementById("logictotaldescription").innerText = summarize(json);
}
function askComparison(path, operator, parentoperator){
 alert(path + operator);
}
function askNum(){
 alert(path + operator);
}
function askText(includeenter, includeenv, callback){
    document.getElementById("inputTextBody").className = "";
    document.getElementById("inputTextBody").classList.add("modal-body");
    if (includeenter) {
        document.getElementById("inputTextBody").classList.add("includeenter");
    }
    if (includeenv) {
        document.getElementById("inputTextBody").classList.add("includeenv");
    }
    document.getElementById("inputTextModal").style["display"] = "block";
    inputTextModalButton.onclick = ()=>{
        var dispval;
        var type;
        if (inputtextenterradio.checked) {
            dispval = document.getElementById("inputTextEnter").value;
            type = "variable";
        } else {
            dispval = translations[document.getElementById("inputTextEnvSelect").value];
            type = "env";
        }
        callback(dispval, document.getElementById("inputTextEnvSelect").value, type);
        document.getElementById("inputTextModal").style["display"] = "none";
    };
}