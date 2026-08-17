(function () {
    'use strict';

    const { PLATFORM_META, apiRequest, apiGet, showMonToast, escHtml } = window;
    const t = window.sidebarChannelsTranslations || {}; // Fallback to empty object
    const PROVIDER_MAP = { google: 'youtube', twitch: 'twitch', niconico: 'niconico', twitcasting: 'twitcasting', kick: 'kick', bilibili: 'bilibili', instagram: 'instagram', tiktok: 'tiktok', facebook: 'facebook', x: 'x' };
    const state = { connectedSet: new Set(), existingWatchSet: new Set(), selectedChannel: null, accordionLoaded: new Set(), accSearchTimers: new Map(), onChannelsChanged: null };
    const esc = (v) => escHtml(v);

    function setExistingChannels(channels) {
        state.existingWatchSet = new Set((channels || []).map((channel) => `${channel.platform}:${channel.channelId}`));
    }

    async function init(options = {}) {
        state.onChannelsChanged = options.onChannelsChanged || null;
        state.connectedSet.clear();
        state.accordionLoaded.clear();
        
        // Load pre-fetched data from embedded JSON instead of API call
        const dataEl = document.getElementById('sidebarData');
        if (dataEl) {
            try {
                const data = JSON.parse(dataEl.textContent);
                window.__sidebarData = data;  // Store for use in renderAccordionBodyContent
                (data.currentUser?.connections || []).forEach((connection) => { 
                    const platformId = PROVIDER_MAP[connection.provider]; 
                    if (platformId) state.connectedSet.add(platformId); 
                });
                if (data.currentUser?.niconico && data.currentUser.niconico.connected) {
                    state.connectedSet.add('niconico');
                }
                // Initialize thumbnail loader
                thumbnailLoader.init();
                return;  // Skip old API call entirely
            } catch (e) {
                console.error('Failed to parse sidebar data:', e);
            }
        }
        
        // Fallback: old method (for backwards compatibility)
        try {
            const user = await apiGet('/auth/user');
            (user.connections || []).forEach((connection) => { const platformId = PROVIDER_MAP[connection.provider]; if (platformId) state.connectedSet.add(platformId); });
            if (user.niconico && user.niconico.connected) state.connectedSet.add('niconico');
        } catch (_) {}
        
        // Initialize thumbnail loader even in fallback
        thumbnailLoader.init();
    }

    function toggleAcc(platformId) {
        document.getElementById('addSidebar')?.classList.remove('closed');
        const body = document.getElementById(`acc-body-${platformId}`); const chevron = document.getElementById(`acc-chev-${platformId}`); if (!body || !chevron) return;
        const header = body.previousElementSibling; const open = body.classList.toggle('open'); header.classList.toggle('open', open); chevron.style.transform = open ? 'rotate(90deg)' : '';
        if (open && !state.accordionLoaded.has(platformId)) { state.accordionLoaded.add(platformId); renderAccordionBodyContent(platformId); }
    }

    function closeAllAcc() {
        document.querySelectorAll('[id^="acc-body-"]').forEach((body) => {
            const chevron = body.parentElement?.querySelector('[id^="acc-chev-"]');
            if (!body || !chevron) return;
            body.classList.remove('open');
            body.previousElementSibling?.classList.remove('open');
            chevron.style.transform = '';
        });
    }

    function renderAccordionBodyContent(platformId) {
        const inner = document.getElementById(`acc-inner-${platformId}`); 
        const accItem = document.getElementById(`acc-${platformId}`);
        if (!inner || !accItem) return;
        
        // Get platform metadata from data attributes embedded in HTML
        const hasOAuth = accItem.dataset.hasOauth === 'true';
        const publicAccess = accItem.dataset.publicAccess === 'true';
        const connected = hasOAuth && state.connectedSet.has(platformId);
        
        // Template pre-renders all sections; just show/hide based on state
        const notConnected = inner.querySelector('.acc-not-connected');
        const stub = inner.querySelector('.acc-stub');
        const content = inner.querySelector('.acc-content');
        
        if (notConnected) notConnected.style.display = (hasOAuth && !connected) ? 'block' : 'none';
        if (stub) stub.style.display = (!hasOAuth && !publicAccess) ? 'block' : 'none';
        if (content) content.style.display = (connected || publicAccess) ? 'block' : 'none';
        
        if (hasOAuth && connected) { 
            loadAccOwnChannels(platformId);  // Lazy-load on demand
            if (platformId === 'youtube' || platformId === 'twitch') loadAccSubs(platformId, null);
        }
    }
    
    // Lazy-load own channels from API on-demand instead of pre-rendering
    async function loadAccOwnChannels(platformId) {
        const results = document.getElementById(`acc-own-${platformId}`); 
        if (!results) return;
        
        // Show loading state
        results.innerHTML = '<div class="result-loading">' + (t.loadingChannels || 'Loading your channels…') + '</div>';
        
        try {
            // Handle platform-specific endpoints
            let endpoint;
            if (platformId === 'instagram') {
                endpoint = `/platform/instagram/user/mine`;
            } else if (platformId === 'facebook') {
                endpoint = `/platform/facebook/page/mine`;
            } else if (platformId === 'x') {
                endpoint = `/platform/x/user/mine`;
            } else {
                endpoint = `/platform/${platformId}/channels/mine`;
            }
            
            const items = await apiGet(endpoint);
            renderMiniChannelResults(results, normalizePagedData(items).items, platformId, t.noOwnChannels || 'No own channels found.');
        } catch (error) { 
            results.innerHTML = `<div class="result-error">${t.failedLoadChannels || 'Failed to load channels: '}${esc(error.message)}</div>`; 
        }
    }

    function submitAccManual(event, platformId) {
        event.preventDefault(); const value = event.target.querySelector('input').value.trim(); if (!value) return; openConfirm({ platform: platformId, channelId: value, name: value, thumbnail: null });
    }

    function onAccSearch(platformId, value) {
        if (platformId === "kick" && value.length < 3) return;
        clearTimeout(state.accSearchTimers.get(platformId)); const results = document.getElementById(`acc-results-${platformId}`);
        if (!value.trim()) { if (results) results.innerHTML = ''; return; }
        state.accSearchTimers.set(platformId, setTimeout(() => doAccSearch(platformId, value.trim()), 400));
    }

    async function doAccSearch(platformId, query) {
        const results = document.getElementById(`acc-results-${platformId}`); if (!results) return; results.innerHTML = `<div class="result-loading">${t.searching || 'Searching…'}</div>`;
        try { renderMiniChannelResults(results, normalizePagedData(await apiGet(`/platform/${platformId}/search?q=${encodeURIComponent(query)}`)).items, platformId, t.noChannelsFound || 'No channels found.'); }
        catch (error) { results.innerHTML = error.status === 501 ? `<div class="stub-notice">🚧 ${t.searchComingSoon ? t.searchComingSoon.replace('{0}', esc(PLATFORM_META[platformId]?.label || platformId)) : 'Search for ' + esc(PLATFORM_META[platformId]?.label || platformId) + ' is coming soon.'}</div>` : `<div class="result-error">${t.searchFailed || 'Search failed: '}${esc(error.message)}</div>`; }
    }


    async function loadAccSubs(platformId, cursor) {
        const results = document.getElementById(`acc-subs-${platformId}`); if (!results) return; if (!cursor) results.innerHTML = `<div class="result-loading">${t.loading || 'Loading…'}</div>`;
        const param = platformId === 'youtube' ? 'page_token' : 'cursor'; const endpoint = platformId === 'youtube' ? 'subscriptions' : 'following'; const suffix = cursor ? `?${param}=${encodeURIComponent(cursor)}` : '';
        try {
            const normalized = normalizePagedData(await apiGet(`/platform/${platformId}/${endpoint}${suffix}`)); const token = normalized.next_page_token || normalized.cursor || null;
            if (!cursor) renderMiniChannelResults(results, normalized.items || normalized, platformId, t.notFollowingChannels || 'Not following any channels.', token);
            else { const fragment = document.createElement('div'); renderMiniChannelResults(fragment, normalized.items || normalized, platformId, '', token); results.querySelector('.load-more-sm')?.remove(); results.append(...fragment.childNodes); }
        } catch (error) { results.innerHTML = error.status === 501 ? '<div class="stub-notice">🚧 Not yet available.</div>' : `<div class="result-error">${t.failedLoad || 'Failed to load: '}${esc(error.message)}</div>`; }
    }

    function renderMiniChannelResults(container, items, platformId, emptyMessage, nextToken) {
        if (!items || items.length === 0) { container.innerHTML = `<div class="result-empty">${esc(emptyMessage)}</div>`; return; }
        container.innerHTML = items.map((channel) => {
            // Handle platform-specific field names
            const channelId = channel.user_id || channel.page_id || channel.channel_id || channel.id || '';
            const name = channel.display_name || channel.username || channel.title || channel.name || channel.nickname || channelId;
            const thumbnail = channel.thumbnail || channel.thumbnail_url || channel.profile_icon_small || '';
            const subtitle = channel.subscriber_count != null ? (t.subscribers || '{0} subscribers').replace("{0}", formatCount(channel.subscriber_count)) : (channel.follower_count != null ? (t.followers || '{0} followers').replace("{0}", formatCount(channel.follower_count)) : '');
            const added = state.existingWatchSet.has(`${platformId}:${channelId}`);
            // Use platform icon SVG if no thumbnail, fallback to emoji
            const placeholderIcon = (window.__platformIcons && window.__platformIcons[platformId]) || (PLATFORM_META[platformId]?.icon || '📺');
            const thumb = thumbnail ? `<img class="mini-thumb-img" src="${esc(thumbnail)}" alt="" loading="lazy">` : `<div class="mini-thumb-placeholder" style="display:flex; align-items:center; justify-content:center; width:100%; height:100%;">${typeof placeholderIcon === 'string' && placeholderIcon.includes('<svg') ? placeholderIcon : `<span>${esc(placeholderIcon)}</span>`}</div>`;
            return `<div class="mini-card" data-platform="${esc(platformId)}" data-channel-id="${esc(channelId)}" data-thumb-loaded="${thumbnail ? 'true' : 'false'}"><div class="mini-thumb">${thumb}</div><div class="mini-info"><div class="mini-name">${esc(name)}</div><div class="mini-meta subscriber-count">${subtitle}</div></div>${added ? '<span class="mini-badge-added">' + (t.added || 'Added') + '</span>' : `<button class="mini-add-btn" title="${t.addChannelTitle || 'Add channel'}" onclick='openConfirm(${JSON.stringify({ platform: platformId, channelId, name, thumbnail: thumbnail || null })})'>+</button>`}</div>`;
        }).join('') + (nextToken ? `<button class="load-more-sm" onclick="loadAccSubs('${platformId}', '${esc(nextToken)}')">${t.loadMore || 'Load more…'}</button>` : '');
        
        // Trigger thumbnail loading for newly rendered items (for scroll-based loading)
        if (thumbnailLoader) thumbnailLoader.onDOMUpdate();
    }

    function openConfirm(channel) {
        // Store channel for validation
        state.selectedChannel = channel;
        // Validate channel access before showing confirmation drawer
        validateAndShowConfirm(channel);
    }

    async function validateAndShowConfirm(channel) {
        const meta = PLATFORM_META[channel.platform] || { icon: '📺', label: channel.platform };
        // Use platform icon SVG if no thumbnail, fallback to emoji
        const svgIcon = (window.__platformIcons && window.__platformIcons[channel.platform]) || null;
        const iconDisplay = svgIcon && svgIcon.includes('<svg') ? svgIcon : (meta.icon ? `<span style="font-size:32px;">${meta.icon}</span>` : '📺');
        const thumb = channel.thumbnail ? `<img style="width:100%; height:100%; object-fit:cover; border-radius:4px;" src="${esc(channel.thumbnail)}" alt="">` : `<div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%;">${iconDisplay}</div>`;
        
        // Prepare preview
        const confirmPreview = document.getElementById('confirmPreview');
        const confirmName = document.getElementById('confirmName');
        const confirmActive = document.getElementById('confirmActive');
        const confirmAddBtn = document.getElementById('confirmAddBtn');
        const confirmError = document.getElementById('confirmError');
        
        // Show preview with greyed-out state initially while validating
        confirmPreview.innerHTML = `<div class="cf-platform-icon ${esc(channel.platform)}" style="position:relative; width:80px; height:80px; border-radius:4px; flex-shrink:0; overflow:hidden;">${thumb}</div><div class="cf-channel-info"><strong>${esc(channel.name)}</strong><span>${meta.icon} ${esc(meta.label)} · ${esc(channel.channelId)}</span></div>`;
        confirmName.value = channel.name || '';
        confirmActive.checked = true;
        confirmError.style.display = 'none';
        confirmAddBtn.disabled = false;
        confirmAddBtn.textContent = t.validating || 'Validating…';
        
        // Show drawer
        document.getElementById('confirmOverlay').style.display = 'block';
        document.getElementById('confirmDrawer').classList.add('open');
        
        // Validate channel access
        try {
            const validation = await apiRequest('POST', '/watches/validate-channel-access', {
                platform: channel.platform,
                channel_id: channel.channelId.toString()
            });
            
            if (validation.is_accessible) {
                // Validation passed - enable add button
                confirmAddBtn.disabled = false;
                confirmAddBtn.textContent = t.addChannelTitle || '+ Add Channel';
                confirmName.style.opacity = '1';
                confirmActive.style.opacity = '1';
                confirmError.style.display = 'none';
                confirmName.focus();
            } else {
                // Validation failed - disable and show error
                confirmAddBtn.disabled = true;
                confirmAddBtn.textContent = t.cannotAdd || 'Cannot Add';
                confirmName.style.opacity = '0.5';
                confirmActive.style.opacity = '0.5';
                
                // Build error message with details
                let errorMsg = validation.error || (t.failedValidateChannel || 'Cannot access this channel');
                if (validation.suggestion) {
                    errorMsg += '\n\n💡 ' + validation.suggestion;
                }
                confirmError.textContent = errorMsg;
                confirmError.style.display = 'block';
                confirmError.style.whiteSpace = 'pre-wrap';
            }
        } catch (error) {
            // API call failed - show error
            confirmAddBtn.disabled = true;
            confirmAddBtn.textContent = t.cannotAdd || 'Cannot Add';
            confirmName.style.opacity = '0.5';
            confirmActive.style.opacity = '0.5';
            confirmError.textContent = t.failedValidateChannel || 'Failed to validate channel access';
            confirmError.style.display = 'block';
        }
    }

    function cancelConfirm() { document.getElementById('confirmOverlay').style.display = 'none'; document.getElementById('confirmDrawer').classList.remove('open'); state.selectedChannel = null; }
    function showConfirmError(message) { const error = document.getElementById('confirmError'); error.textContent = message; error.style.display = 'block'; }
    async function confirmAdd() {
        const button = document.getElementById('confirmAddBtn');
        // Check if validation failed (button disabled due to channel access error)
        if (button.disabled && button.textContent === (t.cannotAdd || 'Cannot Add')) {
            showConfirmError(t.channelNotAccessible || 'This channel cannot be accessed. Please check the error message above.');
            return;
        }
        if (!state.selectedChannel) return;
        const name = document.getElementById('confirmName').value.trim();
        if (!name) { showConfirmError(t.emptyName || 'Please enter a display name.'); return; }
        button.disabled = true;
        button.textContent = t.adding || 'Adding…';
        document.getElementById('confirmError').style.display = 'none';
        try {
            const body = { platform: state.selectedChannel.platform, channel_id: state.selectedChannel.channelId.toString(), name, is_active: document.getElementById('confirmActive').checked };
            if (state.selectedChannel.thumbnail) body.thumbnail_url = state.selectedChannel.thumbnail;
            await apiRequest('POST', '/watches', body);
            state.existingWatchSet.add(`${state.selectedChannel.platform}:${state.selectedChannel.channelId.toString()}`);
            cancelConfirm();
            showMonToast(`✅ "${name}" added!`);
            if (typeof state.onChannelsChanged === 'function') await state.onChannelsChanged();
        } catch (error) {
            showConfirmError(error.message || (t.failedAddChannel || 'Failed to add channel.'));
            button.disabled = false;
            button.textContent = t.addChannelTitle || '+ Add Channel';
        }
    }

    function normalizePagedData(data) { if (Array.isArray(data)) return { items: data, next_page_token: null, cursor: null }; if (data && Array.isArray(data.items)) return data; return { items: [], next_page_token: null, cursor: null }; }
    function formatCount(value) { if (value == null) return ''; if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`; if (value >= 1000) return `${(value / 1000).toFixed(1)}K`; return String(value); }

    // Thumbnail lazy-loading system (scroll-based)
    const thumbnailLoader = {
        cache: new Map(),          // `twitch:channel_id` → URL or "failed"
        queue: [],                 // Items pending load
        activeRequests: 0,         // Currently loading
        maxConcurrent: 5,          // Max simultaneous API calls
        lastProcessedScroll: 0,    // Track scroll position
        scrollThreshold: 400,      // pixels between load batches
        loadedThreshold: 10,       // Initial items to load on first call
        scrollTimeout: null,
        
        init() {
            // Load initial batch from top
            this.loadInitialBatch(this.loadedThreshold);
            
            // Attach scroll listener with throttle
            document.addEventListener('scroll', () => this.handleScroll(), { passive: true });
        },
        
        handleScroll() {
            if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
            this.scrollTimeout = setTimeout(() => this.onScroll(), 100);
        },
        
        onScroll() {
            const scrollY = window.scrollY;
            const rangeIndex = Math.floor(scrollY / this.scrollThreshold);
            
            // Only process if we've scrolled into a new 400px range
            if (rangeIndex !== this.lastProcessedScroll) {
                this.lastProcessedScroll = rangeIndex;
                
                const rangeStart = rangeIndex * this.scrollThreshold;
                const rangeEnd = rangeStart + this.scrollThreshold;
                
                this.loadThumbnailsInRange(rangeStart, rangeEnd);
            }
        },
        
        loadInitialBatch(count) {
            const cards = Array.from(document.querySelectorAll('.mini-card')).slice(0, count);
            cards.forEach(card => this.queueCardLoad(card));
        },
        
        loadThumbnailsInRange(startY, endY) {
            const cards = document.querySelectorAll('.mini-card');
            
            cards.forEach(card => {
                if (card.dataset.thumbLoaded === 'true') return;
                
                const rect = card.getBoundingClientRect();
                const cardY = window.scrollY + rect.top;
                
                if (cardY >= startY && cardY <= endY + 100) {
                    this.queueCardLoad(card);
                }
            });
        },
        
        queueCardLoad(card) {
            const platformId = card.dataset.platform;
            const channelId = card.dataset.channelId;
            
            if (!platformId || !channelId) return;
            if (card.dataset.thumbLoaded === 'true') return;
            
            // Skip non-Twitch for now (can extend later)
            if (platformId !== 'twitch') return;
            
            const key = `${platformId}:${channelId}`;
            
            // Already cached?
            if (this.cache.has(key)) {
                const cached = this.cache.get(key);
                const url = typeof cached === 'string' ? cached : cached.url;
                const followerCount = typeof cached === 'object' ? cached.followerCount : null;
                this.applyThumbnail(card, url, followerCount);
                return;
            }
            
            // Already queued? Don't duplicate
            if (this.queue.find(item => item.platform === platformId && item.channelId === channelId)) {
                return;
            }
            
            this.queue.push({ platform: platformId, channelId, card });
            this.processQueue();
        },
        
        async processQueue() {
            while (this.activeRequests < this.maxConcurrent && this.queue.length > 0) {
                this.activeRequests++;
                const { platform, channelId, card } = this.queue.shift();
                
                try {
                    const response = await apiGet(`/platform/${platform}/channel/${encodeURIComponent(channelId)}`);
                    const url = response.thumbnail_url || "";
                    const followerCount = response.follower_count;
                    
                    this.cache.set(`${platform}:${channelId}`, { url, followerCount });
                    
                    // Card may have been replaced by now, find current one
                    const currentCard = document.querySelector(`.mini-card[data-platform="${platform}"][data-channel-id="${channelId}"]`);
                    if (currentCard) {
                        this.applyThumbnail(currentCard, url, followerCount);
                    }
                } catch (err) {
                    console.error(`Failed to load thumbnail for ${platform}:${channelId}`, err);
                    this.cache.set(`${platform}:${channelId}`, { url: "failed", followerCount: null });
                } finally {
                    this.activeRequests--;
                    this.processQueue();
                }
            }
        },
        
        applyThumbnail(card, url, followerCount) {
            if (!url || url === "failed") {
                card.dataset.thumbLoaded = 'true';
                return; // Silent fail - keep platform icon
            }
            
            const thumb = card.querySelector('.mini-thumb');
            if (!thumb) return;
            
            // Only update if placeholder is still showing
            const placeholder = thumb.querySelector('.mini-thumb-placeholder');
            if (placeholder) {
                thumb.innerHTML = `<img class="mini-thumb-img" src="${esc(url)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'mini-thumb-placeholder\\' style=\\'display:flex;align-items:center;justify-content:center;width:100%;height:100%;\\'>📺</div>'">`;
            }
            
            // Update follower count if available
            if (followerCount != null) {
                const meta = card.querySelector('.mini-meta');
                if (meta) {
                    const followerText = (t.followers || '{0} followers').replace("{0}", formatCount(followerCount));
                    meta.textContent = followerText;
                }
            }
            
            card.dataset.thumbLoaded = 'true';
        },
        
        onDOMUpdate() {
            // Called when new items are rendered - refresh initial batch if needed
            const unloadedCards = document.querySelectorAll('.mini-card[data-thumb-loaded="false"]');
            if (unloadedCards.length > 0) {
                // Queue first few unloaded cards
                Array.from(unloadedCards).slice(0, 10).forEach(card => this.queueCardLoad(card));
            }
        }
    };

    Object.assign(window, { toggleAcc, closeAllAcc, onAccSearch, loadAccSubs, submitAccManual, openConfirm, cancelConfirm, confirmAdd });
    window.ChannelsSidebar = { init, setExistingChannels, closeAllAcc };
    window.thumbnailLoader = thumbnailLoader; // Expose for testing
})();
