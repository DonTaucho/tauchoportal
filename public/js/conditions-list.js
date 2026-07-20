(function () {
    'use strict';
    const { PLATFORM_META, PLATFORM_EVENTS, PRODUCTS, apiRequest, escHtml, formatDate, formatDateTime, openModal, closeModal, getEventLabel, buildTestEvent, getEventParameters } = window;
    const EVENT_BADGE_CLASS = { comment: 'comment', superchat: 'gift', sticker: 'gift', cheer: 'gift', gift: 'gift', member: 'follow', follow: 'follow', sub: 'follow', nicoru: 'effect', hype_train: 'stream', raid: 'stream', stream_start: 'stream', stream_end: 'stream' };
    let CHANNELS = [], editingConditionId = null, testingConditionId = null, deviceCache = null;

    async function loadWatches() { 
        CHANNELS = (await apiRequest('GET', '/watches')).map((watch) => ({ id: watch.id, name: watch.name, platform: watch.platform, channelId: watch.channel_id, lastStream: formatDate(watch.last_stream_at, 'Never') })); 
        window.ChannelsSidebar.setExistingChannels(CHANNELS); 
    }

    async function route() { 
        await loadWatches(); 
        window.scrollTo(0, 0); 
    }

    function getChannelIdFromUrl() {
        const match = window.location.pathname.match(/^\/channels\/([^\/]+)\/conditions\/?$/);
        return match ? match[1] : null;
    }

    function getChannelNameFromDOM() {
        return document.querySelector('.breadcrumb a[href*="/channels/"]')?.textContent || '';
    }

    function getPlatformFromDOM() {
        const iconSpan = document.querySelector('.page-header-top .platform-icon-sm');
        if (iconSpan) {
            const classes = iconSpan.className;
            // Extract platform from className - it's the second class after "platform-icon-sm"
            const parts = classes.split(' ');
            const platformIdx = parts.indexOf('platform-icon-sm');
            if (platformIdx !== -1 && parts[platformIdx + 1]) {
                return parts[platformIdx + 1];
            }
        }
        return null;
    }

    function getConditionNameFromCard(conditionId) {
        const card = document.querySelector(`[data-cond-id="${conditionId}"]`);
        return card ? card.querySelector('.rule-name')?.textContent || '' : '';
    }

    function navigate(path) { 
        window.location.href = path; 
    }

    function filterConds(type, button) { 
        document.querySelectorAll('.filter-tabs .filter-tab').forEach((tab) => tab.classList.remove('active')); 
        button.classList.add('active'); 
        document.querySelectorAll('#conditionsList .rule-card').forEach((card) => { 
            card.style.display = type === 'all' || card.dataset.type === type ? 'block' : 'none'; 
        }); 
    }

    async function openAddConditionModal() { 
        editingConditionId = null; 
        const channelName = getChannelNameFromDOM();
        const platform = getPlatformFromDOM();
        document.getElementById('condModalTitle').textContent = 'Add Condition'; 
        document.getElementById('condModalSubtitle').textContent = `Define when to trigger an action on ${channelName}.`; 
        document.getElementById('condSaveBtn').textContent = 'Add Condition'; 
        document.getElementById('conditionForm').reset(); 
        document.getElementById('condFilterGroup').style.display = 'none'; 
        document.getElementById('condActionSelectGroup').style.display = 'none'; 
        document.getElementById('condColorGroup').style.display = 'none'; 
        document.getElementById('condBrightnessGroup').style.display = 'none'; 
        document.getElementById('condBrightness').value = 50; 
        document.getElementById('condBrightnessVal').textContent = '50'; 
        document.querySelectorAll('.color-preset').forEach((button, index) => button.classList.toggle('selected', index === 0)); 
        if (platform) populateEventSelect(platform); 
        await toggleDeviceAction(document.getElementById('condHasDevice')); 
        openModal('conditionModal'); 
    }

    async function openEditConditionModal(conditionId) { 
        editingConditionId = conditionId; 
        const card = document.querySelector(`[data-cond-id="${conditionId}"]`);
        const channelName = getChannelNameFromDOM();
        const platform = getPlatformFromDOM();
        
        const eventType = card?.dataset.type || '';
        const conditionName = card?.querySelector('.rule-name')?.textContent || '';
        const filterValue = card?.querySelector('.rule-detail-value')?.textContent?.match(/containing <code>"([^"]*)"<\/code>/) || null;
        const isEnabled = card?.querySelector('input[type="checkbox"]')?.checked || false;
        
        document.getElementById('condModalTitle').textContent = 'Edit Condition'; 
        document.getElementById('condModalSubtitle').textContent = `Update this condition for ${channelName}.`; 
        document.getElementById('condSaveBtn').textContent = 'Save Changes'; 
        document.getElementById('conditionForm').reset(); 
        document.getElementById('condName').value = conditionName; 
        if (platform) populateEventSelect(platform); 
        document.getElementById('condEventType').value = eventType; 
        updateCondEventFields(); 
        document.getElementById('condFilter').value = filterValue ? filterValue[1] : ''; 
        document.getElementById('condEnabled').checked = isEnabled; 
        document.getElementById('condHasDevice').checked = false; 
        document.getElementById('condBrightness').value = 50; 
        document.getElementById('condBrightnessVal').textContent = '50'; 
        document.querySelectorAll('.color-preset').forEach((button, index) => button.classList.toggle('selected', index === 0)); 
        await toggleDeviceAction(document.getElementById('condHasDevice')); 
        openModal('conditionModal'); 
    }

    async function populateEventSelect(platform) { 
        try {
            const events = await window.getEventsForPlatform(platform);
            document.getElementById('condEventType').innerHTML = '<option value="">Select event type...</option>' + (events || []).map((eventType) => `<option value="${eventType.value}">${eventType.value}</option>`).join('');
        } catch (e) {
            console.error('Failed to populate events:', e);
        }
    }

    function updateCondEventFields() { 
        document.getElementById('condFilterGroup').style.display = document.getElementById('condEventType').value === 'comment' ? 'block' : 'none'; 
    }

    async function saveCondition(event) { 
        event.preventDefault(); 
        const button = document.getElementById('condSaveBtn'); 
        button.disabled = true; 
        try { 
            const deviceId = document.getElementById('condHasDevice').checked ? document.getElementById('condDeviceSelect').value || null : null; 
            const deviceAction = deviceId ? document.getElementById('condActionSelect').value || null : null; 
            const deviceActionParams = {}; 
            if (deviceAction === 'color') { 
                const selected = document.querySelector('.color-preset.selected'); 
                if (selected) deviceActionParams.color = selected.dataset.color; 
            } 
            if (deviceAction === 'brightness') deviceActionParams.brightness = parseInt(document.getElementById('condBrightness').value, 10); 
            const body = { 
                watch_id: getChannelIdFromUrl(), 
                name: document.getElementById('condName').value, 
                event_type: document.getElementById('condEventType').value, 
                filter: document.getElementById('condFilter').value || '', 
                is_enabled: document.getElementById('condEnabled').checked, 
                device_id: deviceId, 
                device_action: deviceAction, 
                device_action_params: Object.keys(deviceActionParams).length ? deviceActionParams : null 
            }; 
            if (editingConditionId) { 
                await apiRequest('PATCH', `/conditions/update?id=${editingConditionId}`, body); 
            } else { 
                await apiRequest('POST', '/conditions', body); 
            } 
            closeModal('conditionModal'); 
            window.location.reload(); 
        } catch (error) { 
            alert('Failed to save condition: ' + error.message); 
        } finally { 
            button.disabled = false; 
        } 
    }

    async function toggleCondition(conditionId, checkbox) { 
        try { 
            await apiRequest('PATCH', `/conditions/update?id=${conditionId}`, { is_enabled: checkbox.checked }); 
            window.location.reload(); 
        } catch (error) { 
            checkbox.checked = !checkbox.checked; 
            alert('Failed to update condition: ' + error.message); 
        } 
    }

    async function deleteCondition(conditionId) { 
        if (!confirm('Delete this condition?\n\nThis event will no longer trigger any actions.')) return; 
        try { 
            await apiRequest('DELETE', `/conditions?id=${conditionId}`); 
            window.location.reload(); 
        } catch (error) { 
            alert('Failed to delete condition: ' + error.message); 
        } 
    }

    async function openTestConditionModal(conditionId) { 
        testingConditionId = conditionId; 
        const conditionName = getConditionNameFromCard(conditionId);
        const card = document.querySelector(`[data-cond-id="${conditionId}"]`);
        const eventType = card?.dataset.type || '';
        const platform = getPlatformFromDOM();

        document.getElementById('testConditionTitle').textContent = `Test Condition: ${conditionName}`; 
        try {
            const events = await window.getEventsForPlatform(platform);
            document.getElementById('testEventType').innerHTML = '<option value="">Select event type...</option>' + (events || []).map((evt) => `<option value="${evt.value}">${evt.value}</option>`).join('');
        } catch (e) {
            console.error('Failed to populate test events:', e);
        }
        document.getElementById('testEventType').value = eventType; 
        document.getElementById('testTriggerRealDevice').checked = false; 
        document.getElementById('testResultsContainer').style.display = 'none'; 
        await updateTestEventParams(); 
        openModal('testConditionModal'); 
    }

    async function updateTestEventParams() { 
        const eventType = document.getElementById('testEventType').value; 
        const platform = getPlatformFromDOM();
        const container = document.getElementById('testEventParamsContainer'); 
        container.innerHTML = ''; 
        if (!eventType || !platform) return; 
        
        const params = await window.getEventParameters(platform, eventType); 
        (params || []).forEach((param) => { 
            const group = document.createElement('div'); 
            group.className = 'form-group'; 
            group.innerHTML = param.type === 'checkbox' 
                ? `<label class="checkbox-label"><input type="checkbox" id="param_${param.name}" ${param.value ? 'checked' : ''}><span>${param.label}</span></label>` 
                : `<label>${param.label}</label><input type="${param.type === 'number' ? 'number' : 'text'}" id="param_${param.name}" value="${param.value}">`; 
            container.appendChild(group); 
        }); 
    }

    async function runConditionTest() { 
        const eventType = document.getElementById('testEventType').value; 
        const platform = getPlatformFromDOM();
        if (!eventType) return alert('Please select an event type'); 
        const button = document.getElementById('testConditionBtn'); 
        button.disabled = true; 
        try { 
            const customParams = {}; 
            const params = await window.getEventParameters(platform, eventType);
            (params || []).forEach((param) => { 
                const input = document.getElementById(`param_${param.name}`); 
                if (input) customParams[param.name] = param.type === 'checkbox' ? input.checked : input.value; 
            }); 
            displayTestResults(await apiRequest('POST', `/conditions/${testingConditionId}/test`, { 
                test_event: buildTestEvent(eventType, platform, customParams), 
                trigger_real_device: document.getElementById('testTriggerRealDevice').checked 
            })); 
        } catch (error) { 
            alert('Failed to test condition: ' + error.message); 
        } finally { 
            button.disabled = false; 
        } 
    }

    function displayTestResults(response) { 
        const container = document.getElementById('testResultsContainer'); 
        const content = document.getElementById('testResultsContent'); 
        container.style.display = 'block'; 
        content.innerHTML = `<p><strong>${response.matched ? '✅ MATCHED' : '❌ NO MATCH'}</strong></p><p><strong>Would trigger device:</strong> ${response.would_trigger ? 'Yes' : 'No'}</p><p><strong>Device:</strong> ${response.device_id || 'None'}</p><p><strong>Action:</strong> ${response.device_action || 'None'}</p>${response.computed_values && response.computed_values.length ? `<p><strong>Computed values:</strong> ${response.computed_values.map((value) => `<code>${escHtml(value)}</code>`).join(', ')}</p>` : ''}${response.execution_error ? `<p style="color:red"><strong>Error:</strong> ${escHtml(response.execution_error)}</p>` : ''}${response.execution_result ? `<p style="color:green"><strong>Result:</strong> ${escHtml(response.execution_result)}</p>` : ''}`; 
    }

    function editConditionLogic(conditionId) { 
        navigate(`/channels/${getChannelIdFromUrl()}/conditions/${conditionId}`); 
    }

    async function toggleDeviceAction(checkbox) { 
        const enabled = checkbox.checked; 
        document.getElementById('deviceActionFields').style.display = enabled ? 'block' : 'none'; 
        if (enabled) await populateDeviceDropdown(); 
        else { 
            document.getElementById('condDeviceSelect').value = ''; 
            document.getElementById('condActionSelect').value = ''; 
            document.getElementById('condActionSelectGroup').style.display = 'none'; 
            updateCondActionParams(); 
        } 
    }

    async function populateDeviceDropdown() { 
        const select = document.getElementById('condDeviceSelect'); 
        while (select.options.length > 1) select.remove(1); 
        try { 
            if (!deviceCache) deviceCache = await apiRequest('GET', '/devices'); 
            deviceCache.forEach((device) => select.add(new Option(`${device.name} (${device.brand})`, device.id))); 
        } catch (error) { 
            console.error('Failed to load devices:', error); 
        } 
    }

    function updateCondActionSelect() { 
        const select = document.getElementById('condDeviceSelect'); 
        const device = (deviceCache || []).find((item) => item.id === select.value); 
        const group = document.getElementById('condActionSelectGroup'); 
        const actionSelect = document.getElementById('condActionSelect'); 
        if (!device || !PRODUCTS[device.product_id]?.actions?.length) { 
            group.style.display = 'none'; 
            actionSelect.value = ''; 
            updateCondActionParams(); 
            return; 
        } 
        const currentValue = actionSelect.value; 
        group.style.display = 'block'; 
        while (actionSelect.options.length > 1) actionSelect.remove(1); 
        const labels = { 
            on: 'Turn On', 
            off: 'Turn Off', 
            toggle: 'Toggle On/Off', 
            color: 'Set Color', 
            brightness: 'Set Brightness', 
            color_temp: 'Set Color Temperature', 
            scene: 'Scene Mode', 
            flash: 'Flash Alert' 
        }; 
        PRODUCTS[device.product_id].actions.forEach((action) => actionSelect.add(new Option(labels[action] || action, action))); 
        if (currentValue && PRODUCTS[device.product_id].actions.includes(currentValue)) actionSelect.value = currentValue; 
        updateCondActionParams(); 
    }

    function updateCondActionParams() { 
        const action = document.getElementById('condActionSelect').value; 
        document.getElementById('condColorGroup').style.display = action === 'color' ? 'block' : 'none'; 
        document.getElementById('condBrightnessGroup').style.display = action === 'brightness' ? 'block' : 'none'; 
    }

    function selectCondColor(button) { 
        document.querySelectorAll('.color-preset').forEach((item) => item.classList.remove('selected')); 
        button.classList.add('selected'); 
    }

    Object.assign(window, { 
        loadWatches, filterConds, openAddConditionModal, openEditConditionModal, populateEventSelect, 
        updateCondEventFields, saveCondition, toggleCondition, deleteCondition, openTestConditionModal, 
        updateTestEventParams, runConditionTest, displayTestResults, toggleDeviceAction, populateDeviceDropdown, 
        updateCondActionSelect, updateCondActionParams, selectCondColor, editConditionLogic, navigate, route 
    });

    Promise.all([route(), window.ChannelsSidebar.init({ onChannelsChanged: route })]);
})();
