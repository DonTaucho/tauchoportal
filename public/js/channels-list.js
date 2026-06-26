(function () {
    'use strict';
    const { apiRequest, openModal, closeModal } = window;
    let filteringChannelId = null;

    function navigate(path) {
        window.location.href = path;
    }

    async function updateDisplayName(channelId, newName) {
        const trimmed = (newName || '').trim();
        if (!trimmed) {
            alert('Display name cannot be empty');
            return false;
        }
        try {
            await apiRequest('PATCH', `/watches/update?id=${channelId}`, { name: trimmed });
            location.reload();
            return true;
        } catch (error) {
            alert('Failed to update display name: ' + error.message);
            return false;
        }
    }

    function startEditDisplayName(event, channelId, currentName) {
        event.stopPropagation();
        const node = event.target.closest('.editable-name');
        if (!node) return;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'name-edit-input';
        input.value = currentName;
        node.innerHTML = '';
        node.appendChild(input);
        input.focus();
        input.select();

        const restore = () => {
            node.innerHTML = `${currentName} <span class="name-edit-pencil">✏️</span>`;
        };

        const finish = async () => {
            if (!(await updateDisplayName(channelId, input.value))) {
                restore();
            }
        };

        input.addEventListener('blur', finish, { once: true });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') finish();
            if (e.key === 'Escape') restore();
        });
    }

    async function toggleChannel(channelId, checkbox) {
        try {
            await apiRequest('PATCH', `/watches/update?id=${channelId}`, { is_active: checkbox.checked });
            location.reload();
        } catch (error) {
            checkbox.checked = !checkbox.checked;
            alert('Failed to update channel: ' + error.message);
        }
    }

    async function deleteChannel(channelId) {
        if (!confirm('Remove this channel from monitoring?\n\nAll conditions for this channel will also be removed.')) {
            return;
        }
        try {
            await apiRequest('DELETE', `/watches?id=${channelId}`);
            location.reload();
        } catch (error) {
            alert('Failed to delete channel: ' + error.message);
        }
    }

    function textToArray(text) {
        return text.split('\n').map((item) => item.trim()).filter(Boolean);
    }

    function openFilterModal(channelId) {
        filteringChannelId = channelId;
        
        // Find the channel card to get filter data from data attributes
        const card = document.querySelector(`[data-channel-id="${channelId}"]`);
        if (!card) return;
        
        const filterData = card.dataset.filterData ? JSON.parse(card.dataset.filterData) : {};
        
        document.getElementById('filterModalSubtitle').textContent = `Control which live streams are tracked for "${card.dataset.channelName || 'this channel'}".`;
        document.getElementById('filterSkipTitle').value = (filterData.skip_if_title_contains || []).join('\n');
        document.getElementById('filterSkipDesc').value = (filterData.skip_if_description_contains || []).join('\n');
        document.getElementById('filterRequireTitle').value = (filterData.require_title_contains || []).join('\n');
        document.getElementById('filterClearAll').checked = false;
        
        openModal('filterModal');
    }

    async function saveFilter() {
        const button = document.getElementById('filterSaveBtn');
        button.disabled = true;
        
        try {
            const clearAll = document.getElementById('filterClearAll').checked;
            let body;
            
            if (clearAll) {
                body = { clear_filter: true };
            } else {
                const skipTitle = textToArray(document.getElementById('filterSkipTitle').value);
                const skipDesc = textToArray(document.getElementById('filterSkipDesc').value);
                const requireTitle = textToArray(document.getElementById('filterRequireTitle').value);
                
                body = skipTitle.length || skipDesc.length || requireTitle.length
                    ? {
                        stream_filter: {
                            ...(skipTitle.length ? { skip_if_title_contains: skipTitle } : {}),
                            ...(skipDesc.length ? { skip_if_description_contains: skipDesc } : {}),
                            ...(requireTitle.length ? { require_title_contains: requireTitle } : {})
                        }
                    }
                    : { clear_filter: true };
            }
            
            await apiRequest('PATCH', `/watches/update?id=${filteringChannelId}`, body);
            closeModal('filterModal');
            location.reload();
        } catch (error) {
            alert('Failed to save filter: ' + error.message);
        } finally {
            button.disabled = false;
        }
    }

    Object.assign(window, {
        navigate,
        startEditDisplayName,
        toggleChannel,
        deleteChannel,
        openFilterModal,
        saveFilter
    });

    // Initialize sidebar if it exists
    Promise.all([
        window.ChannelsSidebar?.init({ onChannelsChanged: () => location.reload() }) || Promise.resolve()
    ]);
})();

