    function boolDialogValidator (){
        const classList = document.getElementById("boolBody").classList;
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
        const operation = document.getElementById("boolBody").classList;
        const jsonarea = document.getElementById("conditionLogicInput");
        const json = JSON.parse(jsonarea.value);
        let currentnode;
        
        if (path) {
            currentnode = getSubCondition(json, path);
        } else {
            currentnode = {};
            const parentnode = getSubCondition(json, document.getElementById("boolPath").value);
            parentnode.SubConditions.push(currentnode);
        }
        
        if (document.getElementById("booltextradio").checked) {
            
            const textcomparebasevalue = document.getElementById("textcomparebasevalue").value,
            
            textcomparebaseexttype = document.getElementById("textcomparebaseexttype").value,
            textcomparebaseextvalue = document.getElementById("textcomparebaseextvalue").value,
            
            textconditionselectvalue = document.getElementById("textconditionselectvalue").value,
            textconditionselectrange = document.getElementById("textconditionselectrange").value,
            textconditionselecttype = document.getElementById("textconditionselecttype").value;
            
            switch (document.getElementById("textcomparebasetype").value) {
                case "env":
                    const variables = [], compvariables = [], paramvariables = [], subconditions = [];
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
            const numericcomparebasevalue = document.getElementById("numericcomparebase").value,
                numericcompareoperator = document.getElementById("numericcompareoperator").value,
                numericcomparetarget = document.getElementById("numericcomparetarget").value;
            currentnode["Operator"] = operatormap[numericcompareoperator];
            currentnode["SubConditions"] = [JSON.parse(numericcomparebasevalue), JSON.parse(numericcomparetarget)];
        } else if (document.getElementById("boolconditionradio").checked) {
            currentnode["Operator"] = document.getElementById("boolcondition").value;
            currentnode["Variables"] = [];
            currentnode["SubConditions"] = [];
        }

        document.getElementById("boolModal").style["display"] = "none";
        reloadJson(json);
    }
    function inputText(currentvalue, currenttype, currentextractor, currentextractorval, includeenv, includeenter, callback, validator){
        document.getElementById("textBody").className = "";
        document.getElementById("textBody").classList.add("modal-body");
        document.getElementById("textBody").classList.add("textselection");
        document.getElementById("textenvradio").checked = currenttype == "env";
        document.getElementById("textEnvSelect").value = currenttype == "env" ? currentvalue : "event_message";
        document.getElementById("textenterradio").checked = currenttype == "variable";
        document.getElementById("textEnter").value = currenttype == "variable" ? currentvalue : "";
        document.getElementById("textValidator").value = validator ?? "";

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
            let dispval,val,type,exttype,extval;
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
        let dispval = translations["generic-notset"];
        switch (tasktype) {
            case "extract":
                switch (operationtype) {
                    case "regex_extract":
                        dispval = translations["textextract-regex"].replace("{0}", translations[values[0]]).replace("{1}", values[1]);
                        break;
                    case "substring":
                        const range_from = values[1], range_to = values[2];
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
                const val = values[0] ? values[0] : translations["textcondition-missingvalue"];
                switch (operationtype){
                    case "equals":
                        dispval = translations["textcondition-equals"].replace("{0}", val);
                        break;
                    case "includes":
                        const range_includes_from = values[1], range_includes_to = values[2];
                        if (!range_includes_from && !range_includes_to) {
                            dispval = translations["textcondition-one"].replace("{0}", val);
                        } else if (range_includes_from && !range_includes_to) {
                            dispval = translations["textcondition-rangefrom"].replace("{0}", val).replace("{1}", range_includes_from);
                        } else if (!range_includes_from && range_includes_to) {
                            dispval = translations["textcondition-rangeto"].replace("{0}", val).replace("{1}", range_includes_to);
                        } else if (range_includes_from && range_includes_to) {
                            dispval = translations["textcondition-rangefromto"].replace("{0}", val).replace("{1}", range_includes_from).replace("{2}", range_includes_to);
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
        let valid = false;
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
            if (document.getElementById("textValidator").value) {
                valid &&= document.getElementById("textEnter").value.match(document.getElementById("textValidator").value);
            }
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
            let dispval, type, range, val;
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
        document.getElementById("calcformula").value = currentformula;
        document.getElementById("calccursorpos").value = "/";
        try {
            const formula = JSON.parse(currentformula);
            visualizeFormula(formula);
        } catch {
            visualizeFormula({});
        }
        document.getElementById("numModal").style["display"] = "block";
        numDialogValidator();
        document.getElementById("numModalButton").onclick = function(){
            callback(document.getElementById("calcformula").value, document.getElementById("calcdisplay").innerText);
            document.getElementById("numModal").style["display"] = "none";
        }
    }

    function numDialogValidator(formula){
        if (!formula) {
            const current = document.getElementById("calcformula").value;
            try {
                formula = JSON.parse(current);
                document.getElementById("numModalButton").disabled= checkNumValid(formula) ? "" : "disabled";
            } catch {
                document.getElementById("numModalButton").disabled="disabled";
            }
        }
    }

    function checkNumValid (formula) {
        if ((!formula.SubConditions || !formula.SubConditions.length) && (!formula.Variables || !formula.Variables.length)){
            return false;
        }
        if (calcoperators.includes(formula.Operator) && (formula.SubConditions ? formula.SubConditions.length : 0 + formula.Variables ? formula.Variables.length : 0) < 2) {
            return false;
        }
        let subcheck = true;
        for (const i in formula.SubConditions) {
            subcheck &&= checkNumValid(formula.SubConditions[i]);
        }
        return subcheck;
    }

    function visualizeFormula(val){
        const current = document.getElementById("calcformula").value;
        let formula;
        try {
            formula = JSON.parse(current);
        } catch {
            formula = {};
        }
        document.getElementById("visualizedcalc").after(document.getElementById("calccursor"));
        document.getElementById("visualizedcalc").replaceChildren();
        appendCalcElem(formula, document.getElementById("visualizedcalc"), "");
        document.getElementById("calcdisplay").innerText = document.getElementById("visualizedcalc").innerText;
        const insertTopPlaceHolder = document.createElement("span");
        insertTopPlaceHolder.innerHTML = "&nbsp;";
        insertTopPlaceHolder.style["display"] = "inline-block";
        insertTopPlaceHolder.style["width"] = "0.3rem";
        insertTopPlaceHolder.style["height"] = "1.5rem";
        insertTopPlaceHolder.onclick = function(e){document.getElementById("calccursorpos").value = "/sub:0:pre"; setCursor(JSON.parse(document.getElementById("calcformula").value))};
        document.getElementById("visualizedcalc").prepend(insertTopPlaceHolder);
        setCursor(formula);
    }

    function updateCursor(e){
        document.getElementById("calccursorpos").value = e.target.getAttribute("path");
        setCursor(JSON.parse(document.getElementById("calcformula").value));
        event.stopPropagation();
    }

    function fillPlaceHolder(e) {
        document.getElementById("calccursorpos").value = e.target.getAttribute("path");
        appendCalcValue();
        event.stopPropagation();
    }

    function appendCalcElem(node, base, path) {
        if (node) {
            switch(node.Operator) {
                case "ADD":
                    for (const i in node.SubConditions) {
                        if (base.childNodes.length) {
                            const plussign = document.createElement("span");
                            plussign.innerText = "＋";
                            plussign.setAttribute("path",  path + "/sub:" + i + ":pre");
                            plussign.onclick = updateCursor;
                            plussign.classList.add("plussign");
                            base.append(plussign);
                        }
                        const child = document.createElement("span");
                        child.classList.add("sub");
                        if (node.SubConditions[i].SubConditions && node.SubConditions[i].SubConditions.length > 1) {
                            child.classList.add("plusbracket");
                        }
                        child.setAttribute("path",  path + "/sub:" + i);
                        child.onclick = updateCursor;
                        appendCalcElem(node.SubConditions[i], child, path + "/sub:" + i);
                        base.append(child);
                    }
                    for (const i in node.Variables) {
                        if (base.childNodes.length) {
                            const plussign = document.createElement("span");
                            plussign.classList.add("plussign");
                            plussign.setAttribute("path",  path + "/const:" + i + ":pre");
                            plussign.onclick = updateCursor;
                            plussign.innerText = "＋";
                            base.append(plussign);
                        }
                        const prependelem = document.createElement("span");
                        prependelem.setAttribute("path",  path + "/const:" + i);
                        prependelem.onclick = updateCursor;
                        prependelem.classList.add("prepend");
                        base.append(prependelem);
                        const variableelem = document.createElement("span");
                        variableelem.classList.add("const");
                        variableelem.classList.add("add");
                        variableelem.setAttribute("path",  path + "/const:" + i);
                        variableelem.onclick = updateCursor;
                        variableelem.innerText = node.Variables[i];
                        base.append(variableelem);
                        const appendelem = document.createElement("span");
                        appendelem.classList.add("append");
                        appendelem.setAttribute("path",  path + "/const:" + i);
                        appendelem.onclick = updateCursor;
                        base.append(appendelem);
                    }
                    if ((!node.SubConditions || node.SubConditions.length < 2) && (!node.Variables || node.Variables.length < 2)) {
                        if ((!node.SubConditions || node.SubConditions.length < 1) && (!node.Variables || node.Variables.length < 1)){
                            const placeholder = document.createElement("span");
                            placeholder.classList.add("placeholder");
                            placeholder.innerText = translations["calc-missingvalue"];
                            placeholder.setAttribute("path",  path + "/placeholder:0");
                            placeholder.onclick = fillPlaceHolder;
                            base.append(placeholder);
                        }
                        if (path != "") {
                            const plussign = document.createElement("span");
                            plussign.innerText = "＋";
                            base.append(plussign);
                            const placeholder = document.createElement("span");
                            placeholder.classList.add("placeholder");
                            placeholder.innerText = translations["calc-missingvalue"];
                            placeholder.setAttribute("path",  path + "/placeholder:0");
                            placeholder.onclick = fillPlaceHolder;
                            base.append(placeholder);
                        }
                    }
                    break;
                case "MULTIPLY":
                    for (const i in node.SubConditions) {
                        if (base.childNodes.length) {
                            const multiplysign = document.createElement("span");
                            multiplysign.innerText = "×";
                            multiplysign.setAttribute("path",  path + "/sub:" + i + ":pre");
                            multiplysign.onclick = updateCursor;
                            multiplysign.classList.add("multiplysign");
                            base.append(multiplysign);
                        }
                        const child = document.createElement("span");
                        if (node.SubConditions[i].SubConditions && node.SubConditions[i].SubConditions.length > 1) {
                            child.classList.add("multiplybracket");
                        }
                        child.classList.add("sub");
                        appendCalcElem(node.SubConditions[i], child, path + "/sub:" + i);
                        if (child.childNodes.length && node.SubConditions[i].Operator != "PARAM" && node.SubConditions[i].Operator != "PARSEINT") {
                            const bracketbegin = document.createElement("span");
                            bracketbegin.innerText = "(";
                            bracketbegin.setAttribute("path",  path + "/sub:" + i + ":pre");
                            bracketbegin.onclick = updateCursor;
                            child.prepend(bracketbegin);
                            const bracketend = document.createElement("span");
                            bracketend.innerText = ")";
                            bracketend.setAttribute("path",  path + "/sub:" + i);
                            bracketend.onclick = updateCursor;
                            child.append(bracketend);
                        }
                        child.setAttribute("path",  path + "/sub:" + i);
                        child.onclick = updateCursor;
                        base.append(child);
                    }
                    for (const i in node.Variables) {
                        if (base.childNodes.length) {
                            const multiplysign = document.createElement("span");
                            multiplysign.classList.add("multiplysign");
                            multiplysign.setAttribute("path",  path + "/const:" + i + ":pre");
                            multiplysign.onclick = updateCursor;
                            multiplysign.innerText = "×";
                            base.append(multiplysign);
                        }
                        const prependelem = document.createElement("span");
                        prependelem.setAttribute("path",  path + "/const:" + i);
                        prependelem.onclick = updateCursor;
                        prependelem.classList.add("prepend");
                        base.append(prependelem);
                        const variableelem = document.createElement("span");
                        variableelem.classList.add("const");
                        variableelem.classList.add("multiply");
                        variableelem.setAttribute("path",  path + "/const:" + i);
                        variableelem.onclick = updateCursor;
                        variableelem.innerText = node.Variables[i];
                        base.append(variableelem);
                        const appendelem = document.createElement("span");
                        appendelem.classList.add("append");
                        appendelem.setAttribute("path",  path + "/const:" + i);
                        appendelem.onclick = updateCursor;
                        base.append(appendelem);
                    }
                    if ((!node.SubConditions || node.SubConditions.length < 2) && (!node.Variables || node.Variables.length < 2)) {
                        if ((!node.SubConditions || node.SubConditions.length < 1) && (!node.Variables || node.Variables.length < 1)){
                            const placeholder = document.createElement("span");
                            placeholder.classList.add("placeholder");
                            placeholder.innerText = translations["calc-missingvalue"];
                            placeholder.setAttribute("path",  path + "/placeholder:0");
                            placeholder.onclick = fillPlaceHolder;
                            base.append(placeholder);
                        }
                        const multiplysign = document.createElement("span");
                        multiplysign.innerText = "×";
                        base.append(multiplysign);
                        const placeholder = document.createElement("span");
                        placeholder.classList.add("placeholder");
                        placeholder.innerText = translations["calc-missingvalue"];
                        placeholder.setAttribute("path",  path + "/placeholder:0");
                        placeholder.onclick = fillPlaceHolder;
                        base.append(placeholder);
                    }
                    break;
                case "SUBTRACT":
                    for (const i in node.SubConditions) {
                        if (base.childNodes.length) {
                            const minussign = document.createElement("span");
                            minussign.innerText = "－";
                            minussign.setAttribute("path",  path + "/sub:" + i + ":pre");
                            minussign.onclick = updateCursor;
                            minussign.classList.add("minussign");
                            base.append(minussign);
                        }
                        const child = document.createElement("span");
                        child.classList.add("sub");
                        if (node.SubConditions[i].SubConditions && node.SubConditions[i].SubConditions.length > 1) {
                            child.classList.add("minusbracket");
                        }
                        child.setAttribute("path",  path + "/sub:" + i);
                        child.onclick = updateCursor;
                        appendCalcElem(node.SubConditions[i], child, path + "/sub:" + i);
                        base.append(child);
                    }
                    for (const i in node.Variables) {
                        if (base.childNodes.length) {
                            const minussign = document.createElement("span");
                            minussign.classList.add("minussign");
                            minussign.setAttribute("path",  path + "/const:" + i + ":pre");
                            minussign.onclick = updateCursor;
                            minussign.innerText = "－";
                            base.append(minussign);
                        }
                        const prependelem = document.createElement("span");
                        prependelem.setAttribute("path",  path + "/const:" + i);
                        prependelem.onclick = updateCursor;
                        prependelem.classList.add("prepend");
                        base.append(prependelem);
                        const variableelem = document.createElement("span");
                        variableelem.classList.add("const");
                        variableelem.classList.add("subtract");
                        variableelem.setAttribute("path",  path + "/const:" + i);
                        variableelem.onclick = updateCursor;
                        variableelem.innerText = node.Variables[i];
                        base.append(variableelem);
                        const appendelem = document.createElement("span");
                        appendelem.classList.add("append");
                        appendelem.setAttribute("path",  path + "/const:" + i);
                        appendelem.onclick = updateCursor;
                        base.append(appendelem);
                    }
                    if ((!node.SubConditions || node.SubConditions.length < 2) && (!node.Variables || node.Variables.length < 2)) {
                        if ((!node.SubConditions || node.SubConditions.length < 1) && (!node.Variables || node.Variables.length < 1)){
                            const placeholder = document.createElement("span");
                            placeholder.classList.add("placeholder");
                            placeholder.innerText = translations["calc-missingvalue"];
                            placeholder.setAttribute("path",  path + "/placeholder:0");
                            placeholder.onclick = fillPlaceHolder;
                            base.append(placeholder);
                        }
                        const minussign = document.createElement("span");
                        minussign.innerText = "－";
                        base.append(minussign);
                        const placeholder = document.createElement("span");
                        placeholder.classList.add("placeholder");
                        placeholder.innerText = translations["calc-missingvalue"];
                        placeholder.setAttribute("path",  path + "/placeholder:0");
                        placeholder.onclick = fillPlaceHolder;
                        base.append(placeholder);
                    }
                    break;
                case "DIVIDE":
                    for (const i in node.SubConditions) {
                        if (base.childNodes.length) {
                            const divisionsign = document.createElement("span");
                            divisionsign.innerText = "÷";
                            divisionsign.setAttribute("path",  path + "/sub:" + i + ":pre");
                            divisionsign.onclick = updateCursor;
                            divisionsign.classList.add("divisionsign");
                            base.append(divisionsign);
                        }
                        const child = document.createElement("span");
                        if (node.SubConditions[i].SubConditions && node.SubConditions[i].SubConditions.length > 1) {
                            child.classList.add("divisionbracket");
                        }
                        child.classList.add("sub");
                        appendCalcElem(node.SubConditions[i], child, path + "/sub:" + i);
                        if (child.childNodes.length && node.SubConditions[i].Operator != "PARAM" && node.SubConditions[i].Operator != "PARSEINT") {
                            const bracketbegin = document.createElement("span");
                            bracketbegin.innerText = "(";
                            bracketbegin.setAttribute("path",  path + "/sub:" + i + ":pre");
                            bracketbegin.onclick = updateCursor;
                            child.prepend(bracketbegin);
                            const bracketend = document.createElement("span");
                            bracketend.innerText = ")";
                            bracketend.setAttribute("path",  path + "/sub:" + i);
                            bracketend.onclick = updateCursor;
                            child.append(bracketend);
                        }
                        child.setAttribute("path",  path + "/sub:" + i);
                        child.onclick = updateCursor;
                        base.append(child);
                    }
                    for (const i in node.Variables) {
                        if (base.childNodes.length) {
                            const divisionsign = document.createElement("span");
                            divisionsign.classList.add("divisionsign");
                            divisionsign.setAttribute("path",  path + "/const:" + i + ":pre");
                            divisionsign.onclick = updateCursor;
                            divisionsign.innerText = "÷";
                            base.append(divisionsign);
                        }
                        const prependelem = document.createElement("span");
                        prependelem.setAttribute("path",  path + "/const:" + i);
                        prependelem.onclick = updateCursor;
                        prependelem.classList.add("prepend");
                        base.append(prependelem);
                        const variableelem = document.createElement("span");
                        variableelem.classList.add("const");
                        variableelem.classList.add("division");
                        variableelem.setAttribute("path",  path + "/const:" + i);
                        variableelem.onclick = updateCursor;
                        variableelem.innerText = node.Variables[i];
                        base.append(variableelem);
                        const appendelem = document.createElement("span");
                        appendelem.classList.add("append");
                        appendelem.setAttribute("path",  path + "/const:" + i);
                        appendelem.onclick = updateCursor;
                        base.append(appendelem);
                    }
                    if ((!node.SubConditions || node.SubConditions.length < 2) && (!node.Variables || node.Variables.length < 2)) {
                        if ((!node.SubConditions || node.SubConditions.length < 1) && (!node.Variables || node.Variables.length < 1)){
                            const placeholder = document.createElement("span");
                            placeholder.classList.add("placeholder");
                            placeholder.innerText = translations["calc-missingvalue"];
                            placeholder.setAttribute("path",  path + "/placeholder:0");
                            placeholder.onclick = fillPlaceHolder;
                            base.append(placeholder);
                        }
                        const divisionsign = document.createElement("span");
                        divisionsign.innerText = "÷";
                        base.append(divisionsign);
                        const placeholder = document.createElement("span");
                        placeholder.classList.add("placeholder");
                        placeholder.innerText = translations["calc-missingvalue"];
                        placeholder.setAttribute("path",  path + "/placeholder:0");
                        placeholder.onclick = fillPlaceHolder;
                        base.append(placeholder);
                    }
                    break;
                case "MODULO":
                    const items_modulo = [];
                    for (const i in node.SubConditions) {
                        const child = document.createElement("span");
                        if (node.SubConditions[i].SubConditions && node.SubConditions[i].SubConditions.length > 1) {
                            child.classList.add("modulobracket");
                        }
                        child.classList.add("sub");
                        appendCalcElem(node.SubConditions[i], child, path + "/sub:" + i);
                        if (child.childNodes.length && node.SubConditions[i].Operator != "PARAM" && node.SubConditions[i].Operator != "PARSEINT") {
                            const bracketbegin = document.createElement("span");
                            bracketbegin.innerText = "(";
                            bracketbegin.setAttribute("path",  path + "/sub:" + i + ":pre");
                            bracketbegin.onclick = updateCursor;
                            child.prepend(bracketbegin);
                            const bracketend = document.createElement("span");
                            bracketend.innerText = ")";
                            bracketend.setAttribute("path",  path + "/sub:" + i);
                            bracketend.onclick = updateCursor;
                            child.append(bracketend);
                        }
                        child.setAttribute("path",  path + "/sub:" + i);
                        child.onclick = updateCursor;
                        items_modulo.push(child);
                    }
                    for (const i in node.Variables) {
                        const variableelem = document.createElement("span");
                        variableelem.classList.add("const");
                        variableelem.classList.add("modulo");
                        variableelem.setAttribute("path",  path + "/const:" + i);
                        variableelem.onclick = updateCursor;
                        variableelem.innerText = node.Variables[i];
                        items_modulo.push(variableelem);
                    }
                    if ((!node.SubConditions || node.SubConditions.length < 2) && (!node.Variables || node.Variables.length < 2)) {
                        if ((!node.SubConditions || node.SubConditions.length < 1) && (!node.Variables || node.Variables.length < 1)){
                            const placeholder = document.createElement("span");
                            placeholder.classList.add("placeholder");
                            placeholder.innerText = translations["calc-missingvalue"];
                            placeholder.setAttribute("path",  path + "/placeholder:0");
                            placeholder.onclick = fillPlaceHolder;
                            items_modulo.push(placeholder);
                        }
                        const placeholder = document.createElement("span");
                        placeholder.classList.add("placeholder");
                        placeholder.innerText = translations["calc-missingvalue"];
                        placeholder.setAttribute("path",  path + "/placeholder:0");
                        placeholder.onclick = fillPlaceHolder;
                        items_modulo.push(placeholder);
                    }
                    const modulosentense = document.createElement("span");
                    modulosentense.classList.add("modulobracket", "sub");
                    modulosentense.innerHTML = translations["modulo-sentense"].replace("{0}", '<span></span>').replace("{1}", '<span></span>');
                    base.append(modulosentense);
                    const span1 = modulosentense.children[0];
                    const span2 = modulosentense.children[1];
                    span1.replaceWith(items_modulo[0]);
                    const dividedby = document.createElement("span");
                    for(const i in items_modulo.slice(1)) {
                        dividedby.append(items_modulo.slice(1)[i]);
                    }
                    span2.replaceWith(dividedby);
                    break;
                case "PARAM":
                    for (const i in node.Variables) {
                        const param = document.createElement("span");
                        param.classList.add("param");
                        param.classList.add("const");
                        param.innerText = translations[node.Variables[i]];
                        param.setAttribute("path",  path + "/param:" + i);
                        param.onclick = updateCursor;
                        base.append(param);
                    }
                    break;
                case "PARSEINT":
                    const items_parseint = [];
                    for (const i in node.SubConditions) {
                        items_parseint.push(summarize(node.SubConditions[i]));
                    }
                    for (const i in node.Variables) {
                        items_parseint.push(node.Variables[i]);
                    }
                    const param = document.createElement("span");
                    param.classList.add("parseint");
                    param.innerHTML = translations["translations-value"].replace("{0}", items_parseint.join(translations["valueof-joint"]));
                    param.setAttribute("path",  path);
                    param.onclick = updateCursor;
                    base.append(param);
                    break;
            }
        }
    }
    function setCursor(node) {
        const cursorpath = document.getElementById("calccursorpos").value;
        let targetelement = document.getElementById("visualizedcalc");
        let prepending = false;
        for (const i in cursorpath.split("/")) {
            const address = cursorpath.split("/")[i];
            if (!address) {
                continue;
            }
            const type = address.split(":")[0];
            const index = address.split(":")[1];
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
    function appendItemToFormula (elem) {
        const cursorpath = document.getElementById("calccursorpos").value;
        const formula = JSON.parse(document.getElementById("calcformula").value?document.getElementById("calcformula").value:'{"Operator": "ADD", "SubConditions":null, "Variables": null}');
        let targetcontainer = formula;
        if (cursorpath.split("/").length>2) {
            for (const i in cursorpath.split("/").slice(0, cursorpath.split("/").length-1)) {
                const address = cursorpath.split("/")[i];
                if (!address) {
                    continue;
                }
                const type = address.split(":")[0];
                const index = address.split(":")[1];
                if (type=="sub" || type == "placeholder") {
                    targetcontainer = targetcontainer.SubConditions[index];
                } else if (type == "const") {
                    targetcontainer = targetcontainer.Variables[index];
                }
            }
        }
        const address = cursorpath.split("/")[cursorpath.split("/").length-1];
        const type = address.split(":")[0];
        const index = address.split(":")[1];
        const prepending = address.split(":").length > 2 && address.split(":")[2] == "pre";
        if (cursorpath.length < 2) {
            targetcontainer.SubConditions = [elem];
        }
        if (type == "sub") {
            if (targetcontainer.SubConditions) {
                targetcontainer.SubConditions.splice(index + (prepending?0:1), 0, elem);
            } else {
                targetcontainer.SubConditions = [elem];
            }
        } else if (type == "const" || type == "param") { // even if the cursor is on "variable", cannot splice between variables since the appendance is SubCondition anyway. Append to the last of SubConditions
            if (targetcontainer.SubConditions) {
                targetcontainer.SubConditions.push(elem);
            } else {
                targetcontainer.SubConditions = [elem];
            }
        } else if (type == "placeholder") {
            if (targetcontainer.SubConditions) {
                targetcontainer.SubConditions.push(elem);
            } else {
                targetcontainer.SubConditions = [elem];
            }
            document.getElementById("calccursorpos").value = document.getElementById("calccursorpos").value.replace("placeholder", "sub");
        }
        document.getElementById("calcformula").value = JSON.stringify(formula);
        visualizeFormula();
        document.getElementById("calccursorpos").value = document.getElementById("calccursorpos").value.replace("placeholder", "sub");
        numDialogValidator();
    }
    function appendCalcOperator (operatortype) {
        appendItemToFormula({"Operator": operatortype, SubConditions: null, Variables: null});
    }

    function appendCalcValue () {
        inputText(null, null, null, null, true, true, function(dispval, val, type, exttype, extval){
            let appendnode;
            if (type == "env") {
                if (exttype && exttype != "wholeword" && extval) {
                    appendnode = {"Operator": "PARSEINT", "SubConditions": [{"Operator": operatormap[exttype], "SubConditions": [{"Operator": "PARAM", "SubConditions": null, "Variables": [val]}], "Variables": [extval]}], "Variables": null };
                } else {
                    appendnode = {"Operator": "PARSEINT", "SubConditions": [{"Operator": "PARAM", "SubConditions": null, "Variables": [val]}], "Variables": null };
                }
            } else if (type == "variable") {
                appendnode = {"Operator": "PARSEINT", "SubConditions": null, "Variables": [val]};
            }
            if (appendnode) {
                appendItemToFormula(appendnode);
            }
        }, "^[0-9]+(\\.[0-9]+)?$");
    }

    function editItem(ev){
        const operator = ev.target.getAttribute("operator");
        const path = ev.target.getAttribute("path");
        const jsonarea = document.getElementById("conditionLogicInput");
        const json = JSON.parse(jsonarea.value);
        const currentnode = getSubCondition(json, path);
        const finishupdating = function(){
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
            const extractor = "wholeword", extractorval = null;
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
            const ind = event.target.getAttribute("index");
            const current = event.target.innerText;
            inputText(current, "variable", null, null, false, true, function(dispval, val){currentnode.Variables[ind] = val;finishupdating()});
        }

        refreshSummary();
    }
    function deleteItem(){
        const operator = event.target.getAttribute("operator");
        const paths = event.target.getAttribute("path").split("/");
        const jsonarea = document.getElementById("conditionLogicInput");
        const json = JSON.parse(jsonarea.value);
        let parentnode = json;
        let currentnode = json;
        
        for (const i in paths.slice(1)){
            parentnode = currentnode;
            currentnode = currentnode.SubConditions[paths.slice(1)[i]];
        }
        parentnode.SubConditions.splice(parentnode.SubConditions.indexOf(currentnode), 1);
        reloadJson(json);
    }
    function getSubCondition(json, pathstring) {
        const paths = pathstring.split("/");
        let currentnode = json;
        for (const i in paths.slice(1)){ // top node (0) is the base. not included in json
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
            const jsonerror = document.createElement("div");
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


    Object.assign(window, { jsonLoader, summarize, openBoolDialog, boolDialogValidator, editBoolItem, inputText, generageDisplayText, textDialogValidator, inputTextCondition, textConditionDialogValidator, inputNumber, numDialogValidator, checkNumValid, visualizeFormula, updateCursor, fillPlaceHolder, appendCalcElem, setCursor, appendItemToFormula, appendCalcOperator, appendCalcValue, editItem, deleteItem, getSubCondition, refreshSummary, reloadJson, refreshRequest });
    Promise.all([window.ChannelsSidebar.init(), refreshSummary(), refreshRequest(), visualizeFormula()]);
})();
