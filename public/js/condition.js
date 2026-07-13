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
        this.textextractors = ["WHOLEWORD", "REGEX_EXTRACT", "SUBSTRING", "FIRST", "LAST"];
        this.groupoperators = ["COUNT", "SUM"];
        this.calcoperators = ["ADD", "SUBTRACT", "MULTIPLY", "DIVIDE", "MODULO"];
        this.convoperators = ["PARSEINT", "EXCHANGE"];

        this.namingmap = {
            "AND": "and", "OR": "or", "NOT": "not", "SOME": "some",
            "EQUIVALENT": "equivalent", "GREATER_THAN": "greater_than",
            "GREATER_OR_EQUAL": "greater_or_equal", "LESS_THAN": "less_than",
            "LESS_OR_EQUAL": "less_or_equal", "EQUALS": "equals",
            "INCLUDES": "includes", "REGEX_MATCH": "regex_match",
            "COUNT": "count", "SUM": "sum", "WHOLEWORD": "wholeword",
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
            "count": "COUNT", "sum": "SUM", "wholeword": "WHOLEWORD",
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

            // Only for non-top-level (has more than one "/"), show summary
            if (path.split("/").length > 2) {
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
                    addbutton.onclick = (e) => this._openBoolDialog(e);
                    area.append(addbutton);
                }
            }
        } else {
            const addtoemptybutton = document.createElement("div");
            addtoemptybutton.classList.add("addbutton");
            addtoemptybutton.innerText = "+";
            addtoemptybutton.setAttribute("path", path);
            addtoemptybutton.setAttribute("operator", operator);
            addtoemptybutton.onclick = (e) => this._openBoolDialog(e);
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
                    return items_and.join(translations["and-joint"] || " AND ");
                } else {
                    return translations["and-notset"] || "AND not set";
                }

            case "OR":
                const items_or = [];
                if (node.SubConditions) {
                    for (const i in node.SubConditions) {
                        items_or.push("<span class='or'>" + this._summarize(node.SubConditions[i]) + "</span>");
                    }
                }
                if (items_or.length) {
                    return items_or.join(translations["or-joint"] || " OR ");
                } else {
                    return translations["or-notset"] || "OR not set";
                }

            case "NOT":
                const items_not = [];
                if (node.SubConditions) {
                    for (const i in node.SubConditions) {
                        items_not.push("<span class='or'>" + this._summarize(node.SubConditions[i]) + "</span>");
                    }
                }
                if (items_not.length) {
                    return (translations["not-sentense"] || "NOT {0}").replace("{0}", items_not.join(translations["or-joint"] || " OR "));
                } else {
                    return translations["not-notset"] || "NOT not set";
                }

            case "WHOLEWORD":
                const items_whole = [];
                if (node.SubConditions) {
                    for (const i in node.SubConditions) {
                        items_whole.push(this._summarize(node.SubConditions[i]));
                    }
                }
                if (node.Variables) {
                    for (const i in node.Variables) {
                        items_whole.push(node.Variables[i]);
                    }
                }
                return (translations["textextract-whole"] || "{0}").replace("{0}", items_whole.join(translations["valueof-joint"] || ", "));

            case "PARAM":
                const items_param = [];
                if (node.SubConditions) {
                    for (const i in node.SubConditions) {
                        items_param.push(this._summarize(node.SubConditions[i]));
                    }
                }
                if (node.Variables) {
                    for (const i in node.Variables) {
                        items_param.push("<span class='param'>" + (translations[node.Variables[i]] || node.Variables[i]) + "</span>");
                    }
                }
                return (translations["valueof-sentense"] || "{0}").replace("{0}", items_param.join(translations["valueof-joint"] || ", "));

            default:
                // Basic fallback for other operators
                const items_default = [];
                if (node.Variables) {
                    for (const i in node.Variables) {
                        items_default.push(node.Variables[i]);
                    }
                }
                return items_default.length ? items_default.join(", ") : (translations[node.Operator] || node.Operator);
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
                this._openBoolDialog(e);
            } else if (this.reverselookuptype[operator] == "optext") {
                // Text operators edited via boolean dialog
                this._openBoolDialog(e);
            } else if (this.reverselookuptype[operator] == "extract") {
                // Text extractors - open text input dialog
                let extractor = "wholeword", extractorval = null;
                if (currentnode.SubConditions && currentnode.SubConditions.length > 0 && currentnode.SubConditions[0].Variables) {
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

    _openBoolDialog(e) {
        try {
            const path = e.target.getAttribute("path");
            const operator = e.target.getAttribute("operator");
            const json = this.getJSON();
            const currentnode = this._getSubCondition(json, path);
            
            // Reset boolean dialog state
            document.getElementById("boolBody").className = "";
            document.getElementById("boolBody").classList.add("modal-body");
            document.getElementById("boolBody").classList.add(this.namingmap[operator]);
            document.getElementById("boolBody").classList.add(this.reverselookuptype[operator]);
            
            document.getElementById("boolmodal_text").style["display"] = "block";
            document.getElementById("boolmodal_numeric").style["display"] = "block";
            document.getElementById("boolmodal_bool").style["display"] = "block";
            document.getElementById("booltextradio").style["display"] = "inline";
            document.getElementById("boolnumericradio").style["display"] = "inline";
            document.getElementById("boolconditionradio").style["display"] = "inline";

            if (this.textoperators.includes(currentnode.Operator)) {
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
            
            // Store reference to 'this' for callback
            const self = this;
            document.getElementById("boolSubmitButton").onclick = function() {
                self._editBoolItem(path);
            };
        } catch (err) {
            console.error('Error in openBoolDialog:', err);
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
                
                if (document.getElementById("textcomparebaseexttype").value == "wholeword") {
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
     }
 }

// ============================================
// Dialog and Helper Functions
// ============================================

/**
 * Validator for boolean dialog form
 */
function boolDialogValidator() {
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
    let valid = false;
    document.getElementById("textconditionSubmitButton").disabled = "disabled";
    if (document.getElementById("textcomparebasetype").value == "env") {
        valid = document.getElementById("textcomparebasevalue").value &&
                document.getElementById("textcomparebasetype").value && 
                document.getElementById("textconditionselectvalue").value && 
                document.getElementById("textconditionselecttype").value;
    } else if (document.getElementById("textcomparebasetype").value == "variable") {
        valid = document.getElementById("textcomparebaseextvalue").value &&
                document.getElementById("textcomparebasevalue").value && 
                document.getElementById("textconditionselectvalue").value;
    }
    document.getElementById("textconditionSubmitButton").disabled = !valid ? "disabled" : "";
}

/**
 * Validator for numeric dialog form
 */
function numDialogValidator() {
    let valid = false;
    document.getElementById("numSubmitButton").disabled = "disabled";
    if (document.getElementById("numCalcInput").value) {
        valid = true;
    }
    document.getElementById("numSubmitButton").disabled = !valid ? "disabled" : "";
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
                    exttype = "wholeword";
                    dispval = generageDisplayText("extract", "wholeword", val);
                    break;
            }
        }
        callback(dispval, val, type, exttype, extval);
        document.getElementById("textModal").style["display"] = "none";
    };
}

/**
 * Opens text condition input dialog
 */
function inputTextCondition(currentvalue, currenttype, currentextractor, currentextractorval, callback){
    document.getElementById("textconditionBody").className = "";
    document.getElementById("textconditionBody").classList.add("modal-body");
    document.getElementById("textconditionBody").classList.add("textconditionselection");
    document.getElementById("textcomparebasetype").value = currenttype;
    if (currenttype == "env") {
        document.getElementById("textcomparebasevalue").value = currentvalue;
        document.getElementById("textcomparebasetype").value = "env";
        document.getElementById('textconditionenvArea').classList.add('available');
        document.getElementById('textconditionenterArea').classList.remove('available');
    } else if (currenttype == "variable") {
        document.getElementById("textcomparebasevalue").value = currentvalue;
        document.getElementById("textcomparebasetype").value = "variable";
        document.getElementById('textconditionenterArea').classList.add('available');
        document.getElementById('textconditionenvArea').classList.remove('available');
    }
    document.getElementById('textconditionExtArea').classList.remove('available');
    document.getElementById('textconditionExtSelect').disabled = currenttype == "variable" ? "disabled" : "";
    document.getElementById('textconditionExtSelect').value=currentextractor??"wholeword";
    document.getElementById('textconditionExtRegex').style['display']= currentextractor=="regex_extract" ? "inline-block":"none";
    document.getElementById('textconditionExtRegex').value=currentextractor=="regex_extract"?currentextractorval:"";
    document.getElementById('textconditionExtSubFrom').style['display']= currentextractor=="substring" ? "inline-block":"none";
    document.getElementById('textconditionExtSubFrom').value=currentextractor=="substring"?currentextractorval?.split("-")[0]:"";
    document.getElementById('textconditionExtSubTo').style['display']= currentextractor=="substring" ? "inline-block":"none";
    document.getElementById('textconditionExtSubTo').value=currentextractor=="substring"&&currentextractorval?.length>1?currentextractorval.split("-")[1]:"";
    
    textConditionDialogValidator();
    document.getElementById("textconditionModal").style["display"] = "block";
    document.getElementById("textconditionSubmitButton").onclick = ()=>{
        let val,type,exttype,extval;
        if (document.getElementById("textcomparebasetype").value == "variable") {
            val = document.getElementById("textcomparebasevalue").value;
            type = "variable";
        } else if (document.getElementById("textcomparebasetype").value == "env") {
            val = document.getElementById("textcomparebasevalue").value;
            type = "env";
            exttype = document.getElementById("textconditionExtSelect").value;
            switch (exttype) {
                case "regex_extract":
                    extval = document.getElementById("textconditionExtRegex").value;
                    break;
                case "substring":
                    extval = `${document.getElementById('textconditionExtSubFrom').value}-${document.getElementById('textconditionExtSubTo').value}`;
                    break;
                default:
                    extval = "";
                    exttype = "wholeword";
                    break;
            }
        }
        callback(val, type, exttype, extval);
        document.getElementById("textconditionModal").style["display"] = "none";
    };
}

/**
 * Opens numeric input dialog
 */
function inputNumber(currentvalue, callback) {
    document.getElementById("numCalcInput").value = currentvalue ? JSON.stringify(currentvalue) : "";
    numDialogValidator();
    document.getElementById("numModal").style["display"] = "block";
    document.getElementById("numSubmitButton").onclick = ()=>{
        const val = document.getElementById("numCalcInput").value;
        callback(val ? JSON.parse(val) : null);
        document.getElementById("numModal").style["display"] = "none";
    };
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
function appendCalcOperator(op) {
    console.log('appendCalcOperator:', op);
    // TODO: Implement formula building
}

/**
 * Appends a value to the calculation formula
 */
function appendCalcValue() {
    console.log('appendCalcValue called');
    // TODO: Implement value selection for calculation
}

/**
 * Visualizes the calculation formula
 */
function visualizeFormula(formula) {
    console.log('visualizeFormula:', formula);
    // TODO: Implement formula visualization
}

/**
 * Updates cursor position in the formula editor
 */
function updateCursor(e) {
    console.log('updateCursor:', e.target);
    // TODO: Implement cursor movement
}

/**
 * Fills a placeholder in the calculation formula
 */
function fillPlaceHolder(e) {
    console.log('fillPlaceHolder:', e.target);
    // TODO: Implement placeholder filling
}

/**
 * Sets the cursor position in the formula
 */
function setCursor(path) {
    console.log('setCursor:', path);
    // TODO: Implement cursor setting
}

/**
 * Appends a calculation element to the UI
 */
function appendCalcElem(node, base, path) {
    console.log('appendCalcElem:', node, path);
    // TODO: Implement element appending
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

