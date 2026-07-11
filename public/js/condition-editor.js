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
        this.drawingArea = options.drawingArea || document.getElementById('drawingArea');
        this.logicDescriptionArea = options.logicDescriptionArea || document.getElementById('logictotaldescription');

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
    _getSubCondition(json, pathstring) {
        const paths = pathstring.split("/");
        let currentnode = json;
        for (const i in paths.slice(1)) {
            currentnode = currentnode.SubConditions[paths.slice(1)[i]];
        }
        return currentnode;
    }
}
