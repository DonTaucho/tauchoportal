/**
 * ConditionEditor - Reusable condition logic editor class
 * Handles JSON editing, rendering, and synchronization across multiple textarea/form elements
 * 
 * Matches the behavior of the original jsonLoader and summarize functions,
 * now in a class-based reusable format that works with any textarea element.
 */
class ConditionEditor {
    constructor(conditionInputElement, options = {}) {
        // Validation
        if (!conditionInputElement) {
            throw new Error('conditionInputElement is required');
        }
        if (typeof conditionInputElement === 'string') {
            conditionInputElement = document.getElementById(conditionInputElement);
        }
        if (!conditionInputElement) {
            throw new Error('conditionInputElement not found in DOM');
        }

        this.conditionInput = conditionInputElement;
        this.baseType = options.baseType || 'OR';
        this.drawingArea = options.drawingArea || document.getElementById('drawingArea');
        this.logicDescriptionArea = options.logicDescriptionArea || document.getElementById('logictotaldescription');
        try{
            const parsedValue = JSON.parse(this.conditionInput.value);
            if (!parsedValue.Operator) {
                this.conditionInput.value = JSON.stringify({ "Operator": this.baseType, "SubConditions": parsedValue.Subconditions, "Variables": parsedValue.Variables }, null, 2);
            }
        } catch {
            this.conditionInput.value = JSON.stringify({ "Operator": this.baseType, "SubConditions": [], "Variables": [] }, null, 2);
        }

        // Store reference to operator/naming maps
        this.extractionoperators = ["PARAM"];
        this.booleanoperators = ["AND", "OR", "NOT", "SOME"];
        this.compoperators = ["EQUIVALENT", "GREATER_THAN", "GREATER_OR_EQUAL", "LESS_THAN", "LESS_OR_EQUAL"];
        this.textoperators = ["EQUALS", "INCLUDES", "REGEX_MATCH"];
        this.textextractors = ["WHOLESENTENCE", "REGEX_EXTRACT", "SUBSTRING", "FIRST", "LAST"];
        this.groupoperators = ["COUNT", "SUM"];
        this.calcoperators = ["ADD", "SUBTRACT", "MULTIPLY", "DIVIDE", "MODULO"];
        this.convoperators = ["PARSEINT", "EXCHANGE"];

        this.namingmap = {
            "AND": "and", "OR": "or", "NOT": "not", "SOME": "some",
            "EQUIVALENT": "equivalent", "GREATER_THAN": "greater_than",
            "GREATER_OR_EQUAL": "greater_or_equal", "LESS_THAN": "less_than",
            "LESS_OR_EQUAL": "less_or_equal", "EQUALS": "equals",
            "INCLUDES": "includes", "REGEX_MATCH": "regex_match",
            "COUNT": "count", "SUM": "sum", "WHOLESENTENCE": "wholesentence",
            "REGEX_EXTRACT": "regex_extract", "SUBSTRING": "substring",
            "FIRST": "first", "LAST": "last", "ADD": "add",
            "SUBTRACT": "subtract", "MULTIPLY": "multiply",
            "DIVIDE": "divide", "MODULO": "modulo",
            "PARSEINT": "parseint", "EXCHANGE": "exchange", "PARAM": "param"
        };

        this.operatormap = {
            "and": "AND", "or": "OR", "not": "NOT", "some": "SOME",
            "equivalent": "EQUIVALENT", "greater_than": "GREATER_THAN",
            "greater_or_equal": "GREATER_OR_EQUAL", "less_than": "LESS_THAN",
            "less_or_equal": "LESS_OR_EQUAL", "equals": "EQUALS",
            "includes": "INCLUDES", "regex_match": "REGEX_MATCH",
            "count": "COUNT", "sum": "SUM", "wholesentence": "WHOLESENTENCE",
            "regex_extract": "REGEX_EXTRACT", "substring": "SUBSTRING",
            "first": "FIRST", "last": "LAST", "add": "ADD",
            "subtract": "SUBTRACT", "multiply": "MULTIPLY",
            "divide": "DIVIDE", "modulo": "MODULO",
            "parseint": "PARSEINT", "exchange": "EXCHANGE", "param": "PARAM"
        };

        this.reverselookuptype = {
            "AND": "boolean", "OR": "boolean", "NOT": "boolean", "SOME": "boolean",
            "EQUIVALENT": "comp", "GREATER_THAN": "comp", "LESS_THAN": "comp",
            "EQUALS": "optext", "INCLUDES": "optext", "REGEX_MATCH": "optext",
            "COUNT": "group", "SUM": "group",
            "ADD": "calc", "SUBTRACT": "calc", "MULTIPLY": "calc",
            "DIVIDE": "calc", "MODULO": "calc",
            "PARSEINT": "conv", "EXCHANGE": "conv", "PARAM": "extract"
        };

        // Initialize boolean dialog handler
        this.boolDialog = new BoolDialogHandler(this);
        
        // Initialize text condition dialog handler
        this.textConditionDialog = new TextConditionDialogHandler(this);
        
        // Initialize numeric dialog handler
        this.numericDialog = new NumericDialogHandler(this);

        // Setup change listener to sync between textarea and drawing area
        this.conditionInput.addEventListener('change', () => this.refresh());
    }

    /**
     * Get JSON from textarea
     */
    getJSON() {
        try {
            return JSON.parse(this.conditionInput.value);
        } catch (e) {
            console.error('Failed to parse JSON from condition input:', e);
            return null;
        }
    }

    /**
     * Update JSON in textarea and refresh drawing area
     */
    setJSON(json) {
        this.conditionInput.value = JSON.stringify(json, null, 2);
        this.refresh();
    }

