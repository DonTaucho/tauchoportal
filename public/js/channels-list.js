(function () {
    'use strict';
    const { apiRequest } = window;
    const t = window.channelsListTranslations || {}; // Fallback to empty object if not loaded
    async function updateDisplayName(channelId, newName) {
        const trimmed = (newName || '').trim();
        if (!trimmed) {
            alert(t.emptyDisplayName || 'Display name cannot be empty');
            return false;
        }
        try {
            await apiRequest('PATCH', `/watches/update?id=${channelId}`, { name: trimmed });
            location.reload();
            return true;
        } catch (error) {
            alert((t.failedUpdateName || 'Failed to update display name: ') + error.message);
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
            alert((t.failedUpdateChannel || 'Failed to update channel: ') + error.message);
        }
    }

    async function deleteChannel(channelId) {
        if (!confirm(t.confirmRemove || 'Remove this channel from monitoring?\n\nAll conditions for this channel will also be removed.')) {
            return;
        }
        try {
            await apiRequest('DELETE', `/watches?id=${channelId}`);
            location.reload();
        } catch (error) {
            alert((t.failedDelete || 'Failed to delete channel: ') + error.message);
        }
    }

    Object.assign(window, {
        startEditDisplayName,
        toggleChannel,
        deleteChannel
    });

    // Initialize sidebar if it exists
    Promise.all([
        window.ChannelsSidebar?.init({ onChannelsChanged: () => location.reload() }) || Promise.resolve()
    ]);
})();

