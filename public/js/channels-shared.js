(function () {
    'use strict';

    // Cache for event metadata to avoid repeated API calls
    let eventMetadataCache = {};
    let platformEventsCache = {};

    // Stub vars - will be populated from API
    let PLATFORM_EVENTS = {};
    let EVENT_PARAMETERS = {};

    // API helper that will be defined later
    let apiGet_func = null;

    // Fetch and cache event metadata for a specific platform/event combo
    async function getEventMetadata(platform, eventType) {
        if (!apiGet_func) return null;
        const cacheKey = `${platform}:${eventType}`;
        if (eventMetadataCache[cacheKey]) {
            return eventMetadataCache[cacheKey];
        }
        try {
            const data = await apiGet_func(`/event-metadata/${platform}/${eventType}`);
            eventMetadataCache[cacheKey] = data;
            return data;
        } catch (e) {
            console.error(`Failed to fetch event metadata for ${platform}/${eventType}:`, e);
            return null;
        }
    }

    // Fetch and cache available events for a specific platform
    async function getEventsForPlatform(platform) {
        console.log('[getEventsForPlatform] Called for platform:', platform);
        if (!apiGet_func) {
            console.error('[getEventsForPlatform] apiGet_func is null!');
            return [];
        }
        
        if (!platform) {
            console.error('[getEventsForPlatform] Platform is null or empty!');
            return [];
        }
        
        const cacheKey = `platform:${platform}`;
        if (platformEventsCache[cacheKey]) {
            console.log('[getEventsForPlatform] Returning cached data for', platform);
            return platformEventsCache[cacheKey];
        }
        
        try {
            console.log('[getEventsForPlatform] Calling API: /event-metadata/' + platform);
            const data = await apiGet_func(`/event-metadata/${platform}`);
            console.log('[getEventsForPlatform] API response received:', data);
            // Transform from { platform, events: ["comment", "gift", ...] }
            // to [{ value: 'comment' }, { value: 'gift' }, ...]
            const events = (data.events || []).map(evt => ({ value: evt }));
            platformEventsCache[cacheKey] = events;
            console.log('[getEventsForPlatform] Cached for', platform, ':', events);
            return events;
        } catch (e) {
            console.error(`Failed to fetch events for platform ${platform}:`, e);
            return [];
        }
    }

    // Convert API field response to form field structure
    // API returns: { platform, event_type, fields: { name: { name, type, description, optional }, ... } }
    // We need: [{ name: 'field_name', label: 'field_name', type: 'text/number/checkbox', value: '' }, ...]
    async function getEventParameters(platform, eventType) {
        const metadata = await getEventMetadata(platform, eventType);
        if (!metadata || !metadata.fields) return [];
        
        // Map API field types to HTML input types
        const typeMapping = {
            'string': 'text',
            'number': 'number',
            'boolean': 'checkbox',
            'timestamp': 'text',
            'array': 'text'
        };
        
        return Object.entries(metadata.fields)
            .filter(([_, field]) => !field.optional) // Only include non-optional fields
            .map(([fieldName, field]) => ({
                name: fieldName,
                label: field.name || fieldName, // Use field.name from API, fallback to key
                type: typeMapping[field.type] || 'text',
                value: field.type === 'boolean' ? false : (field.type === 'number' ? '0' : '')
            }));
    }

    // Initialize event metadata from API
    async function initializeEventMetadata() {
        try {
            const events = await getPlatformEvents();
            PLATFORM_EVENTS = events;
        } catch (e) {
            console.error('Failed to initialize event metadata:', e);
        }
    }

    const PRODUCTS = {
        'govee-h6159': { actions: ['on', 'off', 'color', 'brightness', 'scene', 'flash'] }, 'govee-h6052': { actions: ['on', 'off', 'color', 'brightness', 'color_temp'] }, 'govee-h7021': { actions: ['on', 'off', 'color', 'brightness'] }, 'govee-h5080': { actions: ['on', 'off', 'toggle'] }, 'hue-color': { actions: ['on', 'off', 'color', 'brightness', 'color_temp', 'scene'] }, 'hue-white': { actions: ['on', 'off', 'brightness', 'color_temp'] }, 'hue-strip': { actions: ['on', 'off', 'color', 'brightness', 'scene'] }, 'hue-plug': { actions: ['on', 'off', 'toggle'] }, 'kasa-ep10': { actions: ['on', 'off', 'toggle'] }, 'kasa-ep40': { actions: ['on', 'off', 'toggle'] }, 'kasa-lb130': { actions: ['on', 'off', 'color', 'brightness'] }, 'lifx-color': { actions: ['on', 'off', 'color', 'brightness', 'color_temp', 'scene'] }, 'lifx-mini': { actions: ['on', 'off', 'brightness', 'color_temp'] }, 'lifx-strip': { actions: ['on', 'off', 'color', 'brightness', 'scene'] }, 'tuya-bulb': { actions: ['on', 'off', 'color', 'brightness'] }, 'tuya-plug': { actions: ['on', 'off', 'toggle'] }, 'tuya-strip': { actions: ['on', 'off', 'color', 'brightness'] }, 'nano-shapes': { actions: ['on', 'off', 'color', 'brightness', 'scene'] }, 'nano-lines': { actions: ['on', 'off', 'color', 'brightness', 'scene'] }, 'nano-canvas': { actions: ['on', 'off', 'color', 'brightness', 'scene'] }, 'yee-color': { actions: ['on', 'off', 'color', 'brightness', 'color_temp'] }, 'yee-strip': { actions: ['on', 'off', 'color', 'brightness'] }, 'yee-desk': { actions: ['on', 'off', 'brightness', 'color_temp'] }, 'wled-ctrl': { actions: ['on', 'off', 'color', 'brightness', 'scene', 'flash'] }, 'wyze-plug': { actions: ['on', 'off', 'toggle'] }, 'wyze-bulb': { actions: ['on', 'off', 'color', 'brightness', 'color_temp'] }, 'amz-plug': { actions: ['on', 'off', 'toggle'] }, 'echo-flex': { actions: ['on', 'off', 'toggle'] },
    };

    const platformIcons = window.__platformIcons || {};
    const PLATFORM_META = { youtube: { icon: platformIcons.youtube, label: 'YouTube' }, twitch: { icon: platformIcons.twitch, label: 'Twitch' }, niconico: { icon: platformIcons.niconico, label: 'NicoNico' }, instagram: { icon: platformIcons.instagram, label: 'Instagram' }, tiktok: { icon: platformIcons.tiktok, label: 'TikTok' }, kick: { icon: platformIcons.kick, label: 'Kick' }, facebook: { icon: platformIcons.facebook, label: 'Facebook' }, x: { icon: platformIcons.x, label: 'X' }, bilibili: { icon: platformIcons.bilibili, label: 'Bilibili' }, twitcasting: { icon: platformIcons.twitcasting, label: 'TwitCasting' } };

    const escHtml = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const isZeroDate = (v) => !v || v === '0001-01-01T00:00:00Z' || v === '0001-01-01';
    const formatDate = (v, fb = '-') => isZeroDate(v) ? fb : new Date(v).toLocaleDateString();
    const formatDateTime = (v, fb = '-') => isZeroDate(v) ? fb : new Date(v).toLocaleString();
    const hasActiveFilter = (f) => !!(f && ((f.skip_if_title_contains && f.skip_if_title_contains.length) || (f.skip_if_description_contains && f.skip_if_description_contains.length) || (f.require_title_contains && f.require_title_contains.length)));
    const getApiBase = () => typeof API_BASE !== 'undefined' ? API_BASE : '/api';

    async function apiRequest(method, path, body) {
        const options = { method, credentials: 'include', headers: {} };
        if (body) { options.headers['Content-Type'] = 'application/json'; options.body = JSON.stringify(body); }
        const response = await fetch(getApiBase() + path, options);
        if (!response.ok) throw new Error(await response.text() || response.status);
        return response.status === 204 ? null : response.json();
    }
    async function apiGet(path) {
        const response = await fetch(getApiBase() + path, { credentials: 'include' });
        if (!response.ok) {
            const error = new Error(await response.text() || response.status);
            error.status = response.status;
            throw error;
        }
        return response.json();
    }
    function navigate(path) {
        window.location.href = path;
    }
    function openModal(id) { const modal = document.getElementById(id); if (!modal) return; modal.style.display = 'block'; document.body.style.overflow = 'hidden'; }
    function closeModal(id) { const modal = document.getElementById(id); if (!modal) return; modal.style.display = 'none'; document.body.style.overflow = 'auto'; }
    function showMonToast(message) { const toast = document.getElementById('monToast'); if (!toast) return; toast.textContent = message; toast.classList.add('visible'); setTimeout(() => toast.classList.remove('visible'), 3000); }
    function getEventLabel(type, platform) { const event = (PLATFORM_EVENTS[platform] || []).find((item) => item.value === type); return event ? type : type; }
    function buildTestEvent(eventType, platform, customParams = {}) { const activeChannel = typeof window.currentChannel !== 'undefined' ? window.currentChannel : null; return { id: 'evt_test_' + Date.now(), user_id: 1, watch_target_id: activeChannel ? activeChannel.id : 'watch_1', platform, event_type: eventType, message: customParams.event_message || '', amount_value: parseInt(customParams.event_amount, 10) || 0, amount_currency: 'USD', amount_display: customParams.event_amount ? `$${customParams.event_amount}` : '$0', sender_name: customParams.event_sender_name || 'TestUser', sender_id: customParams.event_sender_id || 'user_test_123', sender_avatar: '', is_member: customParams.event_is_member === true || customParams.event_is_member === 'true', is_mod: customParams.event_is_mod === true || customParams.event_is_mod === 'true', badges: [], received_at: new Date().toISOString(), created_at: new Date().toISOString() }; }

    // Set up apiGet_func for use in API fetch functions
    apiGet_func = apiGet;
    
    window.onclick = function (event) { ['conditionModal', 'filterModal', 'testConditionModal'].forEach((id) => { if (event.target === document.getElementById(id)) closeModal(id); }); };
    Object.assign(window, { PLATFORM_EVENTS, EVENT_PARAMETERS, PLATFORM_META, PRODUCTS, escHtml, isZeroDate, formatDate, formatDateTime, hasActiveFilter, navigate, openModal, closeModal, showMonToast, apiRequest, apiGet, getEventLabel, buildTestEvent, getEventMetadata, getEventParameters, getEventsForPlatform });
})();


