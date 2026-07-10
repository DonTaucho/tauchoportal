/**
 * ConditionEditor - Reusable condition logic editor class
 * Handles JSON editing, rendering, and synchronization across multiple textarea/form elements
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

        this.operator_types = {
            extraction: ["PARAM"],
            boolean: ["AND", "OR", "NOT", "SOME"],
            comparison: ["EQUIVALENT", "GREATER_THAN", "GREATER_OR_EQUAL", "LESS_THAN", "LESS_OR_EQUAL"],
            text: ["EQUALS", "INCLUDES", "REGEX_MATCH"],
            extract: ["WHOLEWORD", "REGEX_EXTRACT", "SUBSTRING", "FIRST", "LAST"],
            group: ["COUNT", "SUM"],
            calc: ["ADD", "SUBTRACT", "MULTIPLY", "DIVIDE", "MODULO"],
            conv: ["PARSEINT", "EXCHANGE"]
        };

        this.reverselookuptype = {
            "AND": "boolean", "OR": "boolean", "NOT": "boolean", "SOME": "boolean",
            "EQUIVALENT": "comparison", "GREATER_THAN": "comparison",
            "GREATER_OR_EQUAL": "comparison", "LESS_THAN": "comparison",
            "LESS_OR_EQUAL": "comparison", "EQUALS": "text",
            "INCLUDES": "text", "REGEX_MATCH": "text", "COUNT": "group",
            "SUM": "group", "ADD": "calc", "SUBTRACT": "calc",
            "MULTIPLY": "calc", "DIVIDE": "calc", "MODULO": "calc",
            "PARSEINT": "conv", "EXCHANGE": "conv", "PARAM": "extraction"
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
        const json = this.getJSON();
        if (!json) return;

        if (this.drawingArea) {
            this.drawingArea.replaceChildren();
            const fieldset = document.createElement('fieldset');
            fieldset.classList.add('root');
            this._loadJSON(json, fieldset, '0');
            this.drawingArea.appendChild(fieldset);
        }

        if (this.logicDescriptionArea) {
            this.logicDescriptionArea.innerHTML = '';
            const description = this._summarize(json);
            this.logicDescriptionArea.innerHTML = description || 'No condition set';
        }
    }

    /**
     * Render JSON node into DOM area
     * @private
     */
    _loadJSON(jsonnode, area, path = '0') {
        const operator = jsonnode.Operator;
        area.replaceChildren();

        const legendtag = document.createElement('legend');
        legendtag.innerText = translations[operator] || operator;
        area.appendChild(legendtag);

        const editarea = document.createElement('div');
        editarea.classList.add('icons');

        const edittag = document.createElement('a');
        edittag.classList.add('edit');
        edittag.innerText = '✏️';
        edittag.setAttribute('data-path', path);
        edittag.setAttribute('data-operator', operator);
        edittag.onclick = () => this._editItem(edittag);
        editarea.appendChild(edittag);

        const removetag = document.createElement('a');
        removetag.classList.add('remove');
        removetag.innerText = '🗑️';
        removetag.setAttribute('data-path', path);
        removetag.setAttribute('data-operator', operator);
        removetag.onclick = () => this._deleteItem(removetag);
        editarea.appendChild(removetag);
        area.appendChild(editarea);

        if (jsonnode.SubConditions || jsonnode.Variables) {
            area.classList.add(this.namingmap[operator]);

            if (operator === 'SOME') {
                this._renderSOMEControls(jsonnode, area, path);
            }

            if (path.split('/').length === 2) {
                const summarized = document.createElement('div');
                summarized.classList.add('summary');
                if (jsonnode.SubConditions) {
                    summarized.innerHTML = this._summarize(jsonnode);
                }
                area.appendChild(summarized);
            }

            const detailarea = document.createElement('div');
            detailarea.classList.add('detailarea');

            if (jsonnode.SubConditions && jsonnode.SubConditions.length) {
                const subconarea = document.createElement('div');
                subconarea.classList.add('subcondition');
                for (const is in jsonnode.SubConditions) {
                    const childarea = document.createElement('fieldset');
                    childarea.classList.add('item');
                    childarea.onclick = function () {
                        this.classList.toggle('focus');
                    };
                    this._loadJSON(jsonnode.SubConditions[is], childarea, path + '/' + is);
                    subconarea.append(childarea);
                }
                detailarea.appendChild(subconarea);
            }

            for (const iv in jsonnode.Variables) {
                const variableitem = document.createElement('div');
                variableitem.classList.add('variable');
                variableitem.innerText = jsonnode.Variables[iv];
                if (jsonnode.Operator !== 'PARAM') {
                    variableitem.setAttribute('data-operator', '_variable');
                    variableitem.setAttribute('data-path', path);
                    variableitem.setAttribute('data-index', iv);
                    variableitem.onclick = () => this._editItem(variableitem);
                }
                detailarea.appendChild(variableitem);
            }
            area.appendChild(detailarea);

            // Add buttons based on operator type
            if (this.operator_types.boolean.includes(operator)) {
                if (operator !== 'NOT' || jsonnode.SubConditions.length < 1) {
                    const addbutton = document.createElement('div');
                    addbutton.classList.add('addbutton');
                    addbutton.innerText = '+';
                    addbutton.setAttribute('data-path', path);
                    addbutton.setAttribute('data-operator', operator);
                    addbutton.onclick = () => this._openBoolDialog(addbutton);
                    area.append(addbutton);
                }
            }
        }
    }

    /**
     * Render SOME operator controls with from/to inputs
     * @private
     */
    _renderSOMEControls(jsonnode, area, path) {
        const somefield = document.createElement('div');
        const prefix = document.createElement('span');
        prefix.innerText = translations['some-sentense_prefix'] || '';
        somefield.append(prefix);

        const frombutton = document.createElement('input');
        frombutton.type = 'number';
        frombutton.inputmode = 'numeric';
        frombutton.min = 1;
        frombutton.max = 999;
        frombutton.pattern = '[0-9]*';
        frombutton.classList.add('numerictext');
        frombutton.style.display = 'inline-block';
        frombutton.setAttribute('data-path', path);
        frombutton.value = jsonnode.Variables && jsonnode.Variables.length > 0 ? jsonnode.Variables[0].split('-')[0] : '';
        frombutton.onchange = () => {
            const json = this.getJSON();
            const currentPath = frombutton.getAttribute('data-path');
            const current = this._getSubCondition(json, currentPath);
            const rangeValue = frombutton.value + '-' + (
                current.Variables && current.Variables.length > 0 && current.Variables[0].indexOf('-') !== -1
                    ? current.Variables[0].split('-')[1]
                    : ''
            );
            current.Variables[0] = rangeValue;
            this.setJSON(json);
        };
        somefield.append(frombutton);

        const joint = document.createElement('span');
        joint.innerText = translations['some-sentense_joint'] || '~';
        somefield.append(joint);

        const tobutton = document.createElement('input');
        tobutton.type = 'number';
        tobutton.inputmode = 'numeric';
        tobutton.min = 1;
        tobutton.max = 999;
        tobutton.pattern = '[0-9]*';
        tobutton.classList.add('numerictext');
        tobutton.style.display = 'inline-block';
        tobutton.value = jsonnode.Variables && jsonnode.Variables.length > 0 && jsonnode.Variables[0].indexOf('-') !== -1
            ? jsonnode.Variables[0].split('-')[1]
            : '';
        tobutton.setAttribute('data-path', path);
        tobutton.onchange = () => {
            const json = this.getJSON();
            const currentPath = tobutton.getAttribute('data-path');
            const current = this._getSubCondition(json, currentPath);
            const rangeValue = (
                current.Variables && current.Variables.length > 0 && current.Variables[0].indexOf('-') !== -1
                    ? current.Variables[0].split('-')[0]
                    : ''
            ) + '-' + tobutton.value;
            current.Variables[0] = rangeValue;
            this.setJSON(json);
        };
        somefield.append(tobutton);

        const suffix = document.createElement('span');
        suffix.innerText = translations['some-sentense_suffix'] || 'only';
        somefield.append(suffix);
        area.append(somefield);
    }

    /**
     * Get sub-condition at path
     * @private
     */
    _getSubCondition(json, path) {
        const parts = path.split('/').filter(p => p);
        let current = json;
        for (const part of parts) {
            if (!isNaN(part)) {
                current = current.SubConditions[parseInt(part)];
            }
        }
        return current;
    }

    /**
     * Edit an item (operator or variable)
     * @private
     */
    _editItem(element) {
        const path = element.getAttribute('data-path');
        const operator = element.getAttribute('data-operator');
        const index = element.getAttribute('data-index');

        console.log('Edit item:', { path, operator, index });
        // TODO: Implement edit dialog
    }

    /**
     * Delete an item
     * @private
     */
    _deleteItem(element) {
        const path = element.getAttribute('data-path');
        const operator = element.getAttribute('data-operator');

        console.log('Delete item:', { path, operator });
        // TODO: Implement delete logic
    }

    /**
     * Open boolean operator dialog
     * @private
     */
    _openBoolDialog(element) {
        const path = element.getAttribute('data-path');
        const operator = element.getAttribute('data-operator');

        console.log('Open bool dialog:', { path, operator });
        // TODO: Implement dialog
    }

    /**
     * Generate human-readable summary of condition
     * @private
     */
    _summarize(node) {
        if (!node) return '';

        switch (node.Operator) {
            case 'AND': {
                const items = [];
                if (node.SubConditions) {
                    for (const subcond of node.SubConditions) {
                        items.push('<span class="condition">' + this._summarize(subcond) + '</span>');
                    }
                }
                return items.length ? items.join(translations['and-joint'] || ' AND ') : translations['and-notset'] || 'Condition not set';
            }

            case 'OR': {
                const items = [];
                if (node.SubConditions) {
                    for (const subcond of node.SubConditions) {
                        items.push('<span class="condition">' + this._summarize(subcond) + '</span>');
                    }
                }
                return items.length ? items.join(translations['or-joint'] || ' OR ') : translations['or-notset'] || 'Condition not set';
            }

            case 'PARAM':
                return '<span class="param">' + (node.Variables?.[0] || 'Parameter') + '</span>';

            default:
                return '<span class="operator">' + (translations[node.Operator] || node.Operator) + '</span>';
        }
    }
}
