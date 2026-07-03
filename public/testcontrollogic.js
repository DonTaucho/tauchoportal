const extractionoperators = ["PARAM"];
const booleanoperators = ["AND", "OR", "NOT", "SOME"];
const compoperators = ["EQUIVALENT", "GREATER_THAN", "GREATER_OR_EQUAL", "LESS_THAN", "LESS_OR_EQUAL"];
const textoperators = ["EQUALS", "INCLUDES", "REGEX_MATCH"];
const textextractors = ["WHOLEWORD", "REGEX_EXTRACT", "SUBSTRING", "FIRST", "LAST"];
const groupoperators = ["COUNT", "SUM"];
const calcoperators = ["PLUS", "SUBTRACT", "MULTIPLY", "DIVIDE", "MODULO"];
const convoperators = ["PARSEINT", "EXCHANGE"];
const namingmap = {"AND":"and", "OR":"or", "NOT":"not", "SOME":"some", "EQUIVALENT":"equivalent", "GREATER_THAN":"geater_than", "GREATER_OR_EQUAL":"greater_or_equal", "LESS_THAN":"less_than", "LESS_OR_EQUAL":"less_or_equal" , "EQUALS":"equals", "INCLUDES":"includes", "REGEX_MATCH":"regex_match", "COUNT":"count", "SUM":"sum", "WHOLEWORD":"wholeword", "REGEX_EXTRACT": "regex_extract", "SUBSTRING": "substring", "FIRST": "first", "LAST": "last", "PLUS":"plus", "SUBTRACT":"subtract", "MULTIPLY":"multiply", "DIVIDE":"divide", "MODULO":"modulo", "PARSEINT":"parseint", "EXCHANGE":"exchange", "PARAM":"param"};
const operatormap = {"and":"AND", "or":"OR", "not":"NOT", "some":"SOME", "equivalent":"EQUIVALENT", "geater_than":"GREATER_THAN", "greater_or_equal":"GREATER_OR_EQUAL", "less_than":"LESS_THAN", "less_or_equal":"LESS_OR_EQUAL", "equals":"EQUALS", "includes":"INCLUDES", "regex_match":"REGEX_MATCH", "count":"COUNT", "sum":"SUM", "wholeword":"WHOLEWORD", "regex_extract": "REGEX_EXTRACT", "substring": "SUBSTRING", "first": "FIRST", "last": "LAST", "plus":"PLUS", "subtract":"SUBTRACT", "multiply":"MULTIPLY", "divide":"DIVIDE", "modulo":"MODULO", "parseint":"PARSEINT", "exchange":"EXCHANGE", "param":"PARAM"};
const reverselookuptype = {"AND":"boolean", "OR":"boolean", "NOT":"boolean", "SOME":"boolean", "EQUIVALENT":"comp", "GREATER_THAN":"comp", "LESS_THAN":"comp", "EQUALS":"optext", "INCLUDES":"optext", "REGEX_MATCH":"optext", "COUNT":"group", "SUM":"group", "PLUS":"calc","SUBTRACT":"calc","MULTIPLY":"calc","DIVIDE":"calc","MODULO":"calc", "PARSEINT":"conv","EXCHANGE":"conv", "PARAM":"extract"};

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
		
		if (operator == "SOME") {
            var somefield = document.createElement("div");
			var prefix = document.createElement("span");
			prefix.innerText = translations["some-sentense_prefix"];
			somefield.append(prefix);
			var frombutton = document.createElement("input");
			frombutton.type = "number";
			frombutton.inputmode = "numeric";
			frombutton.min = 1;
			frombutton.max = 999;
			frombutton.patern="[0-9]*";
			frombutton.classList.add("numerictext");
			frombutton.style["display"] = "inline-block";
			frombutton.setAttribute("path", path);
			frombutton.value = jsonnode.Variables&&jsonnode.Variables.length>0?jsonnode.Variables[0].split("-")[0]:"";
			frombutton.onchange = function(){
				var json = JSON.parse(document.getElementById("conditionLogicInput").value);
				var path = this.getAttribute("path");
				var current = getSubCondition(json, path);
				current.Variables[0] = this.value+"-"+(current.Variables&&current.Variables.length>0&&current.Variables[0].indexOf("-")?current.Variables[0].split("-")[1]:"");
				reloadJson(json);
			}
			somefield.append(frombutton);
			var joint = document.createElement("span");
			joint.innerText = translations["some-sentense_joint"];
			somefield.append(joint);
			var tobutton = document.createElement("input");
			tobutton.type = "number";
			tobutton.inputmode = "numeric";
			tobutton.min = 1;
			tobutton.max = 999;
			tobutton.patern="[0-9]*";
			tobutton.classList.add("numerictext");
			tobutton.style["display"] = "inline-block";
			tobutton.value = jsonnode.Variables&&jsonnode.Variables.length>0&&jsonnode.Variables[0].indexOf("-")?jsonnode.Variables[0].split("-")[1]:"";
			tobutton.setAttribute("path", path);
			tobutton.onchange = function(){
				var json = JSON.parse(document.getElementById("conditionLogicInput").value);
				var path = this.getAttribute("path");
				var current = getSubCondition(json, path);
				current.Variables[0] = (current.Variables&&current.Variables.length>0&&current.Variables[0].indexOf("-")?current.Variables[0].split("-")[0]:"")+"-"+this.value;
				reloadJson(json);
			}
			somefield.append(tobutton);
			var suffix = document.createElement("span");
			suffix.innerText = translations["some-sentense_suffix"];
			somefield.append(suffix);
			area.append(somefield);
        }

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
				childarea.onclick=function(){this.classList.toggle("focus")}
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
            addcompbutton.onclick = numModal;
            area.append(addcompbutton);
        } else if (textoperators.includes(operator)) {
			if (!jsonnode.SubConditions || jsonnode.SubConditions.length < 1) {
				var askenvbutton = document.createElement("div");
				askenvbutton.classList.add("askenvbutton");
				askenvbutton.innerText = "+";
				askenvbutton.setAttribute("path", path);
				askenvbutton.setAttribute("operator", operator);
				askenvbutton.onclick = function(){inputText(null, null, null, null, true, false, function(disp, type){
					var parentjson = JSON.parse(document.getElementById("conditionLogicInput").value);
					var currentnode = getSubCondition(parentjson, path);
					currentnode.SubConditions = [];
					currentnode.SubConditions.push({"Operator": "PARAM", "Variables": [type],"SubConditions": null});
					reloadJson(parentjson);
				})};
				area.append(askenvbutton);
			}
			if (!jsonnode.Variables || !jsonnode.Variables.length) {
				var inputtextbutton = document.createElement("div");
				inputtextbutton.classList.add("inputtextbutton");
				inputtextbutton.innerText = "+";
				inputtextbutton.setAttribute("path", path);
				inputtextbutton.setAttribute("operator", operator);
				inputtextbutton.onclick = function(){inputText(null, null,null, null, true, function(){
					
				})};
				area.append(inputtextbutton);
			}
        } else if (calcoperators.includes(operator)) {
            var inputnumbutton = document.createElement("div");
            inputnumbutton.classList.add("asknumbutton");
            inputnumbutton.innerText = "+";
            inputnumbutton.setAttribute("path", path);
            inputnumbutton.setAttribute("operator", operator);
            inputnumbutton.onclick = inputNumber;
            area.append(inputnumbutton);
        } else if (textextractors.includes(operator)) {
        
		} else if ((extractionoperators.includes(operator) ||
            textoperators.includes(operator) ||
            convoperators.includes(operator))
            &&!jsonnode.Variables
        ) {
            var inputtextbutton = document.createElement("div");
            inputtextbutton.classList.add("inputtextbutton");
            inputtextbutton.innerText = "?";
            inputtextbutton.setAttribute("path", path);
            inputtextbutton.setAttribute("operator", operator);
            inputtextbutton.onclick = function(){inputText(null, null, null, null, true, true)};
            area.append(inputtextbutton);
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
		case "SOME":
            var items = [],
				rangefrom = node.Variables&&node.Variables[0]?parseInt(node.Variables[0].split("-")[0]):null,
				rangeto = node.Variables&&node.Variables[0]&&node.Variables[0].split("-").length>1?parseInt(node.Variables[0].split("-")[1]):null;
            for (i in node.SubConditions) {
                items.push("<span class='or'>" + summarize(node.SubConditions[i]) + "</span>");
            }
			if (items.length) {
				if (!rangefrom&&!rangeto) {
					return translations["some-notset"];
				} else if (rangefrom&&!rangeto) {
					return translations["some-sentense_from"].replace("{0}", items.join(translations["or-joint"])).replace("{1}", rangefrom);
				} else if (!rangefrom&&rangeto) {
					return translations["some-sentense_to"].replace("{0}", items.join(translations["or-joint"])).replace("{1}", rangeto);
				} else if (rangefrom&&rangeto) {
					return translations["some-sentense_fromto"].replace("{0}", items.join(translations["or-joint"])).replace("{1}", rangefrom).replace("{2}", rangeto);
				}
				return translations["some-sentense"].replace("{0}", items.join(translations["or-joint"]));
			}else {
				return translations["some-notset"];
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
            var items = [];
			if (node.SubConditions.length>0) {
			    target = summarize(node.SubConditions[0]);
			    for (i in node.SubConditions.slice(1)) {
			        items.push(translations["staticvalue"].replace("{0}", summarize(node.SubConditions[i])));
			    }
			} else {
			    target = "<span class='novalue'>" + translations["includes-novalue"] + "</span>";
			}
			if (node.Variables.length > 0) {
				items.push("<span class='static'>" + translations["staticvalue"].replace("{0}", node.Variables[0]) + "</span>");
			}
			if (node.Variables.length > 1) {
				if (node.Variables[1].split("-")[0]&&parseInt(node.Variables[1].split("-")[0])) {
					rangefrom = parseInt(node.Variables[1].split("-")[0]);
				}
				if (node.Variables[1].split("-")[0]&&node.Variables[1].split("-").length>1&&parseInt(node.Variables[1].split("-")[1])){
					rangeto = parseInt(node.Variables[1].split("-")[1]);
				}
			}
			var comparar;
			if (items?.length) {
				comparar = items.join(translations["valueof-joint"]);
			} else {
				comparar = "<span class='novalue'>" + translations["includes-missingvalue"] + "</span>";
			}
			if (!rangefrom&&!rangeto || rangefrom==1&&!rangeto) {
			    return translations["includes-sentense-one"].replace("{0}", target).replace("{1}", comparar);
			} else if (rangefrom&&!rangeto) {
			    return translations["includes-sentense-rangefrom"].replace("{0}", target).replace("{1}", comparar).replace("{2}", rangefrom);
			} else if (!rangefrom&&rangeto) {
			    return translations["includes-sentense-rangeto"].replace("{0}", target).replace("{1}", comparar).replace("{2}", rangeto);
			} else if (rangefrom&&rangeto) {
			    return translations["includes-sentense-rangefromto"].replace("{0}", target).replace("{1}", comparar).replace("{2}", rangefrom).replace("{3}", rangeto);
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
			if (items.length) {
				target = items.join(translations["valueof-joint"]);
			} else {
				target = "<span class='novalue'>" + translations["regex-missingvalue"] + "</span>";
			}
			var regex;
			if (regexs.length) {
				regex = regexs.join(translations["valueof-joint"]);
			} else {
				regex = "<span class='novalue'>" + translations["regex-missingvalue"] + "</span>";
			}
			
			return translations["regex-sentense"].replace("{0}", target).replace("{1}", regex);
			break;
		case "WHOLEWORD":
			var items = [];
			for (i in node.SubConditions) {
				items.push(summarize(node.SubConditions[i]));
			}
            for (i in node.Variables) {
                items.push(node.Variables[i]);
            }
			return translations["textextract-whole"].replace("{0}", items.join(translations["valueof-joint"]));
			break;
		case "REGEX_EXTRACT":
			var items = [];
            var regexs = [];
			for (i in node.SubConditions) {
				items.push(summarize(node.SubConditions[i]));
			}
            for (i in node.Variables) {
                regexs.push("<span class='regexparam'>" + node.Variables[i] + "</span>");
            }
			var target;
			if (items.length) {
				target = items.join(translations["valueof-joint"]);
			} else {
				target = "<span class='novalue'>" + translations["regex-missingvalue"] + "</span>";
			}
			var regex;
			if (regexs.length) {
				regex = regexs.join(translations["valueof-joint"]);
			} else {
				regex = "<span class='novalue'>" + translations["regex-missingvalue"] + "</span>";
			}
			
			return translations["textextract-regex"].replace("{0}", target).replace("{1}", regex);
			break;
		case "SUBSTRING":
			var target;
            var rangefrom = "";
            var rangeto = "";
			var items = [];
			if (node.SubConditions&&node.SubConditions.length>0) {
			    target = summarize(node.SubConditions[0]);
			    for (i in node.SubConditions.slice(1)) {
			        items.push(summarize(node.SubConditions[i]));
			    }
			} else {
			    target = "<span class='novalue'>" + translations["textextract-sub_missingvalue"] + "</span>";
			}
			for (i in node.Variables) {
				items.push(node.Variables[i]);
			}
			if (items.length > 0) {
				if (items[0].split("-")&&parseInt(items[0].split("-")[0])) {
					rangefrom = parseInt(items[0].split("-")[0]);
				}
				if (items[0].split("-")&&items[0].split("-").length>1&&parseInt(items[0].split("-")[1])){
					rangeto = parseInt(items[0].split("-")[1]);
				}
			}
			if (!rangefrom&&!rangeto) {
			    return translations["textextract-sub_missingvalue"];
			} else if (rangefrom&&!rangeto) {
			    return translations["textextract-sub_from"].replace("{0}", target).replace("{1}", rangefrom);
			} else if (!rangefrom&&rangeto) {
			    return translations["textextract-sub_to"].replace("{0}", target).replace("{1}", rangeto);
			} else if (rangefrom&&rangeto) {
			    return translations["textextract-sub_fromto"].replace("{0}", target).replace("{1}", rangefrom).replace("{2}", rangeto);
			}
			break;
		case "FIRST":
			var target;
			var items = [];
			var length;
			if (node.SubConditions.length>0) {
			    target = summarize(node.SubConditions[0]);
			    for (i in node.SubConditions.slice(1)) {
			        items.push(summarize(node.SubConditions[i]));
			    }
			} else {
			    target = "<span class='novalue'>" + translations["textextract-sub_missingvalue"] + "</span>";
			}
			for (i in node.Variables) {
				items.push(node.Variables[i]);
			}
			length = parseInt(items[0]);
			if (!length) {
			    return translations["textextract-sub_missingvalue"];
			} else {
			    return translations["textextract-first"].replace("{0}", target).replace("{1}", length);
			}
			break;
		case "LAST":
			var target;
			var items = [];
			var length;
			if (node.SubConditions.length>0) {
			    target = summarize(node.SubConditions[0]);
			    for (i in node.SubConditions.slice(1)) {
			        items.push(summarize(node.SubConditions[i]));
			    }
			} else {
			    target = "<span class='novalue'>" + translations["textextract-sub_missingvalue"] + "</span>";
			}
			for (i in node.Variables) {
				items.push(node.Variables[i]);
			}
			length = parseInt(items[0]);
			if (!length) {
			    return translations["textextract-sub_missingvalue"];
			} else {
			    return translations["textextract-last"].replace("{0}", target).replace("{1}", length);
			}
			break;
		case "PLUS":
		    var items = [];
			for (i in node.SubConditions) {
				items.push(summarize(node.SubConditions[i]));
			}
            for (i in node.Variables) {
                items.push(node.Variables[i]);
            }
			if (items.length) {
				return items.join(translations["plus-joint"]);
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
function openBoolDialog(ev, path, callback){
    var json = JSON.parse(document.getElementById("conditionLogicInput").value);
	var path = path, callback =callback;
	var	currentnode = getSubCondition(json, path??"")??{};
    document.getElementById("boolBody").className = "";
    document.getElementById("boolBody").classList.add("modal-body");
    document.getElementById("boolBody").classList.add(namingmap[ev.target.getAttribute("operator")]);
    document.getElementById("boolBody").classList.add(reverselookuptype[ev.target.getAttribute("operator")]);
	document.getElementById("boolmodal_text").style["display"] = "block";
	document.getElementById("boolmodal_numeric").style["display"] = "block";
	document.getElementById("boolmodal_bool").style["display"] = "block";
    document.getElementById("booltextradio").style["display"] = "inline";
    document.getElementById("boolnumericradio").style["display"] = "inline";
    document.getElementById("boolconditionradio").style["display"] = "inline";

	if (textoperators.includes(currentnode.Operator)) {
		document.getElementById("boolmodal_text").style["display"] = "inline";
		document.getElementById("boolmodal_numeric").style["display"] = "none";
		document.getElementById("boolmodal_bool").style["display"] = "none";
		document.getElementById("booltextradio").style["display"] = "none";
		document.getElementById("booltextradio").checked = true;
		document.getElementById("boolmodal_text").classList.add("available");
		document.getElementById("textcomparebaseplaceholder").style["display"] = currentnode.SubConditions&&currentnode.SubConditions.length ? "none":"inline-block";
		document.getElementById("textcomparebasedisplay").style["display"] = currentnode.SubConditions&&currentnode.SubConditions.length ? "inline":"none";
		var extopr, taropr, targetbase, targetvar, targetvar1, targetvar2, extvar1, extvar2,  extvar3, operator;
		if (currentnode.SubConditions&&currentnode.SubConditions[0]&&currentnode.SubConditions[0].Operator == "PARAM") {
			taropr = namingmap[currentnode.SubConditions[0].Operator];
			targetbase = currentnode.SubConditions[0].Variables[0];
			targetvar1 = currentnode.SubConditions[0].Variables[1];
			targetvar2 = currentnode.SubConditions[0].Variables[2];
			extopr = namingmap[currentnode.Operator];
			extvar1 = currentnode.Variables[0];
			extvar2 = currentnode.Variables&&currentnode.Variables.length&&currentnode.Variables[1]?currentnode.Variables[1].split("-")[0]:currentnode.Variables[1];
			extvar3 = currentnode.Variables&&currentnode.Variables.length>1&&currentnode.Variables[1].split("-").length>1?currentnode.Variables[1].split("-")[1]:currentnode.Variables[2];
			operator = currentnode.Operator;
			document.getElementById("textcomparebasedisplay").innerText = generageDisplayText("extract", taropr, targetbase, targetvar1, targetvar2);
			document.getElementById("textcomparebaseexttype").value = taropr=="param"?"wholeword":taropr;
			document.getElementById("textcomparebasevalue").value = targetbase;
			document.getElementById("textcomparebasetype").value = "env";
			document.getElementById("textconditionselectdisplay").innerHTML = generageDisplayText("input", extopr, extvar1, extvar2, extvar3);
			document.getElementById("textconditionselectvalue").value = extvar1;
			document.getElementById("textconditionselecttype").value = extopr;
			document.getElementById("textcomparebaseextvalue").value = "";
			document.getElementById("textconditionselectrange").value = currentnode.Variables[1];
		} else {
			taropr = namingmap[currentnode.SubConditions[0].Operator];
			var paramcondition = currentnode.SubConditions[0];
			targetbase = paramcondition.SubConditions&&paramcondition.SubConditions[0]&&paramcondition.SubConditions[0].Variables?paramcondition.SubConditions[0].Variables[0]:null;
			targetvar = paramcondition&&paramcondition.Variables?paramcondition.Variables[0]:null;
			targetvar1 = targetvar?targetvar.split("-")[0]:targetvar;
			targetvar2 = targetvar&&targetvar.split("-").length>1?targetvar.split("-")[1]:paramcondition.Variables[1];
			extopr = namingmap[currentnode.Operator];
			extvar1 = currentnode.Variables[0];
			extvar2 = currentnode.Variables&&currentnode.Variables.length&&currentnode.Variables[1]?currentnode.Variables[1].split("-")[0]:currentnode.Variables[1];
			extvar3 = currentnode.Variables&&currentnode.Variables.length>1&&currentnode.Variables[1].split("-").length>1?currentnode.Variables[1].split("-")[1]:currentnode.Variables[2];
			operator = currentnode.Operator;
			document.getElementById("textcomparebasedisplay").innerText = generageDisplayText("extract", taropr, targetbase, targetvar1, targetvar2);
			document.getElementById("textcomparebaseexttype").value = taropr=="param"?"wholeword":taropr;
			document.getElementById("textcomparebasevalue").value = targetbase;
			document.getElementById("textcomparebasetype").value = "env";
			document.getElementById("textconditionselectdisplay").innerHTML = generageDisplayText("input", extopr, extvar1, extvar2, extvar3);
			document.getElementById("textconditionselectvalue").value = extvar1;
			document.getElementById("textconditionselecttype").value = extopr;
			document.getElementById("textcomparebaseextvalue").value = targetvar;
			document.getElementById("textconditionselectrange").value = currentnode.Variables[1];
		}
	} else {
		document.getElementById("booltextradio").checked = false;
		document.getElementById("boolmodal_text").classList.remove("available");
		document.getElementById("textcomparebaseplaceholder").style["display"] = "inline-block";
		document.getElementById("textcomparebasedisplay").style["display"] = "none";
		document.getElementById("textcomparebasedisplay").innerText = "";
		document.getElementById("textcomparebasevalue").value = "";
		document.getElementById("textcomparebasetype").value = "";
		document.getElementById("textcomparebaseexttype").value = "";
		document.getElementById("textcomparebaseextvalue").value = "";
		document.getElementById("textconditionselectdisplay").innerText = translations["compare-novalue"];
		document.getElementById("textconditionselectvalue").value = "";
		document.getElementById("textconditionselecttype").value = "";
		document.getElementById("textconditionselectrange").value = "";
	}
    document.getElementById("boolnumericradio").checked = false;
    document.getElementById("boolmodal_numeric").classList.remove("available");
    document.getElementById("numericcomparebaseplaceholder").style["display"] = "inline-block";
    document.getElementById("numericcomparebaseplacedisp").style["display"] = "none";
    document.getElementById("numericcomparebase").value = "";
    document.getElementById("numericcompareoperator").value = ">";
    document.getElementById("numericcomparetargetplaceholder").style["display"] = "inline-block";
    document.getElementById("numericcomparetargetplacedisp").style["display"] = "none";
    document.getElementById("numericcomparetarget").value = "";
    document.getElementById("boolconditionradio").checked = false;
    document.getElementById("boolmodal_bool").classList.remove("available");
    document.getElementById("boolSubmitButton").disabled = "disabled";
    document.getElementById("boolcondition").value = "";

    document.getElementById("boolModal").style["display"] = "block";
    document.getElementById("boolPath").value =  ev.target.getAttribute("path");
	document.getElementById("boolSubmitButton").onclick = function(evb) {editBoolItem(evb, path)};
	if (callback) {
		callback();
	}
}
function boolDialogValidator (){
    var classList = document.getElementById("boolBody").classList;
    document.getElementById("boolSubmitButton").disabled = "disabled";
    if (document.getElementById("booltextradio").checked) {
        document.getElementById("boolSubmitButton").disabled =
            document.getElementById("textcomparebasevalue").value &&
            document.getElementById("textcomparebasetype").value && 
            document.getElementById("textconditionselectvalue").value && 
            document.getElementById("textconditionselecttype").value ? "" : "disabled";
    } else if (document.getElementById("boolnumericradio").checked) {
        document.getElementById("boolSubmitButton").disabled =
            document.getElementById("numericcomparebase").value &&
            document.getElementById("numericcompareoperator").value && 
            document.getElementById("numericcomparetarget").value ? "" : "disabled";
    } else if (document.getElementById("boolconditionradio").checked) {
        document.getElementById("boolSubmitButton").disabled =
            document.getElementById("boolcondition").value ? "" : "disabled";
    }
}
function editBoolItem(ev, path){
    var operation = document.getElementById("boolBody").classList;
    var jsonarea = document.getElementById("conditionLogicInput");
    var json = JSON.parse(jsonarea.value);
	var currentnode;
	
	if (path) {
		currentnode = getSubCondition(json, path);
	} else {
		currentnode = {};
		var parentnode = getSubCondition(json, document.getElementById("boolPath").value);
		parentnode.SubConditions.push(currentnode);
	}
	
	if (document.getElementById("booltextradio").checked) {
		
		var textcomparebasevalue = document.getElementById("textcomparebasevalue").value,
		
		textcomparebaseexttype = document.getElementById("textcomparebaseexttype").value,
		textcomparebaseextvalue = document.getElementById("textcomparebaseextvalue").value,
		
		textconditionselectvalue = document.getElementById("textconditionselectvalue").value,
		textconditionselectrange = document.getElementById("textconditionselectrange").value;
		textconditionselecttype = document.getElementById("textconditionselecttype").value;
		
		switch (document.getElementById("textcomparebasetype").value) {
			case "env":
				var variables = [], compvariables = [], paramvariables = [], subconditions = [];
				if (document.getElementById("textconditionselectvalue").value&&document.getElementById("textconditionselectvalue").value!="undefined") {
					variables.push(document.getElementById("textconditionselectvalue").value);
				}
				if (document.getElementById("textconditionselectrange").value&&document.getElementById("textconditionselectrange").value!="undefined") {
					variables.push(document.getElementById("textconditionselectrange").value);
				}
				if (document.getElementById("textcomparebaseextvalue").value&&document.getElementById("textcomparebaseextvalue").value!="undefined") {
					compvariables.push(document.getElementById("textcomparebaseextvalue").value);
				}
				if (document.getElementById("textcomparebasevalue").value&&document.getElementById("textcomparebasevalue").value!="undefined") {
					paramvariables.push(document.getElementById("textcomparebasevalue").value);
				}
				if (document.getElementById("textcomparebaseexttype").value=="wholeword") {
					subconditions.push ({"Operator": "PARAM", "Variables": paramvariables});
				} else {
					subconditions.push({"Operator": operatormap[document.getElementById("textcomparebaseexttype").value],
						"SubConditions": [{"Operator": "PARAM", "Variables": paramvariables}],
						"Variables": compvariables});
				}
				currentnode.Operator = operatormap[document.getElementById("textconditionselecttype").value];
				currentnode.Variables = variables;
				currentnode.SubConditions = subconditions;
				break;
			
			case "variable":
				currentnode.Operator = operatormap[document.getElementById("textcomparebaseexttype").value];
				currentnode.Variables = [document.getElementById("textcomparebaseextvalue").value, document.getElementById("textcomparebasevalue").value];
				currentnode.SubConditions = [{"Operator": document.getElementById("textconditionselecttype").value, "Variables": [document.getElementById("textconditionselectvalue").value]}];
				break;
		}
	} else if (document.getElementById("boolnumericradio").checked) {
		//currentnode = {"aa": {"aa":123}};
	} else if (document.getElementById("boolconditionradio").checked) {
		currentnode["Operator"] = document.getElementById("boolcondition").value;
		currentnode["Variables"] = [];
		currentnode["SubConditions"] = [];
	}

    document.getElementById("boolModal").style["display"] = "none";
    reloadJson(json);
}
function inputText(currentvalue, currenttype, currentextractor, currentextractorval, includeenv, includeenter, callback){
    document.getElementById("textBody").className = "";
    document.getElementById("textBody").classList.add("modal-body");
    document.getElementById("textBody").classList.add("textselection");
    document.getElementById("textenvradio").checked = currenttype == "env";
    document.getElementById("textEnvSelect").value = currenttype == "env" ? currentvalue : "event_message";
    document.getElementById("textenterradio").checked = currenttype == "variable";
    document.getElementById("textEnter").value = currenttype == "variable" ? currentvalue : "";

    document.getElementById('textEnterArea').classList.remove('available');
    document.getElementById('textEnvArea').classList.remove('available');
    document.getElementById('textExtArea').classList.remove('available');
    document.getElementById('textExtSelect').disabled = currenttype == "variable" || !includeenv ? "disabled" : "";
    document.getElementById('textExtSelect').value=currentextractor??"wholeword";
	document.getElementById('textExtRegex').style['display']= currentextractor=="regex_extract" ? "inline-block":"none";
	document.getElementById('textExtRegex').value=currentextractor=="regex_extract"?currentextractorval:"";
	document.getElementById('textExtSubFrom').style['display']= currentextractor=="substring" ? "inline-block":"none";
	document.getElementById('textExtSubFrom').value=currentextractor=="substring"?currentextractorval?.split("-")[0]:"";
	document.getElementById('textExtSubTo').style['display']= currentextractor=="substring" ? "inline-block":"none";
	document.getElementById('textExtSubTo').value=currentextractor=="substring"&&currentextractorval?.length>1?currentextractorval.split("-")[1]:"";
	document.getElementById('textExtFirst').style['display']= currentextractor=="first" ? "inline-block":"none";
	document.getElementById('textExtFirst').value=currentextractor=="first"?currentextractorval:"";
	document.getElementById('textExtLast').style['display']= currentextractor=="last" ? "inline-block":"none";
	document.getElementById('textExtLast').value=currentextractor=="last"?currentextractorval:"";
    document.getElementById("textenterradio").style["display"]= includeenv ? "inline-block" : "none";
	
    if (currenttype == "env" || !includeenter) {
        document.getElementById('textEnvArea').classList.add('available');
        document.getElementById('textExtArea').classList.add('available');
    } else if (currenttype == "variable" || !includeenv) {
        document.getElementById('textEnterArea').classList.add('available');
    }
    if (includeenter) {
        document.getElementById("textBody").classList.add("includeenter");
		document.getElementById("textenvradio").style["display"]= "inline-block";
    } else {
		document.getElementById("textenvradio").checked = true;
		document.getElementById("textenvradio").style["display"]= "none";
	}
    if (includeenv) {
        document.getElementById("textBody").classList.add("includeenv");
		document.getElementById("textenterradio").style["display"]= "inline-block";
    } else {
		document.getElementById("textenterradio").checked = true;
		document.getElementById("textenterradio").style["display"]= "none";
	}
	textDialogValidator();
    document.getElementById("textModal").style["display"] = "block";
    document.getElementById("textSubmitButton").onclick = ()=>{
        var dispval,val,type,exttype,extval;
        if (document.getElementById("textenterradio").checked) {
            dispval = document.getElementById("textEnter").value;
            val = document.getElementById("textEnter").value;
            type = "variable";
        } else if (document.getElementById("textenvradio").checked) {
            val = document.getElementById("textEnvSelect").value;
            type = "env";
			exttype = document.getElementById("textExtSelect").value;
			switch (exttype) {
				case "regex_extract":
					extval = document.getElementById("textExtRegex").value;
					dispval = generageDisplayText("extract", "regex_extract", val, extval);
					break;
				case "substring":
					extval = `${document.getElementById('textExtSubFrom').value}-${document.getElementById('textExtSubTo').value}`;
					dispval = generageDisplayText("extract", "substring", val, document.getElementById('textExtSubFrom').value, document.getElementById('textExtSubTo').value);
					break;
				case "first":
					extval = document.getElementById("textExtFirst").value;
					dispval = generageDisplayText("extract", "first", val, extval);
					break;
				case "last":
					extval = document.getElementById("textExtLast").value;
					dispval = generageDisplayText("extract", "last", val, extval);
					break;
				default:
					extval = "";
					exttype = "wholeword";
					dispval = generageDisplayText("extract", "wholeword", val);
					break;
			}
        }
        callback(dispval, val, type, exttype, extval);
        document.getElementById("textModal").style["display"] = "none";
    };
}
function generageDisplayText(tasktype, operationtype, ...values){
	var dispval = translations["generic-notset"];
	switch (tasktype) {
		case "extract":
			switch (operationtype) {
				case "regex_extract":
					dispval = translations["textextract-regex"].replace("{0}", translations[values[0]]).replace("{1}", values[1]);
					break;
				case "substring":
					var range_from = values[1], range_to = values[2];
					if (!range_from&&!range_to) {
						dispval = translations["textextract-sub_missingvalue"];
					} else if (range_from&&!range_to) {
						dispval = translations["textextract-sub_from"].replace("{0}",translations[values[0]]).replace("{1}", range_from);
					} else if (!range_from&&range_to) {
						dispval = translations["textextract-sub_to"].replace("{0}",translations[values[0]]).replace("{1}", range_to);
					} else if (range_from&&range_to) {
						dispval = translations["textextract-sub_fromto"].replace("{0}",translations[values[0]]).replace("{1}", range_from).replace("{2}", range_to);
					}
					break;
				case "first":
					dispval = translations["textextract-first"].replace("{0}", translations[values[0]]).replace("{1}", values[1]);
					break;
				case "last":
					dispval = translations["textextract-last"].replace("{0}", translations[values[0]]).replace("{1}", values[1]);
					break;
				default:
					dispval = translations["textextract-whole"].replace("{0}",translations[values[0]]);
					break;
			}
			break;
		case "input":
			var val = values[0] ? values[0] : translations["textcondition-missingvalue"];
			switch (operationtype){
				case "equals":
					dispval = translations["textcondition-equals"].replace("{0}", val);
					break;
				case "includes":
					var rangefrom = values[1], rangeto = values[2];
					if (!rangefrom && !rangeto) {
						dispval = translations["textcondition-one"].replace("{0}", val);
					} else if (rangefrom && !rangeto) {
						dispval = translations["textcondition-rangefrom"].replace("{0}", val).replace("{1}", rangefrom);
					} else if (!rangefrom && rangeto) {
						dispval = translations["textcondition-rangeto"].replace("{0}", val).replace("{1}", rangeto);
					} else if (rangefrom && rangeto) {
						dispval = translations["textcondition-rangefromto"].replace("{0}", val).replace("{1}", rangefrom).replace("{2}", rangeto);
					}
					break;
				case "regex_match":
					dispval = translations["textcondition-regex"].replace("{0}", val);
					break;
			}
			break;
	}
	return dispval
}
function textDialogValidator() {
	var valid = false;
	if (document.getElementById("textenvradio").checked) {
        valid = document.getElementById("textEnvSelect").value;
		if (document.getElementById("textExtSelect").value=="regex_extract") {
		  try {
			RegExp(document.getElementById("textExtRegex").value);
		  } catch {
			valid = false;
		  }
		} else if (document.getElementById("textExtSelect").value=="substring") {
			try {
				valid = isNaN(parseInt(document.getElementById("textExtSubTo").value)) ^ isNaN(parseInt(document.getElementById("textExtSubFrom").value)) || parseInt(document.getElementById("textExtSubTo").value) >= parseInt(document.getElementById("textExtSubFrom").value);
			} catch {
				valid = false;
			}
		} else if (document.getElementById("textExtSelect").value=="first") {
			valid = parseInt(document.getElementById("textExtFirst").value);
		} else if (document.getElementById("textExtSelect").value=="last") {
			valid = parseInt(document.getElementById("textExtLast").value);
		}
	} else if (document.getElementById("textenterradio").checked) {
        valid = document.getElementById("textEnter").value;
	}
	
    document.getElementById("textSubmitButton").disabled = valid ? "" : "disabled";
}

function inputTextCondition(currenttype, currentrange, currentval, callback){
    document.getElementById("textConditionEqualradio").checked = currenttype == "equals";
    document.getElementById("textconditionrangeradio").checked = currenttype == "includes";
    document.getElementById("textconditionregexradio").checked = currenttype == "regex_match";
    document.getElementById("textconditionrange-from").value = currenttype == "includes" ? currentrange.split("-")[0] : "";
    document.getElementById("textconditionrange-to").value = currenttype == "includes" && currentrange.indexOf("-") && currentrange !== "-" ? currentrange.split("-")[1] : "";
    document.getElementById("textconditionequals").value = currenttype == "equals" ? currentval : "";
    document.getElementById("textconditionrangetext").value = currenttype == "includes" ? currentval : "";
    document.getElementById("textconditionregex").value = currenttype == "regex_match" ? currentval : "";
	textConditionDialogValidator();
	document.getElementById("textConditionModalButton").onclick = () => {
		var dispval, type, range, val;
		if (document.getElementById("textConditionEqualradio").checked) {
			type = "equals";
			val = document.getElementById("textconditionequals").value;
			dispval = generageDisplayText("input", "equals", val);
		} else if (document.getElementById("textconditionrangeradio").checked) {
			type = "includes";
			val = document.getElementById("textconditionrangetext").value;
			range = `${document.getElementById("textconditionrange-from").value}-${document.getElementById("textconditionrange-to").value}`;
			dispval = generageDisplayText("input", "includes", val, document.getElementById("textconditionrange-from").value, document.getElementById("textconditionrange-to").value);
		} else if (document.getElementById("textconditionregexradio").checked) {
			type = "regex_match";
			val = document.getElementById("textconditionregex").value;
			dispval = generageDisplayText("input", "regex_match", val);
		}
        callback(dispval, type, range, val);
        document.getElementById("textConditionModal").style["display"] = "none";
	}
    document.getElementById("textConditionModal").style["display"] = "block";
}
function textConditionDialogValidator(){
	if (document.getElementById("textConditionEqualradio").checked) {
        document.getElementById("textConditionModalButton").disabled = document.getElementById("textconditionequals").value?"":"disabled";
		return;
	} else if (document.getElementById("textconditionrangeradio").checked) {
		document.getElementById("textConditionModalButton").disabled = document.getElementById("textconditionrangetext").value && (!document.getElementById("textconditionrange-from").value || !document.getElementById("textconditionrange-to").value || parseInt(document.getElementById("textconditionrange-to").value) > parseInt(document.getElementById("textconditionrange-from").value)) ? "" : "disabled";
		return;
	} else if (document.getElementById("textconditionregexradio").checked) {
		try {
			RegExp(document.getElementById("textconditionregex").value);
			document.getElementById("textConditionModalButton").disabled = "";
		} catch {
			document.getElementById("textConditionModalButton").disabled = "disabled";
		}
		return;
	}
    document.getElementById("textConditionModalButton").disabled = "disabled";
}
function inputNumber(currentformula, callback){
    document.getElementById("numModal").style["display"] = "block";
	numDialogValidator();
	document.getElementById("numModalButton").onclick = function(){
		callback(document.getElementById("calcformula").value, document.getElementById("calcdisplay").innerText);
	}
}

function numDialogValidator(){
    document.getElementById("numModalButton").disabled="disabled";
}

function visualizeFormula(val){
	var current = document.getElementById("calcformula").value;
	var formula;
	try {
		formula = JSON.parse(current);
	} catch {
		formula = {};
	}
	var elem = document.createElement("div");
    document.getElementById("visualizedcalc").after(document.getElementById("calccursor"));
    document.getElementById("visualizedcalc").replaceChildren();
	appendCalcElem(formula, document.getElementById("visualizedcalc"), "");
	setCursor(formula);
}

function appendCalcElem(node, base, path) {
	if (node) {
		switch(node.Operator) {
			case "PLUS":
				for (var i in node.SubConditions) {
					if (base.childNodes.length) {
						var plussign = document.createElement("span");
						plussign.innerText = "+";
						plussign.setAttribute("path",  path + "/sub:" + i + ":pre");
						plussign.onclick = function(e){document.getElementById("calccursorpos").value = e.target.getAttribute("path"); setCursor(JSON.parse(document.getElementById("calcformula").value))};
						plussign.classList.add("plussign");
						base.append(plussign);
					}
					var child = document.createElement("span");
					child.classList.add("plusbracket");
					child.classList.add("sub");
					child.setAttribute("path",  path + "/sub:" + i);
					child.onclick = function(e){document.getElementById("calccursorpos").value = e.target.getAttribute("path"); setCursor(JSON.parse(document.getElementById("calcformula").value))};
					appendCalcElem(node.SubConditions[i], child, path + "/sub:" + i);
					base.append(child);
				}
				for (var i in node.Variables) {
					if (base.childNodes.length) {
						var plussign = document.createElement("span");
						plussign.classList.add("plussign");
						plussign.setAttribute("path",  path + "/var:" + i + ":pre");
						plussign.onclick = function(e){document.getElementById("calccursorpos").value = e.target.getAttribute("path"); setCursor(JSON.parse(document.getElementById("calcformula").value))};
						plussign.innerText = "+";
						base.append(plussign);
					}
					var prependelem = document.createElement("span");
					prependelem.setAttribute("path",  path + "/var:" + i);
					prependelem.onclick = function(e){document.getElementById("calccursorpos").value = e.target.getAttribute("path"); setCursor(JSON.parse(document.getElementById("calcformula").value))};
					prependelem.classList.add("prepend");
					base.append(prependelem);
					var variableelem = document.createElement("span");
					variableelem.classList.add("var");
					variableelem.classList.add("plus");
					variableelem.setAttribute("path",  path + "/var:" + i);
					variableelem.onclick = function(e){document.getElementById("calccursorpos").value = e.target.getAttribute("path"); setCursor(JSON.parse(document.getElementById("calcformula").value))};
					variableelem.innerText = node.Variables[i];
					base.append(variableelem);
					var appendelem = document.createElement("span");
					appendelem.classList.add("append");
					appendelem.setAttribute("path",  path + "/var:" + i);
					appendelem.onclick = function(e){document.getElementById("calccursorpos").value = e.target.getAttribute("path"); setCursor(JSON.parse(document.getElementById("calcformula").value))};
					base.append(appendelem);
				}
				break;
			case "MULTIPLY":
				for (var i in node.SubConditions) {
					if (base.childNodes.length) {
						var multiplysign = document.createElement("span");
						multiplysign.innerText = "*";
						multiplysign.classList.add("multiplysign");
						multiplysign.setAttribute("path",  path + "/sub:" + i + ":pre");
						multiplysign.onclick = function(e){document.getElementById("calccursorpos").value = e.target.getAttribute("path"); setCursor(JSON.parse(document.getElementById("calcformula").value))};
						base.append(multiplysign);
					}
					var child = document.createElement("span");
					child.classList.add("multiplybracket");
					child.classList.add("sub");
					appendCalcElem(node.SubConditions[i], child, path + "/sub:" + i);
					if (child.childNodes.length && node.SubConditions[i].Operator != "PARAM") {
						var bracketbegin = document.createElement("span");
						bracketbegin.innerText = "(";
						bracketbegin.setAttribute("path",  path + "/sub:" + i + ":pre");
						bracketbegin.onclick = function(e){document.getElementById("calccursorpos").value = e.target.getAttribute("path"); setCursor(JSON.parse(document.getElementById("calcformula").value))};
						child.prepend(bracketbegin);
						var bracketend = document.createElement("span");
						bracketend.innerText = ")";
						bracketend.setAttribute("path",  path + "/sub:" + i);
						bracketend.onclick = function(e){document.getElementById("calccursorpos").value = e.target.getAttribute("path"); setCursor(JSON.parse(document.getElementById("calcformula").value))};
						child.append(bracketend);
					}
					child.setAttribute("path",  path + "/sub:" + i);
					child.onclick = function(e){document.getElementById("calccursorpos").value = e.target.getAttribute("path"); setCursor(JSON.parse(document.getElementById("calcformula").value))};
					base.append(child);
				}
				for (var i in node.Variables) {
					if (base.childNodes.length) {
						var multiplysign = document.createElement("span");
						multiplysign.classList.add("multiplysign");
						multiplysign.innerText = "*";
						multiplysign.setAttribute("path",  path + "/var:" + i+ ":pre");
						multiplysign.onclick = function(e){document.getElementById("calccursorpos").value = e.target.getAttribute("path"); setCursor(JSON.parse(document.getElementById("calcformula").value))};
						base.append(multiplysign);
					}
					var prependelem = document.createElement("span");
					prependelem.classList.add("prepend");
					prependelem.setAttribute("path",  path + "/var:" + i);
					prependelem.onclick = function(e){document.getElementById("calccursorpos").value = e.target.getAttribute("path"); setCursor(JSON.parse(document.getElementById("calcformula").value))};
					base.append(prependelem);
					var variableelem = document.createElement("span");
					variableelem.classList.add("var");
					variableelem.classList.add("multiply");
					variableelem.innerText = node.Variables[i];
					variableelem.setAttribute("path",  path + "/var:" + i);
					variableelem.onclick = function(e){document.getElementById("calccursorpos").value = e.target.getAttribute("path"); setCursor(JSON.parse(document.getElementById("calcformula").value))};
					base.append(variableelem);
					var appendelem = document.createElement("span");
					appendelem.classList.add("append");
					appendelem.setAttribute("path",  path + "/var:" + i);
					appendelem.onclick = function(e){document.getElementById("calccursorpos").value = e.target.getAttribute("path"); setCursor(JSON.parse(document.getElementById("calcformula").value))};
					base.append(appendelem);
				}
				break;
			case "MINUS":
				var elem = document.createElement("span");
				elem.classList.add("minusbracket");
				for (var i in node.SubConditions) {
					appendCalcElem(node.SubConditios[i], elem, path + "/sub:" + i);
				}
				for (var i in node.Variables) {
					appendCalcElem(node.Variables[i], elem, path + "/sub:" + i);
				}
				base.append(elem);
				break;
			case "PARAM":
				for (var i in node.Variables) {
					var param = document.createElement("span");
					param.classList.add("param");
					param.classList.add("var");
					param.innerText = translations[node.Variables[i]];
					param.setAttribute("path",  path + "/param:" + i);
					param.onclick = function(e){document.getElementById("calccursorpos").value = e.target.getAttribute("path"); setCursor(JSON.parse(document.getElementById("calcformula").value))};
					base.append(param);
				}
				break;
		}
	}
}
function setCursor(node) {
	var cursorpath = document.getElementById("calccursorpos").value;
	var targetelement = document.getElementById("visualizedcalc");
	var prepending = false;
	for (var i in cursorpath.split("/")) {
		var address = cursorpath.split("/")[i];
		if (!address) {
			continue;
		}
		var type = address.split(":")[0];
		var index = address.split(":")[1];
		prepending = address.split(":").length > 2 && address.split(":")[2] == "pre";
		const directChildren = Array.from(targetelement.children).filter(child => child.classList.contains(type));
		targetelement = directChildren[index];
	}
	if (prepending) {
		targetelement.prepend(document.getElementById("calccursor"));
	} else {
		targetelement.append(document.getElementById("calccursor"));
	}
}

function appendCalcOperator (operator) {
	var appendingoperator = {"Operator": operator, SubConditions: null, Variables: null};
	var cursorpath = document.getElementById("calccursorpos").value;
	var formula = JSON.parse(document.getElementById("calcformula").value);
	var targetcontainer = formula;
	if (cursorpath.split("/").length>2) {
		for (var i in cursorpath.split("/").slice(cursorpath.split("/").length-2)) {
			var address = cursorpath.split("/")[i];
			if (!address) {
				continue;
			}
			var type = address.split(":")[0];
			var index = address.split(":")[1];
			if (type=="sub") {
				targetcontainer = targetcontainer.SubConditions[index];
			} else if (type == "var") {
				targetcontainer = targetcontainer.Variables[index];
			}
		}
	}
	var address = cursorpath.split("/")[cursorpath.split("/").length-1];
	var type = address.split(":")[0];
	var index = address.split(":")[1];
	var prepending = address.split(":").length > 2 && address.split(":")[2] == "pre";
	if (type == "sub") {
		targetcontainer.SubConditions.splice(index + (prepending?0:1), 0, appendingoperator);
	} else if (type == "var") { // even if the cursor is on "variable", cannot splice between variables since the appendance is SubCondition anyway. Append to the last of SubConditions
		targetcontainer.SubConditions.push(appendingoperator);
	}
	document.getElementById("calcformula").value = JSON.stringify(formula);
	visualizeFormula();
}

function editItem(ev){
	var operator = ev.target.getAttribute("operator");
	var path = ev.target.getAttribute("path");
    var jsonarea = document.getElementById("conditionLogicInput");
    var json = JSON.parse(jsonarea.value);
	var currentnode = getSubCondition(json, path);
	var finishupdating = function(){
		reloadJson(json);
	}
	if (reverselookuptype[operator]=="boolean") {
		// Will be handled as openBoolDialog() directly. Wouldn't be called
	} else if (reverselookuptype[operator]=="comp") {
	} else if (reverselookuptype[operator]=="optext") {
		openBoolDialog(ev, path, finishupdating);
	} else if (reverselookuptype[operator]=="group") {
		
	} else if (reverselookuptype[operator]=="calc") {
		
	} else if (reverselookuptype[operator]=="conv") {
		
	} else if (reverselookuptype[operator]=="extract") {
		var extractor = "wholeword", extractorval = null;
		if (currentnode.SubConditions && currentnode.SubConditions.length>0 && currentnode.SubConditions[0].Variables) {
			extractor = currentnode.SubConditions[0].Variables[0];
			if (currentnode.SubConditions[0].Variables.length > 1) {
				extractorval = currentnode.SubConditions[0].Variables[1];
			}
		}
		inputText(currentnode.Variables[0], "env", extractor, extractorval, true, false, function(dispval, val, type, exttype, extval) {
			if (exttype == "wholeword") {
				currentnode.Operator = "PARAM";
				currentnode.Variables = [val];
				currentnode.SubConditions = [];
			} else {
				currentnode.Operator = operatormap[exttype];
				currentnode.Variables = [extval];
				currentnode.SubConditions = [{"Operator": "PARAM", SubConditios: null, Variables: [val]}];
			}
			finishupdating();
		});
	} else if (reverselookuptype[operator]=="param") {
	} else if (operator=="_variable") {
		var ind = event.target.getAttribute("index");
		var current = event.target.innerText;
		inputText(current, "variable", null, null, false, true, function(dispval, val){currentnode.Variables[ind] = val;finishupdating()});
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
    reloadJson(json);
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
	try {
		// to make really sure having not difference between what is shown and the actual data, load from object not the json just made
		jsonLoader(JSON.parse(document.getElementById("conditionLogicInput").value), document.getElementById("drawingArea"));
		document.getElementById("logictotaldescription").innerHTML = summarize(JSON.parse(document.getElementById("conditionLogicInput").value));
	} catch {
		document.getElementById("logictotaldescription").innerHTML = "";
		document.getElementById("drawingArea").replaceChildren();
		var jsonerror = document.createElement("div");
		jsonerror.classList.add("jsonerror");
		jsonerror.innerText = translations["failedjsonparse"];
		document.getElementById("logictotaldescription").append(jsonerror.cloneNode(true));
		document.getElementById("drawingArea").append(jsonerror.cloneNode(true));
	}
}
function reloadJson (json){
    document.getElementById("conditionLogicInput").value = JSON.stringify(json, null, 2);
	refreshSummary();
}
function refreshRequest(){
	jsonLoader(JSON.parse(document.getElementById("sendingparamjson").value), document.getElementById("sendingParameterArea"))
}