    /**
     * Refresh the drawing area and description from current JSON
     */
    refresh() {
        try {
            const json = this.getJSON();
            if (!json) {
                if (this.logicDescriptionArea) {
                    this.logicDescriptionArea.innerHTML = '';
                }
                if (this.drawingArea) {
                    this.drawingArea.replaceChildren();
                }
                return;
            }

            // Render drawing area - pass the area directly, matches original jsonLoader
            if (this.drawingArea) {
                this._jsonLoader(json, this.drawingArea);
            }

            // Render description
            if (this.logicDescriptionArea) {
                this.logicDescriptionArea.innerHTML = this._summarize(json) || '';
            }
        } catch (e) {
            console.error('Error refreshing condition editor:', e);
            if (this.logicDescriptionArea) {
                this.logicDescriptionArea.innerHTML = '<div class="jsonerror">' + (translations?.failedjsonparse || 'Failed to parse JSON') + '</div>';
            }
            if (this.drawingArea) {
                this.drawingArea.replaceChildren();
                const jsonerror = document.createElement("div");
                jsonerror.classList.add("jsonerror");
                jsonerror.innerText = translations?.failedjsonparse || 'Failed to parse JSON';
                this.drawingArea.append(jsonerror);
            }
        }
    }

    /**
     * Render JSON node into DOM area - matches original jsonLoader behavior
     * @private
     */
    _jsonLoader(jsonnode, area, path = "0") {
        path = path ?? "0";
        const operator = jsonnode.Operator;
        area.replaceChildren();

        const legendtag = document.createElement("legend");
        legendtag.innerText = translations[jsonnode.Operator] || jsonnode.Operator;
        area.appendChild(legendtag);

        const editarea = document.createElement("div");
        editarea.classList.add("icons");

        const edittag = document.createElement("a");
        edittag.classList.add("edit");
        edittag.innerText = "✏️";
        edittag.setAttribute("path", path);
        edittag.setAttribute("operator", jsonnode.Operator);
        edittag.onclick = (e) => this._editItem(e);
        editarea.appendChild(edittag);

        const removetag = document.createElement("a");
        removetag.classList.add("remove");
        removetag.innerText = "🗑️";
        removetag.setAttribute("path", path);
        removetag.setAttribute("operator", jsonnode.Operator);
        removetag.onclick = (e) => this._deleteItem(e);
        editarea.appendChild(removetag);
        area.appendChild(editarea);

        if (jsonnode.SubConditions || jsonnode.Variables) {
            area.classList.add(this.namingmap[jsonnode.Operator]);

            if (operator == "SOME") {
                const somefield = document.createElement("div");
                const prefix = document.createElement("span");
                prefix.innerText = translations["some-sentense_prefix"] || "Some";
                somefield.append(prefix);
                const frombutton = document.createElement("input");
                frombutton.type = "number";
                frombutton.inputmode = "numeric";
                frombutton.min = 1;
                frombutton.max = 999;
                frombutton.pattern = "[0-9]*";
                frombutton.classList.add("numerictext");
                frombutton.style["display"] = "inline-block";
                frombutton.setAttribute("path", path);
                frombutton.value = jsonnode.Variables && jsonnode.Variables.length > 0 ? jsonnode.Variables[0].split("-")[0] : "";
                somefield.append(frombutton);
                const joint = document.createElement("span");
                joint.innerText = translations["some-sentense_joint"] || "to";
                somefield.append(joint);
                const tobutton = document.createElement("input");
                tobutton.type = "number";
                tobutton.inputmode = "numeric";
                tobutton.min = 1;
                tobutton.max = 999;
                tobutton.pattern = "[0-9]*";
                tobutton.classList.add("numerictext");
                tobutton.style["display"] = "inline-block";
                tobutton.value = jsonnode.Variables && jsonnode.Variables.length > 0 && jsonnode.Variables[0].indexOf("-") ? jsonnode.Variables[0].split("-")[1] : "";
                somefield.append(tobutton);
                const suffix = document.createElement("span");
                suffix.innerText = translations["some-sentense_suffix"] || "conditions";
                somefield.append(suffix);
                area.append(somefield);
            }

            // Only for non-top-level (has "/"), show summary
            if (path.split("/").length > 1) {
                const summarized = document.createElement("div");
                summarized.classList.add("summary");
                if (jsonnode.SubConditions) {
                    summarized.innerHTML = this._summarize(jsonnode);
                }
                area.appendChild(summarized);
            }

            const detailarea = document.createElement("div");
            detailarea.classList.add("detailarea");
            if (jsonnode.SubConditions && jsonnode.SubConditions.length) {
                const subconarea = document.createElement("div");
                subconarea.classList.add("subcondition");
                for (const is in jsonnode.SubConditions) {
                    const childarea = document.createElement("fieldset");
                    childarea.classList.add("item");
                    childarea.onclick = function () { this.classList.toggle("focus") }
                    this._jsonLoader(jsonnode.SubConditions[is], childarea, path + "/" + is);
                    subconarea.append(childarea);
                }
                detailarea.appendChild(subconarea);
            }
            if (jsonnode.Variables) {
                for (const iv in jsonnode.Variables) {
                    const variableitem = document.createElement("div");
                    variableitem.classList.add("variable");
                    variableitem.innerText = jsonnode.Variables[iv];
                    if (jsonnode.Operator != "PARAM") {
                        variableitem.setAttribute("operator", "_variable");
                        variableitem.setAttribute("path", path);
                        variableitem.setAttribute("index", iv);
                        variableitem.onclick = (e) => this._editItem(e);
                    }
                    detailarea.appendChild(variableitem);
                }
            }
            area.appendChild(detailarea);

            if (this.booleanoperators.includes(operator)) {
                if (operator != "NOT" || !jsonnode.SubConditions || jsonnode.SubConditions.length < 1) {
                    const addbutton = document.createElement("div");
                    addbutton.classList.add("addbutton");
                    addbutton.innerText = "+";
                    addbutton.setAttribute("path", path);
                    addbutton.setAttribute("operator", operator);
                    addbutton.onclick = (e) => this.boolDialog.open(e);
                    area.append(addbutton);
                }
            } else if (this.compoperators.includes(operator) && (
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
            } else if (this.textoperators.includes(operator)) {
                if (!jsonnode.SubConditions || jsonnode.SubConditions.length < 1) {
                    var askenvbutton = document.createElement("div");
                    askenvbutton.classList.add("askenvbutton");
                    askenvbutton.innerText = "+";
                    askenvbutton.setAttribute("path", path);
                    askenvbutton.setAttribute("operator", operator);
                    askenvbutton.onclick = function(){inputText(null, null, null, null, true, false, function(disp, type){
                        var parentjson = JSON.parse(document.getElementById("conditionLogicInput").value);
                        var currentnode = this._getSubCondition(parentjson, path);
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
            } else if (this.calcoperators.includes(operator)) {
                var inputnumbutton = document.createElement("div");
                inputnumbutton.classList.add("asknumbutton");
                inputnumbutton.innerText = "+";
                inputnumbutton.setAttribute("path", path);
                inputnumbutton.setAttribute("operator", operator);
                inputnumbutton.onclick = inputNumber;
                area.append(inputnumbutton);
            } else if (this.textextractors.includes(operator)) {
            
            } else if ((this.extractionoperators.includes(operator) ||
                this.textoperators.includes(operator) ||
                this.convoperators.includes(operator))
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
        } else {
            const addtoemptybutton = document.createElement("div");
            addtoemptybutton.classList.add("addbutton");
            addtoemptybutton.innerText = "+";
            addtoemptybutton.setAttribute("path", path);
            addtoemptybutton.setAttribute("operator", operator);
            addtoemptybutton.onclick = (e) => this.boolDialog.open(e);
            area.append(addtoemptybutton);
        }
    }

    /**
     * Summarize JSON node into human-readable format - matches original summarize behavior
     * @private
     */
    _summarize(node) {
        if (!node) return null;

        switch (node.Operator) {
            case "AND":
                const items_and = [];
                if (node.SubConditions) {
                    for (const i in node.SubConditions) {
                        items_and.push("<span class='or'>" + this._summarize(node.SubConditions[i]) + "</span>");
                    }
                }
                if (items_and.length) {
                    return items_and.join(translations["and-joint"]);
                } else {
                    return translations["and-notset"];
                }
                break;
            case "OR":
                const items_or = [];
                if (node.SubConditions) {
                    for (const i in node.SubConditions) {
                        items_or.push("<span class='or'>" + this._summarize(node.SubConditions[i]) + "</span>");
                    }
                }
                if (items_or.length) {
                    return items_or.join(translations["or-joint"]);
                } else {
                    return translations["or-notset"];
                }
                break;
            case "NOT":
                const items_not = [];
                if (node.SubConditions) {
                    for (const i in node.SubConditions) {
                        items_not.push("<span class='or'>" + this._summarize(node.SubConditions[i]) + "</span>");
                    }
                }
                if (items_not.length) {
                    return translations["not-sentense"].replace("{0}", items_not.join(translations["or-joint"]));
                }else {
                    return translations["not-notset"];
                }
                break;
            case "SOME":
                const items_some = [],
                    range_some_from = node.Variables&&node.Variables[0]?parseInt(node.Variables[0].split("-")[0]):null,
                    range_some_to = node.Variables&&node.Variables[0]&&node.Variables[0].split("-").length>1?parseInt(node.Variables[0].split("-")[1]):null;
                for (const i in node.SubConditions) {
                    items_some.push("<span class='or'>" + this._summarize(node.SubConditions[i]) + "</span>");
                }
                if (items_some.length) {
                    if (!range_some_from&&!range_some_to || range_some_from==1&&!range_some_to) {
                        return translations["some-notset"];
                    } else if (range_some_from&&!range_some_to) {
                        return translations["some-sentense_from"].replace("{0}", items_some.join(translations["or-joint"])).replace("{1}", range_some_from);
                    } else if (!range_some_from&&range_some_to) {
                        return translations["some-sentense_to"].replace("{0}", items_some.join(translations["or-joint"])).replace("{1}", range_some_to);
                    } else if (range_some_from&&range_some_to) {
                        return translations["some-sentense_fromto"].replace("{0}", items_some.join(translations["or-joint"])).replace("{1}", range_some_from).replace("{2}", range_some_to);
                    }
                    return translations["some-sentense"].replace("{0}", items_some.join(translations["or-joint"]));
                }else {
                    return translations["some-notset"];
                }
                break;
            case "EQUIVALENT":
                const items_equivalent = [];
                for (const i in node.SubConditions) {
                    items_equivalent.push(this._summarize(node.SubConditions[i]));
                }
                for (const i in node.Variables) {
                    items_equivalent.push("<span class='static'>" + translations["staticvalue"].replace("{0}", node.Variables[i]) + "</span>");
                }
                if (!items_equivalent.length) {
                    return "<span class='novalue'>" + translations["equivalent-novalue"] + "</span>";
                } else if (items_equivalent.length == 1) {
                    items_equivalent.push("<span class='missingvalue'>" + translations["equivalent-missingvalue"] + "</span>");
                    return translations["equivalent-sentense"].replace("{0}", items_equivalent.join(translations["equivalent-joint"]));
                } else {
                    return translations["equivalent-sentense"].replace("{0}", items_equivalent.join(translations["equivalent-joint"]));
                }
                break;
            case "GREATER_THAN":
            case "GREATER_OR_EQUAL":
            case "LESS_THAN":
            case "LESS_OR_EQUAL":
                let target_compare;
                const items_compare = [];
                const sentense = 
                    node.Operator=="GREATER_THAN"?"greaterthan-sentense":
                    node.Operator=="GREATER_OR_EQUAL"?"greaterorequal-sentense":
                    node.Operator=="LESS_THAN"?"lessthan-sentense":
                    node.Operator=="LESS_OR_EQUAL"?"lessorequal-sentense":"";
                if (node.SubConditions.length>0) {
                    target_compare = this._summarize(node.SubConditions[0]);
                    for (const i in node.SubConditions.slice(1)) {
                        items_compare.push(this._summarize(node.SubConditions.slice(1)[i]));
                    }
                } else {
                    target_compare = "<span class='novalue'>" + translations["compare-missingvalue"] + "</span>";
                }
                for (const i in node.Variables) {
                    items_compare.push("<span class='static'>" + translations["staticvalue"].replace("{0}", node.Variables[i]) + "</span>");
                }
                if (!items_compare.length) {
                    items_compare.push("<span class='novalue'>" + translations["compare-novalue"] + "</span>");
                }
                return translations[sentense].replace("{0}", target_compare).replace("{1}", items_compare.join(translations["equals-joint"]));
                break;
            case "EQUALS":
                const items_equals = [];
                for (const i in node.SubConditions) {
                    items_equals.push(this._summarize(node.SubConditions[i]));
                }
                for (const i in node.Variables) {
                    items_equals.push("<span class='static'>" + translations["staticvalue"].replace("{0}", node.Variables[i]) + "</span>");
                }
                if (!items_equals.length) {
                    return "<span class='novalue'>" + translations["equals-novalue"] + "</span>";
                } else if (items_equals.length == 1) {
                    items_equals.push("<span class='missingvalue'>" + translations["equals-missingvalue"] + "</span>");
                    return translations["equals-sentense"].replace("{0}", items_equals.join(translations["equals-joint"]));
                } else {
                    return translations["equals-sentense"].replace("{0}", items_equals.join(translations["equals-joint"]));
                }
                break;
            case "INCLUDES":
                let target_includes;
                let range_includes_from = "";
                let range_includes_to = "";
                const items_includes = [];
                if (node.SubConditions.length>0) {
                    target_includes = this._summarize(node.SubConditions[0]);
                    for (const i in node.SubConditions.slice(1)) {
                        items_includes.push(translations["staticvalue"].replace("{0}", this._summarize(node.SubConditions[i])));
                    }
                } else {
                    target_includes = "<span class='novalue'>" + translations["includes-novalue"] + "</span>";
                }
                if (node.Variables.length > 0) {
                    items_includes.push("<span class='static'>" + translations["staticvalue"].replace("{0}", node.Variables[0]) + "</span>");
                }
                if (node.Variables.length > 1) {
                    if (node.Variables[1].split("-")[0]&&parseInt(node.Variables[1].split("-")[0])) {
                        range_includes_from = parseInt(node.Variables[1].split("-")[0]);
                    }
                    if (node.Variables[1].split("-")[0]&&node.Variables[1].split("-").length>1&&parseInt(node.Variables[1].split("-")[1])){
                        range_includes_to = parseInt(node.Variables[1].split("-")[1]);
                    }
                }
                let comparar;
                if (items_includes?.length) {
                    comparar = items_includes.join(translations["valueof-joint"]);
                } else {
                    comparar = "<span class='novalue'>" + translations["includes-missingvalue"] + "</span>";
                }
                if (!range_includes_from&&!range_includes_to || range_includes_from==1&&!range_includes_to) {
                    return translations["includes-sentense-one"].replace("{0}", target_includes).replace("{1}", comparar);
                } else if (range_includes_from&&!range_includes_to) {
                    return translations["includes-sentense-rangefrom"].replace("{0}", target_includes).replace("{1}", comparar).replace("{2}", range_includes_from);
                } else if (!range_includes_from&&range_includes_to) {
                    return translations["includes-sentense-rangeto"].replace("{0}", target_includes).replace("{1}", comparar).replace("{2}", range_includes_to);
                } else if (range_includes_from&&range_includes_to) {
                    return translations["includes-sentense-rangefromto"].replace("{0}", target_includes).replace("{1}", comparar).replace("{2}", range_includes_from).replace("{3}", range_includes_to);
                }
                break;
            case "REGEX_MATCH":
                const items_regex = [];
                const regexs = [];
                for (const i in node.SubConditions) {
                    items_regex.push(this._summarize(node.SubConditions[i]));
                }
                for (const i in node.Variables) {
                    regexs.push("<span class='regexparam'>" + translations["regexparam"].replace("{0}", node.Variables[i]) + "</span>");
                }
                let target_regex;
                if (items_regex.length) {
                    target_regex = items_regex.join(translations["valueof-joint"]);
                } else {
                    target_regex = "<span class='novalue'>" + translations["regex-missingvalue"] + "</span>";
                }
                let regex;
                if (regexs.length) {
                    regex = regexs.join(translations["valueof-joint"]);
                } else {
                    regex = "<span class='novalue'>" + translations["regex-missingvalue"] + "</span>";
                }
                
                return translations["regex-sentense"].replace("{0}", target_regex).replace("{1}", regex);
                break;
            case "WHOLESENTENCE":
                const items_whole = [];
                for (const i in node.SubConditions) {
                    items_whole.push(this._summarize(node.SubConditions[i]));
                }
                for (const i in node.Variables) {
                    items_whole.push(node.Variables[i]);
                }
                return translations["textextract-whole"].replace("{0}", items_whole.join(translations["valueof-joint"]));
                break;
            case "REGEX_EXTRACT":
                const items_regex_extract = [];
                const regexs_extract = [];
                for (const i in node.SubConditions) {
                    items_regex_extract.push(this._summarize(node.SubConditions[i]));
                }
                for (const i in node.Variables) {
                    regexs_extract.push("<span class='regexparam'>" + node.Variables[i] + "</span>");
                }
                let target_regex_extract;
                if (items_regex_extract.length) {
                    target_regex_extract = items_regex_extract.join(translations["valueof-joint"]);
                } else {
                    target_regex_extract = "<span class='novalue'>" + translations["regex-missingvalue"] + "</span>";
                }
                let regex_extract;
                if (regexs_extract.length) {
                    regex_extract = regexs_extract.join(translations["valueof-joint"]);
                } else {
                    regex_extract = "<span class='novalue'>" + translations["regex-missingvalue"] + "</span>";
                }
                
                return translations["textextract-regex"].replace("{0}", target_regex_extract).replace("{1}", regex_extract);
                break;
            case "SUBSTRING":
                let target_substring;
                let range_substring_from = "";
                let range_substring_to = "";
                const items_substring = [];
                if (node.SubConditions&&node.SubConditions.length>0) {
                    target_substring = this._summarize(node.SubConditions[0]);
                    for (const i in node.SubConditions.slice(1)) {
                        items_substring.push(this._summarize(node.SubConditions[i]));
                    }
                } else {
                    target_substring = "<span class='novalue'>" + translations["textextract-sub_missingvalue"] + "</span>";
                }
                for (const i in node.Variables) {
                    items_substring.push(node.Variables[i]);
                }
                if (items_substring.length > 0) {
                    if (items_substring[0].split("-")&&parseInt(items_substring[0].split("-")[0])) {
                        range_substring_from = parseInt(items_substring[0].split("-")[0]);
                    }
                    if (items_substring[0].split("-")&&items_substring[0].split("-").length>1&&parseInt(items_substring[0].split("-")[1])){
                        range_substring_to = parseInt(items_substring[0].split("-")[1]);
                    }
                }
                if (!range_substring_from&&!range_substring_to) {
                    return translations["textextract-sub_missingvalue"];
                } else if (range_substring_from&&!range_substring_to) {
                    return translations["textextract-sub_from"].replace("{0}", target_substring).replace("{1}", range_substring_from);
                } else if (!range_substring_from&&range_substring_to) {
                    return translations["textextract-sub_to"].replace("{0}", target_substring).replace("{1}", range_substring_to);
                } else if (range_substring_from&&range_substring_to) {
                    return translations["textextract-sub_fromto"].replace("{0}", target_substring).replace("{1}", range_substring_from).replace("{2}", range_substring_to);
                }
                break;
            case "FIRST":
                let target_first;
                const items_first = [];
                let length_first;
                if (node.SubConditions.length>0) {
                    target_first = this._summarize(node.SubConditions[0]);
                    for (const i in node.SubConditions.slice(1)) {
                        items_first.push(this._summarize(node.SubConditions[i]));
                    }
                } else {
                    target_first = "<span class='novalue'>" + translations["textextract-sub_missingvalue"] + "</span>";
                }
                for (const i in node.Variables) {
                    items_first.push(node.Variables[i]);
                }
                length_first = parseInt(items_first[0]);
                if (!length_first) {
                    return translations["textextract-sub_missingvalue"];
                } else {
                    return translations["textextract-first"].replace("{0}", target_first).replace("{1}", length_first);
                }
                break;
            case "LAST":
                let target_last;
                const items_last = [];
                let length_last;
                if (node.SubConditions.length>0) {
                    target_last = this._summarize(node.SubConditions[0]);
                    for (const i in node.SubConditions.slice(1)) {
                        items_last.push(this._summarize(node.SubConditions[i]));
                    }
                } else {
                    target_last = "<span class='novalue'>" + translations["textextract-sub_missingvalue"] + "</span>";
                }
                for (const i in node.Variables) {
                    items_last.push(node.Variables[i]);
                }
                length_last = parseInt(items_last[0]);
                if (!length_last) {
                    return translations["textextract-sub_missingvalue"];
                } else {
                    return translations["textextract-last"].replace("{0}", target_last).replace("{1}", length_last);
                }
                break;
            case "ADD":
                const items_add = [];
                for (const i in node.SubConditions) {
                    items_add.push(this._summarize(node.SubConditions[i]));
                }
                for (const i in node.Variables) {
                    items_add.push(node.Variables[i]);
                }
                if (items_add.length) {
                    return items_add.join(translations["plus-joint"]);
                } else {
                    return translations["calc-missingvalue"];
                }
                break;
            case "SUBTRACT":
                let orig_subtract;
                const items_subtract = [];
                if (node.SubConditions.length>0) {
                    orig_subtract = this._summarize(node.SubConditions[0]);
                    for (const i in node.SubConditions.slice(1)) {
                        items_subtract.push(this._summarize(node.SubConditions[i]));
                    }
                } else {
                    orig_subtract = translations["calc-missingvalue"];
                }
                for (const i in node.Variables) {
                    items_subtract.push(node.Variables[i]);
                }
                if (items_subtract.length) {
                    return orig_subtract + translations["subtract-joint"] + items_subtract.join(translations["subtract-joint"]);
                } else {
                    return orig_subtract + translations["subtract-joint"] + translations["calc-missingvalue"];
                }
                break;
            case "MULTIPLY":
                const items_multiply = [];
                for (const i in node.SubConditions) {
                    items_multiply.push(this._summarize(node.SubConditions[i]));
                }
                for (const i in node.Variables) {
                    items_multiply.push(node.Variables[i]);
                }
                if (items_multiply.length) {
                    return items_multiply.join(translations["multiply-joint"]);
                } else {
                    return translations["calc-missingvalue"];
                }
                break;
            case "DIVIDE":
                let orig_divide;
                const items_divide = [];
                if (node.SubConditions.length>0) {
                    orig_divide = this._summarize(node.SubConditions[0]);
                    for (const i in node.SubConditions.slice(1)) {
                        items_divide.push(this._summarize(node.SubConditions[i]));
                    }
                } else {
                    orig_divide = translations["calc-missingvalue"];
                }
                for (const i in node.Variables) {
                    items_divide.push(node.Variables[i]);
                }
                if (items_divide.length) {
                    return orig_divide + translations["divide-joint"] + items_divide.join(translations["subtract-joint"]);
                } else {
                    return orig_divide + translations["divide-joint"] + translations["calc-missingvalue"];
                }
                break;
            case "MODULO":
                let orig_modulo;
                const items_modulo = [];
                if (node.SubConditions.length>0) {
                    orig_modulo = this._summarize(node.SubConditions[0]);
                    for (const i in node.SubConditions.slice(1)) {
                        items_modulo.push(this._summarize(node.SubConditions[i]));
                    }
                } else {
                    orig_modulo = translations["calc-missingvalue"];
                }
                for (const i in node.Variables) {
                    items_modulo.push(node.Variables[i]);
                }
                if (items_modulo.length) {
                    return translations["modulo-sentense"].replace("{0}", orig_modulo).replace("{1}", items_modulo.join(translations["subtract-joint"]));
                } else {
                    return translations["modulo-sentense"].replace("{0}", orig_modulo).replace("{1}", translations["calc-missingvalue"]);
                }
                break;
            case "PARSEINT":
                const items_parseint = [];
                for (const i in node.SubConditions) {
                    items_parseint.push(this._summarize(node.SubConditions[i]));
                }
                for (const i in node.Variables) {
                    items_parseint.push(node.Variables[i]);
                }
                if (items_parseint.length) {
                    return "<span class='parseint'>" + items_parseint.join(translations["value-joint"]) + "</span>";
                } else {
                    return translations["calc-missingvalue"];
                }
                break;
            case "EXCHANGE":
                const items_exchange = [];
                let currency;
                for (const i in node.SubConditions) {
                    items_exchange.push(this._summarize(node.SubConditions[i]));
                }
                if (node.Variables.length) {
                    currency = node.Variables[0];
                } else {
                    currency = translations["calc-missingvalue"];
                }
                if (items_exchange.length) {
                    return translations["exchange-sentense"].replace("{0}", items_exchange.join(translations["value-joint"])).replace("{1}", currency);
                } else {
                    return translations["calc-missingvalue"];
                }
                break;
            case "PARAM":
                const items_param = [];
                for (const i in node.SubConditions) {
                    items_param.push(this._summarize(node.SubConditions[i]));
                }
                for (const i in node.Variables) {
                    items_param.push("<span class='param'>" + translations[node.Variables[i]] + "</span>");
                }
                return translations["valueof-sentense"].replace("{0}", items_param.join(translations["valueof-joint"]));
                break;
        }
    }

    /**
     * Placeholder methods for dialog interactions
     * @private
     */
    _editItem(e) {
        const operator = e.target.getAttribute("operator");
        const path = e.target.getAttribute("path");
        
        try {
            const json = this.getJSON();
            const currentnode = this._getSubCondition(json, path);
            
            const finishupdating = () => {
                this.setJSON(json);
            };

            if (this.reverselookuptype[operator] == "boolean") {
                // Boolean operators edited via boolean dialog
                this.boolDialog.open(e);
            } else if (this.reverselookuptype[operator] == "optext") {
                // Text operators edited via boolean dialog
                this.boolDialog.open(e);
            } else if (this.reverselookuptype[operator] == "extract") {
                // Text extractors - open text input dialog
                let extractor = "wholesentence", extractorval = null;
                if (currentnode.SubConditions && currentnode.SubConditions.length > 0 && currentnode.SubConditions[0].Variables) {
                    extractor = currentnode.SubConditions[0].Variables[0];
                    if (currentnode.SubConditions[0].Variables.length > 1) {
                        extractorval = currentnode.SubConditions[0].Variables[1];
                    }
                }
                inputText(currentnode.Variables[0], "env", extractor, extractorval, true, false, function(dispval, val, type, exttype, extval) {
                    if (exttype == "wholesentence") {
                        currentnode.Operator = "PARAM";
                        currentnode.Variables = [val];
                        currentnode.SubConditions = [];
                    } else {
                        currentnode.Operator = this.operatormap[exttype];
                        currentnode.Variables = [extval];
                        currentnode.SubConditions = [{"Operator": "PARAM", "SubConditions": null, "Variables": [val]}];
                    }
                    finishupdating();
                }.bind(this));
            } else if (operator == "_variable") {
                // Variable editing
                const ind = e.target.getAttribute("index");
                const current = e.target.innerText;
                inputText(current, "variable", null, null, false, true, function(dispval, val) {
                    currentnode.Variables[ind] = val;
                    finishupdating();
                });
            }
        } catch (err) {
            console.error('Error in editItem:', err);
        }
    }

    _deleteItem(e) {
        try {
            const path = e.target.getAttribute("path");
            const json = this.getJSON();
            
            const paths = path.split("/");
            let parentnode = json;
            let currentnode = json;
            
            for (const i in paths.slice(1)) {
                parentnode = currentnode;
                currentnode = currentnode.SubConditions[paths.slice(1)[i]];
            }
            
            if (parentnode.SubConditions && currentnode) {
                parentnode.SubConditions.splice(parentnode.SubConditions.indexOf(currentnode), 1);
                this.setJSON(json);
            }
        } catch (err) {
            console.error('Error in deleteItem:', err);
        }
    }



    _editBoolItem(path) {
        try {
            const json = this.getJSON();
            const currentnode = this._getSubCondition(json, path);
            
            if (document.getElementById("booltextradio").checked) {
                // Text operator handling
                const variables = [];
                const compvariables = [];
                const paramvariables = [];
                const subconditions = [];
                
                if (document.getElementById("textconditionselectvalue").value && 
                    document.getElementById("textconditionselectvalue").value != "undefined") {
                    variables.push(document.getElementById("textconditionselectvalue").value);
                }
                if (document.getElementById("textconditionselectrange").value && 
                    document.getElementById("textconditionselectrange").value != "undefined") {
                    variables.push(document.getElementById("textconditionselectrange").value);
                }
                if (document.getElementById("textcomparebaseextvalue").value && 
                    document.getElementById("textcomparebaseextvalue").value != "undefined") {
                    compvariables.push(document.getElementById("textcomparebaseextvalue").value);
                }
                if (document.getElementById("textcomparebasevalue").value && 
                    document.getElementById("textcomparebasevalue").value != "undefined") {
                    paramvariables.push(document.getElementById("textcomparebasevalue").value);
                }
                
                if (document.getElementById("textcomparebaseexttype").value == "wholesentence") {
                    subconditions.push({"Operator": "PARAM", "Variables": paramvariables});
                } else {
                    subconditions.push({
                        "Operator": this.operatormap[document.getElementById("textcomparebaseexttype").value],
                        "SubConditions": [{"Operator": "PARAM", "Variables": paramvariables}],
                        "Variables": compvariables
                    });
                }
                
                currentnode.Operator = this.operatormap[document.getElementById("textconditionselecttype").value];
                currentnode.Variables = variables;
                currentnode.SubConditions = subconditions;
                
            } else if (document.getElementById("boolnumericradio").checked) {
                // Numeric operator handling
                const numericcomparebasevalue = document.getElementById("numericcomparebase").value;
                const numericcompareoperator = document.getElementById("numericcompareoperator").value;
                const numericcomparetarget = document.getElementById("numericcomparetarget").value;
                
                currentnode["Operator"] = this.operatormap[numericcompareoperator];
                currentnode["SubConditions"] = [JSON.parse(numericcomparebasevalue), JSON.parse(numericcomparetarget)];
                
            } else if (document.getElementById("boolconditionradio").checked) {
                // Add boolean condition
                currentnode["Operator"] = document.getElementById("boolcondition").value;
                currentnode["Variables"] = [];
                currentnode["SubConditions"] = [];
            }

            document.getElementById("boolModal").style["display"] = "none";
            this.setJSON(json);
        } catch (err) {
            console.error('Error in editBoolItem:', err);
        }
    }

    /**
     * Helper to get sub-condition by path
     * @private
     */
    _getSubCondition(json, pathstring) {
        const paths = pathstring.split("/");
        let currentnode = json;
        for (const i in paths){
            if (currentnode.SubConditions && currentnode.SubConditions[paths[i]]) {
                currentnode = currentnode.SubConditions[paths[i]];
            } else {
                currentnode.SubConditions = [];
                currentnode.SubConditions.push({"Operator": this.baseType, "SubConditions": [], "Variables": []});
                currentnode = currentnode.SubConditions[0];
            }
        }
        return currentnode;
    }
 }

/**
 * BoolDialogHandler - Manages the boolean dialog for the ConditionEditor
 */
class BoolDialogHandler {
    constructor(editor) {
        this.editor = editor;
    }

    /**
     * Open boolean dialog for editing boolean/text operators
     */
    open(e) {
        try {
            const path = e.target.getAttribute("path");
            const operator = e.target.getAttribute("operator");
            const json = this.editor.getJSON();
            const currentnode = this.editor._getSubCondition(json, path);
            
            // Reset boolean dialog state
            document.getElementById("boolBody").className = "";
            document.getElementById("boolBody").classList.add("modal-body");
            document.getElementById("boolBody").classList.add(this.editor.namingmap[operator]);
            document.getElementById("boolBody").classList.add(this.editor.reverselookuptype[operator]);
            
            document.getElementById("boolmodal_text").style["display"] = "block";
            document.getElementById("boolmodal_numeric").style["display"] = "block";
            document.getElementById("boolmodal_bool").style["display"] = "block";
            document.getElementById("booltextradio").style["display"] = "inline";
            document.getElementById("boolnumericradio").style["display"] = "inline";
            document.getElementById("boolconditionradio").style["display"] = "inline";

            if (this.editor.textoperators.includes(currentnode.Operator)) {
                document.getElementById("boolmodal_text").style["display"] = "inline";
                document.getElementById("boolmodal_numeric").style["display"] = "none";
                document.getElementById("boolmodal_bool").style["display"] = "none";
                document.getElementById("booltextradio").style["display"] = "none";
                document.getElementById("booltextradio").checked = true;
                document.getElementById("boolmodal_text").classList.add("available");
            } else {
                document.getElementById("booltextradio").checked = false;
                document.getElementById("boolmodal_text").classList.remove("available");
            }
            
            document.getElementById("boolnumericradio").checked = false;
            document.getElementById("boolmodal_numeric").classList.remove("available");
            document.getElementById("boolconditionradio").checked = false;
            document.getElementById("boolmodal_bool").classList.remove("available");
            document.getElementById("boolSubmitButton").disabled = "disabled";

            document.getElementById("boolModal").style["display"] = "block";
            document.getElementById("boolPath").value = path;
            
            // Store reference to editor for callback
            const self = this;
            document.getElementById("boolSubmitButton").onclick = function() {
                self.editor._editBoolItem(path);
            };
        } catch (err) {
            console.error('Error in BoolDialogHandler.open():', err);
        }
    }

    /**
     * Validate boolean dialog form inputs
     */
    validate() {
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
}

/**
 * TextConditionDialogHandler - Manages the text condition dialog for the ConditionEditor
 */
class TextConditionDialogHandler {
    constructor(editor) {
        this.editor = editor;
    }

    /**
     * Open text condition dialog for editing text condition operators
     */
    open(currenttype, currentrange, currentval, callback) {
        document.getElementById("textConditionEqualradio").checked = currenttype == "equals";
        document.getElementById("textconditionrangeradio").checked = currenttype == "includes";
        document.getElementById("textconditionregexradio").checked = currenttype == "regex_match";
        document.getElementById("textconditionrange-from").value = currenttype == "includes" ? currentrange.split("-")[0] : "";
        document.getElementById("textconditionrange-to").value = currenttype == "includes" && currentrange.indexOf("-") && currentrange !== "-" ? currentrange.split("-")[1] : "";
        document.getElementById("textconditionequals").value = currenttype == "equals" ? currentval : "";
        document.getElementById("textconditionrangetext").value = currenttype == "includes" ? currentval : "";
        document.getElementById("textconditionregex").value = currenttype == "regex_match" ? currentval : "";
        this.validate();
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

    /**
     * Validate text condition dialog form inputs
     */
    validate() {
        if (document.getElementById("textConditionEqualradio").checked) {
            document.getElementById("textConditionModalButton").disabled = 
document.getElementById("textconditionequals").value?"":"disabled";
            return;
        } else if (document.getElementById("textconditionrangeradio").checked) {
            document.getElementById("textConditionModalButton").disabled = 
document.getElementById("textconditionrangetext").value && (!document.getElementById("textconditionrange-from").value 
|| !document.getElementById("textconditionrange-to").value || 
parseInt(document.getElementById("textconditionrange-to").value) > 
parseInt(document.getElementById("textconditionrange-from").value)) ? "" : "disabled";
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
}

/**
 * NumericDialogHandler - Manages the numeric input dialog for the ConditionEditor
 */
class NumericDialogHandler {
    constructor(editor) {
        this.editor = editor;
    }

    /**
     * Open numeric input dialog for editing numeric formulas
     */
    open(currentformula, callback) {
        document.getElementById("calcformula").value = currentformula;
        document.getElementById("calccursorpos").value = "/";
        try {
            const formula = JSON.parse(currentformula);
            visualizeFormula(formula);
        } catch {
            visualizeFormula({});
        }
        document.getElementById("numModal").style["display"] = "block";
        this.validate();
        document.getElementById("numModalButton").onclick = function(){
            callback(document.getElementById("calcformula").value, document.getElementById("calcdisplay").innerText);
            document.getElementById("numModal").style["display"] = "none";
        }
    }

    /**
     * Validate numeric dialog form inputs
     */
    validate() {
        const current = document.getElementById("calcformula").value;
        try {
            const formula = JSON.parse(current);
            document.getElementById("numModalButton").disabled = checkNumValid(formula) ? "" : "disabled";
        } catch {
            document.getElementById("numModalButton").disabled = "disabled";
        }
    }
}

// ============================================
// Dialog and Helper Functions
// ============================================

/**
 * Validator for boolean dialog form
 */
function boolDialogValidator() {
    if (conditionEditor && conditionEditor.boolDialog) {
        conditionEditor.boolDialog.validate();
    }
}

/**
 * Generates human-readable display text for text extraction/condition operations
 */
function generageDisplayText(tasktype, operationtype, ...values) {
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

/**
 * Validator for text dialog form
 */
function textDialogValidator() {
    let valid = false;
    document.getElementById("textSubmitButton").disabled = "disabled";
    if (document.getElementById("textenterradio").checked) {
        valid = document.getElementById("textEnter").value != "";
    } else if (document.getElementById("textenvradio").checked) {
        valid = document.getElementById("textEnvSelect").value != "";
    }
    document.getElementById("textSubmitButton").disabled = !valid ? "disabled" : "";
}

/**
 * Validator for text condition dialog form
 */
function textConditionDialogValidator() {
    if (conditionEditor && conditionEditor.textConditionDialog) {
        conditionEditor.textConditionDialog.validate();
    }
}

/**
 * Validator for numeric dialog form - wrapper for backward compatibility
 */
function numDialogValidator(formula){
    if (conditionEditor && conditionEditor.numericDialog) {
        conditionEditor.numericDialog.validate();
    }
}

/**
 * Opens text input dialog for variable/environment extraction
 */
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
    document.getElementById('textExtSelect').value=currentextractor??"wholesentence";
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
    document.getElementById("textenterradio").style["display"]= includeenter ? "inline-block" : "none";
    
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
                    exttype = "wholesentence";
                    dispval = generageDisplayText("extract", "wholesentence", val);
                    break;
            }
        }
        callback(dispval, val, type, exttype, extval);
        document.getElementById("textModal").style["display"] = "none";
    };
}

/**
 * Opens text condition input dialog - wrapper for backward compatibility with HTML onclick handlers
 */
function inputTextCondition(currenttype, currentrange, currentval, callback){
    if (conditionEditor && conditionEditor.textConditionDialog) {
        conditionEditor.textConditionDialog.open(currenttype, currentrange, currentval, callback);
    }
}

/**
 * Opens numeric input dialog - wrapper for backward compatibility with HTML onclick handlers
 */
function inputNumber(currentformula, callback){
    if (conditionEditor && conditionEditor.numericDialog) {
        conditionEditor.numericDialog.open(currentformula, callback);
    }
}

/**
 * Closes a modal by ID
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none";
    }
}

// ============================================
// Calculation Formula Functions
// ============================================

/**
 * Appends a calculation operator to the formula
 */
function appendCalcOperator(operatortype) {
    appendItemToFormula({"Operator": operatortype, SubConditions: null, Variables: null});
}

/**
 * Appends a value to the calculation formula
 */
function appendCalcValue() {
    inputText(null, null, null, null, true, true, function(dispval, val, type, exttype, extval){
        let appendnode;
        if (type == "env") {
            if (exttype && exttype != "wholesentence" && extval) {
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

/**
 * Visualizes the calculation formula
 */
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

/**
 * Updates cursor position in the formula editor
 */
function updateCursor(e){
    document.getElementById("calccursorpos").value = e.target.getAttribute("path");
    setCursor(JSON.parse(document.getElementById("calcformula").value));
    event.stopPropagation();
}

/**
 * Fills a placeholder in the calculation formula
 */
function fillPlaceHolder(e) {
    document.getElementById("calccursorpos").value = e.target.getAttribute("path");
    appendCalcValue();
    event.stopPropagation();
}

/**
 * Sets the cursor position in the formula
 */
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

/**
 * Appends a calculation element to the UI
 */
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
        }
    }
}

/**
 * Appends an item to the calculation formula
 */
function appendItemToFormula(elem) {
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
    
    if (type == "sub" || type == "placeholder") {
        if (!targetcontainer.SubConditions) targetcontainer.SubConditions = [];
        targetcontainer.SubConditions[index] = elem;
    } else if (type == "const") {
        if (!targetcontainer.Variables) targetcontainer.Variables = [];
        targetcontainer.Variables[index] = elem;
    }
    document.getElementById("calcformula").value = JSON.stringify(formula);
    visualizeFormula(formula);
    numDialogValidator(formula);
}

/**
 * Validates numeric formula
 */
function checkNumValid(formula) {
    if ((!formula.SubConditions || !formula.SubConditions.length) && (!formula.Variables || !formula.Variables.length)){
        return false;
    }
    return true;
}

// ============================================
// Condition Testing UI Functions
// ============================================

/**
 * Updates test event parameter fields
 */
function updateTestEventParams() {
    console.log('updateTestEventParams called');
    // TODO: Implement dynamic parameter fields based on event type
}

/**
 * Updates condition event type fields
 */
function updateCondEventFields() {
    console.log('updateCondEventFields called');
    // TODO: Implement dynamic fields for condition event type
}

/**
 * Toggles device action section visibility
 */
function toggleDeviceAction(checkbox) {
    console.log('toggleDeviceAction:', checkbox.checked);
    // TODO: Implement device action toggle
}

/**
 * Updates the action select options based on device
 */
function updateCondActionSelect() {
    console.log('updateCondActionSelect called');
    // TODO: Implement action selection for device
}

/**
 * Updates the action parameters based on selected action
 */
function updateCondActionParams() {
    console.log('updateCondActionParams called');
    // TODO: Implement parameter fields for action
}

/**
 * Selects a color preset
 */
function selectCondColor(btn) {
    console.log('selectCondColor:', btn.getAttribute('data-color'));
    // TODO: Implement color selection
}

/**
 * Runs a condition test
 */
function runConditionTest() {
    console.log('runConditionTest called');
    // TODO: Implement condition testing with API call
}

/**
 * Saves a filter
 */
function saveFilter() {
    console.log('saveFilter called');
    // TODO: Implement filter saving with API call
}

/**
 * Cancels confirmation dialog
 */
function cancelConfirm() {
    const overlay = document.getElementById('confirmOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

/**
 * Confirms add operation
 */
function confirmAdd() {
    console.log('confirmAdd called');
    // TODO: Implement add confirmation
}

