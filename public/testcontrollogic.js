const extractionoperators = ["PARAM"];
const booleanoperators = ["AND", "OR", "NOT"];
const compoperators = ["EQUALS", "GREATER_THAN", "LESS_THAN"];
const textoperators = ["INCLUDES", "REGEX_MATCH"];
const calcoperators = ["COUNT", "SUM", "ADD", "SUBTRACT", "MULTIPLY", "DIVIDE", "MODULO"];
const convoperators = ["PARSEINT", "EXCHANGE"];
const namingmap = {"AND":"and", "OR":"or", "EQUALS":"equals", "PARAM":"param"};

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
    path = path??"";
    var operator = jsonnode.Operator;
    area.replaceChildren();
    if (jsonnode.SubConditions || jsonnode.Variables) {
        //if (jsonnode.Operator == "AND") {
            var elem = document.createElement("div");
                elem.classList.add("item");
                elem.classList.add(namingmap[jsonnode.Operator]);
            for (var iv in jsonnode.Variables) {
                var variableitem = document.createElement("div");
                variableitem.classList.add("variable");
                variableitem.innerText = jsonnode.Variables[iv];
                elem.appendChild(variableitem);
            }
            var childrenarea = document.createElement("div");
            for (var is in jsonnode.SubConditions) {
                var childarea = document.createElement("div");
                jsonLoader(jsonnode.SubConditions[is], childarea, path+"/"+is);
                childrenarea.append(childarea);
            }

            if (booleanoperators.includes(operator)) {
                var addbutton = document.createElement("div");
                addbutton.classList.add("addbutton");
                addbutton.innerText = "+";
                addbutton.attributes["path"] =  path+"/"+is;
                addbutton.attributes["operator"] = operator;
                addbutton.onclick = addItem;
                childrenarea.append(addbutton);
            } else if (compoperators.includes(operator) && (
                (!jsonnode.Variables || jsonnode.Variables.length < 1)||
                (!jsonnode.SubConditions || jsonnode.SubConditions.length < 1)
            )) {
                    var addcompbutton = document.createElement("div");
                    addcompbutton.classList.add("addcompbutton");
                    addcompbutton.innerText = "cooommp";
                    addcompbutton.attributes["path"] =  path+"/"+is;
                    addcompbutton.attributes["operator"] = operator;
                    addcompbutton.onclick = askComparison;
                    childrenarea.append(addcompbutton);
            }  else if (calcoperators.includes(operator)) {
                var asknumbutton = document.createElement("div");
                asknumbutton.classList.add("asknumbutton");
                asknumbutton.innerText = "numbenubeme";
                asknumbutton.attributes["path"] =  path+"/"+is;
                asknumbutton.attributes["operator"] = operator;
                asknumbutton.onclick = askNumber;
                childrenarea.append(asknumbutton);
            }else if ((extractionoperators.includes(operator) ||
                textoperators.includes(operator) ||
                convoperators.includes(operator))
                &&!jsonnode.Variables
            ) {
                var asktextbutton = document.createElement("div");
                asktextbutton.classList.add("asktextbutton");
                asktextbutton.innerText = "?";
                asktextbutton.attributes["path"] =  path;
                asktextbutton.attributes["operator"] = operator;
                asktextbutton.onclick = askText;
                childrenarea.append(asktextbutton);
            }
            elem.appendChild(childrenarea);
            area.appendChild(elem);
        //}
    } else if (jsonnode[0]) {
        for (var i in jsonnode){
            jsonLoader(jsonnode[i], area, i)
        }
    }
}
var addItemDialog = document.createElement("div");
addItemDialog.style["position"] = "absolute";
addItemDialog.style["display"] = "none";
addItemDialog.style["top"] = "0px";
addItemDialog.style["left"] = "0px";
addItemDialog.style["width"] = "300px";
addItemDialog.style["height"] = "200px";
addItemDialog.style["backgroundColor"] = "purple";
for (var o in booleanoperators.concat(compoperators)) {
    var selection = document.createElement("div");
    selection.innerText= booleanoperators.concat(compoperators)[o];
    addItemDialog.appendChild(selection);
}
addItemDialog.submit = function(){
    
}
var okbutton = document.createElement("div");
okbutton.innerText = "OKAY";
okbutton.onclick = addItemDialog.submit;
addItemDialog.appendChild();
addItemDialog.open = function (path, operator){
  this.style["display"] = "block";
  this.getElementsByClassName();
}
window.addEventListener('load', function(){
  document.getElementsByTagName("body")[0].appendChild(addItemDialog);
});
function addItem(){
    addItemDialog.style["display"] = "block";
    addItemDialog.style["top"] = event.layerY;
    addItemDialog.style["left"] = event.layerX;
    addItemDialog.attributes["path"] = this.attributes["path"];
    addItemDialog.attributes["path"] = this.attributes["path"];
//  alert(this.attributes["path"] + this.attributes["operator"]);
}
function askComparison(path, operator, parentoperator){
alert(path + operator);
}
function askNumber(path, operator, parentoperator){
alert(path + operator);
}
function askText(path, operator, parentoperator){
alert(path + operator);
}