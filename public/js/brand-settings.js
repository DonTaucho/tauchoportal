(function () {
  const BRANDS = [
    { id: 'govee', label: 'GV', authType: 'api-key' },
    { id: 'philips-hue', label: 'HU', authType: 'local', requiresToken: true },
    { id: 'lifx', label: 'LX', authType: 'api-key' },
    { id: 'nanoleaf', label: 'NL', authType: 'local', requiresToken: true },
    { id: 'tp-link-kasa', label: 'KS', authType: 'local', requiresToken: true },
    { id: 'tuya', label: 'TY', authType: 'oauth' },
    { id: 'wled', label: 'WL', authType: 'local', requiresToken: false },
    { id: 'wyze', label: 'WY', authType: 'unsupported' },
    { id: 'yeelight', label: 'YL', authType: 'local', requiresToken: false },
    { id: 'amazon-alexa', label: 'AX', authType: 'external' }
  ];

  const BRAND_LOOKUP = Object.fromEntries(BRANDS.map((brand) => [brand.id, brand]));
  const BRAND_ALIASES = {
    philipshue: 'philips-hue',
    hue: 'philips-hue',
    kasa: 'tp-link-kasa',
    tplinkkasa: 'tp-link-kasa',
    tplink: 'tp-link-kasa',
    alexa: 'amazon-alexa',
    amazonalexa: 'amazon-alexa'
  };

  let brandAuthStatus = {};
  let activeApiKeyBrand = null;
  let activeLocalBrand = null;
  let pendingDisconnectBrand = null;

  function t(key, fallback) {
    if (window.__i18n && Object.prototype.hasOwnProperty.call(window.__i18n, key)) {
      return window.__i18n[key];
    }
    return fallback || key;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function normalizeBrandId(value) {
    if (!value) return '';
    const compact = String(value).trim().toLowerCase().replace(/[\s_]/g, '').replace(/-/g, '');
    return BRAND_ALIASES[compact] || String(value).trim().toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-');
  }

  function getBrandMeta(brandId) {
    return BRAND_LOOKUP[normalizeBrandId(brandId)] || null;
  }

  function getBrandTitle(brandId) {
    return t(`brand.${brandId}.title`, brandId);
  }

  function getBrandDescription(brandId) {
    return t(`brand.${brandId}.description`, '');
  }

  async function apiRequest(method, path, body) {
    const options = {
      method,
      credentials: 'include',
      headers: {}
    };
    if (body !== undefined) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    const response = await fetch(`/api${path}`, options);
    const contentType = response.headers.get('content-type') || '';
    const payload = response.status === 204 ? null : contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      if (payload && typeof payload === 'object') {
        throw new Error(payload.error || payload.message || JSON.stringify(payload));
      }
      throw new Error(payload || `${response.status}`);
    }
    return payload;
  }

  function findBrandRecord(payload, brandId) {
    const normalizedId = normalizeBrandId(brandId);
    if (!payload) return null;

    if (Array.isArray(payload)) {
      return payload.find((item) => normalizeBrandId(item?.brand || item?.id || item?.name) === normalizedId) || null;
    }

    if (Array.isArray(payload.brands)) {
      return findBrandRecord(payload.brands, brandId);
    }

    if (payload.brands && typeof payload.brands === 'object') {
      return findBrandRecord(payload.brands, brandId);
    }

    if (typeof payload === 'object') {
      for (const [key, value] of Object.entries(payload)) {
        if (normalizeBrandId(key) === normalizedId) {
          return typeof value === 'object' && value !== null ? { brand: key, ...value } : { brand: key, connected: Boolean(value) };
        }
        if (normalizeBrandId(value?.brand || value?.id || value?.name) === normalizedId) {
          return typeof value === 'object' && value !== null ? value : { brand: key, connected: Boolean(value) };
        }
      }
    }

    return null;
  }

  function normalizeStatusMap(payload) {
    const result = {};
    BRANDS.forEach((brand) => {
      const record = findBrandRecord(payload, brand.id);
      result[brand.id] = record || {};
    });
    return result;
  }

  function isConnected(record) {
    if (!record || typeof record !== 'object') {
      return false;
    }
    return Boolean(
      record.connected ||
      record.is_connected ||
      record.authenticated ||
      record.authorized ||
      record.status === 'connected' ||
      record.state === 'connected'
    );
  }

  function getLastConnected(record) {
    if (!record || typeof record !== 'object') return '';
    return record.last_connected || record.lastConnected || record.connected_at || record.connectedAt || record.updated_at || record.updatedAt || '';
  }

  function formatDate(timestamp) {
    if (!timestamp || timestamp === '0001-01-01T00:00:00Z') {
      return t('brandSettings.neverConnected', 'Never');
    }
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return t('brandSettings.neverConnected', 'Never');
    }
    return date.toLocaleString();
  }

  function setPageMessage(message, kind) {
    const el = document.getElementById('brandSettingsMsg');
    if (!el) return;
    if (!message) {
      el.style.display = 'none';
      el.textContent = '';
      el.className = 'status-msg';
      return;
    }
    el.style.display = 'block';
    el.textContent = message;
    el.className = `status-msg${kind ? ` ${kind}-msg` : ''}`;
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('toast-visible'), 10);
    setTimeout(() => {
      toast.classList.remove('toast-visible');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'block';
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
    }
  }

  function getCardState(meta, record) {
    if (meta.authType === 'unsupported') {
      return { badgeClass: 'warn', badgeText: t('brandSettings.status.unsupported', 'Unsupported'), cardClass: 'is-unsupported' };
    }
    if (meta.authType === 'external') {
      return { badgeClass: 'info', badgeText: t('brandSettings.status.external', 'External'), cardClass: 'is-external' };
    }
    if (isConnected(record)) {
      return { badgeClass: 'connected', badgeText: t('brandSettings.connected', 'Connected'), cardClass: 'is-connected' };
    }
    return { badgeClass: 'disconnected', badgeText: t('brandSettings.notConnected', 'Not connected'), cardClass: '' };
  }

  function renderBrandActions(meta, record) {
    if (isConnected(record)) {
      return `
        <div class="brand-actions">
          <button type="button" class="btn-disconnect brand-action-button" data-brand-action="prompt-disconnect" data-brand-id="${meta.id}">
            ${escapeHtml(t(`brand.${meta.id}.disconnectButton`, 'Disconnect'))}
          </button>
        </div>
      `;
    }

    if (meta.authType === 'oauth' || meta.authType === 'api-key' || meta.authType === 'local') {
      return `
        <div class="brand-actions">
          <button type="button" class="btn-connect brand-action-button" data-brand-action="connect" data-brand-id="${meta.id}">
            ${escapeHtml(t(`brand.${meta.id}.connectButton`, 'Connect'))}
          </button>
        </div>
      `;
    }

    const noteClass = meta.authType === 'unsupported' ? 'brand-note warn' : 'brand-note';
    return `
      <div class="brand-actions">
        <button type="button" class="btn-connect brand-action-button" disabled>
          ${escapeHtml(t(`brand.${meta.id}.connectButton`, 'Not available'))}
        </button>
        <span class="${noteClass}">${escapeHtml(getBrandDescription(meta.id))}</span>
      </div>
    `;
  }

  function renderBrandsList() {
    const grid = document.getElementById('brandsGrid');
    if (!grid) return;

    grid.innerHTML = BRANDS.map((meta) => {
      const record = brandAuthStatus[meta.id] || {};
      const state = getCardState(meta, record);
      return `
        <article class="brand-card ${state.cardClass}">
          <div class="brand-card-header">
            <div class="brand-card-identity">
              <div class="brand-logo" aria-hidden="true">${escapeHtml(meta.label)}</div>
              <div>
                <h3 class="brand-name">${escapeHtml(getBrandTitle(meta.id))}</h3>
                <p class="brand-description">${escapeHtml(getBrandDescription(meta.id))}</p>
              </div>
            </div>
            <span class="status-badge ${state.badgeClass}">${escapeHtml(state.badgeText)}</span>
          </div>
          <div class="brand-details">
            <div class="brand-detail-row">
              <span class="brand-detail-label">${escapeHtml(t('brandSettings.lastConnected', 'Last connected'))}</span>
              <span>${escapeHtml(formatDate(getLastConnected(record)))}</span>
            </div>
          </div>
          ${renderBrandActions(meta, record)}
        </article>
      `;
    }).join('');
  }

  async function loadBrandAuthStatus() {
    setPageMessage(t('brandSettings.loading', 'Loading brand connections...'));
    try {
      const payload = await apiRequest('GET', '/auth/brands');
      brandAuthStatus = normalizeStatusMap(payload);
      renderBrandsList();
      setPageMessage('');
    } catch (error) {
      brandAuthStatus = normalizeStatusMap({});
      renderBrandsList();
      setPageMessage(`${t('brandSettings.loadError', 'Failed to load brand connections')}: ${error.message}`, 'error');
    }
  }

  function setOAuthModalContent(result, meta) {
    document.getElementById('oauthModalTitle').textContent = t('brandSettings.modal.oauthTitle', 'Connect brand');
    document.getElementById('oauthModalBrand').textContent = getBrandTitle(meta.id);
    document.getElementById('oauthModalMessage').textContent = t('brandSettings.modal.qrHint', 'Scan the QR code or open the link to finish authentication.');
    const qrContainer = document.getElementById('oauthQrContainer');
    const link = document.getElementById('oauthLink');
    qrContainer.innerHTML = '';

    if (result?.qr_code_svg) {
      qrContainer.innerHTML = result.qr_code_svg;
    } else if (result?.qr_code_data_url || result?.qr_code_url || result?.qr_code_image) {
      const img = document.createElement('img');
      img.src = result.qr_code_data_url || result.qr_code_url || result.qr_code_image;
      img.alt = getBrandTitle(meta.id);
      qrContainer.appendChild(img);
    } else {
      qrContainer.innerHTML = `<p class="brand-note">${escapeHtml(t('brandSettings.modal.oauthUnavailable', 'QR code is not available for this connection.'))}</p>`;
    }

    const authUrl = result?.auth_url || result?.authorization_url || result?.url || '#';
    link.href = authUrl;
    link.style.display = authUrl && authUrl !== '#' ? 'inline-flex' : 'none';
  }

  async function openOAuthFlow(brand) {
    const meta = getBrandMeta(brand);
    if (!meta) return;

    try {
      await fetch(`/set-oauth-return?url=${encodeURIComponent('/brand-settings')}`, { credentials: 'include' });
      const result = await apiRequest('POST', `/auth/brand/${encodeURIComponent(meta.id)}/connect`);
      setOAuthModalContent(result, meta);
      openModal('oauthModal');
    } catch (error) {
      setPageMessage(`${t('brandSettings.error.connectFailed', 'Unable to start connection')}: ${error.message}`, 'error');
    }
  }

  function openApiKeyModal(brand) {
    const meta = getBrandMeta(brand);
    if (!meta) return;
    activeApiKeyBrand = meta;
    document.getElementById('apiKeyModalTitle').textContent = t('brandSettings.modal.apiKeyTitle', 'Save API key');
    document.getElementById('apiKeyModalBrand').textContent = getBrandTitle(meta.id);
    document.getElementById('apiKeyInput').value = '';
    openModal('apiKeyModal');
    document.getElementById('apiKeyInput').focus();
  }

  async function saveApiKey(brand, key) {
    if (!key) {
      setPageMessage(t('brandSettings.validation.apiKeyRequired', 'Please enter an API key or token.'), 'error');
      return;
    }

    try {
      await apiRequest('POST', `/auth/brand/${encodeURIComponent(brand)}/api-key`, {
        api_key: key,
        token: key,
        key
      });
      closeModal('apiKeyModal');
      showToast(t('brandSettings.status.saved', 'Brand authentication saved.'));
      await loadBrandAuthStatus();
    } catch (error) {
      setPageMessage(`${t('brandSettings.error.saveFailed', 'Unable to save authentication')}: ${error.message}`, 'error');
    }
  }

  function openLocalDeviceModal(brand) {
    const meta = getBrandMeta(brand);
    if (!meta) return;
    activeLocalBrand = meta;
    document.getElementById('localDeviceModalTitle').textContent = t('brandSettings.modal.localTitle', 'Connect local device');
    document.getElementById('localDeviceModalBrand').textContent = getBrandTitle(meta.id);
    document.getElementById('deviceIpInput').value = '';
    document.getElementById('deviceTokenInput').value = '';
    document.getElementById('deviceTokenGroup').style.display = meta.requiresToken ? 'block' : 'none';
    document.getElementById('deviceTokenHint').textContent = meta.requiresToken
      ? t('brandSettings.modal.authTokenHint', 'Paste the token created on the device or bridge.')
      : t('brandSettings.modal.optionalToken', 'Token is optional for this brand.');
    openModal('localDeviceModal');
    document.getElementById('deviceIpInput').focus();
  }

  async function saveLocalDeviceAuth(brand, ip, token) {
    if (!ip) {
      setPageMessage(t('brandSettings.validation.ipRequired', 'Please enter a device IP address.'), 'error');
      return;
    }

    try {
      await apiRequest('POST', `/auth/brand/${encodeURIComponent(brand)}/local`, {
        ip,
        token,
        auth_token: token
      });
      closeModal('localDeviceModal');
      showToast(t('brandSettings.status.saved', 'Brand authentication saved.'));
      await loadBrandAuthStatus();
    } catch (error) {
      setPageMessage(`${t('brandSettings.error.saveFailed', 'Unable to save authentication')}: ${error.message}`, 'error');
    }
  }

  function promptDisconnect(brand) {
    const meta = getBrandMeta(brand);
    if (!meta) return;
    pendingDisconnectBrand = meta;
    document.getElementById('disconnectModalDescription').textContent = t(
      'brandSettings.modal.confirmDisconnectDescription',
      'Disconnect {brand} from your account?'
    ).replace('{brand}', getBrandTitle(meta.id));
    openModal('disconnectModal');
  }

  async function disconnectBrand(brand) {
    try {
      await apiRequest('DELETE', `/auth/brand/${encodeURIComponent(brand)}`);
      closeModal('disconnectModal');
      pendingDisconnectBrand = null;
      showToast(t('brandSettings.status.disconnected', 'Brand disconnected.'));
      await loadBrandAuthStatus();
    } catch (error) {
      setPageMessage(`${t('brandSettings.error.disconnectFailed', 'Unable to disconnect brand')}: ${error.message}`, 'error');
    }
  }

  function handleBrandAction(brandId) {
    const meta = getBrandMeta(brandId);
    if (!meta) return;
    if (meta.authType === 'oauth') {
      openOAuthFlow(meta.id);
      return;
    }
    if (meta.authType === 'api-key') {
      openApiKeyModal(meta.id);
      return;
    }
    if (meta.authType === 'local') {
      openLocalDeviceModal(meta.id);
    }
  }

  function bindEvents() {
    document.addEventListener('click', (event) => {
      const closeButton = event.target.closest('[data-close-modal]');
      if (closeButton) {
        closeModal(closeButton.getAttribute('data-close-modal'));
        return;
      }

      const brandButton = event.target.closest('[data-brand-action]');
      if (brandButton) {
        const brandId = brandButton.getAttribute('data-brand-id');
        if (brandButton.getAttribute('data-brand-action') === 'prompt-disconnect') {
          promptDisconnect(brandId);
        } else {
          handleBrandAction(brandId);
        }
      }
    });

    document.querySelectorAll('.modal').forEach((modal) => {
      modal.addEventListener('click', (event) => {
        if (event.target === modal) {
          closeModal(modal.id);
        }
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        document.querySelectorAll('.modal').forEach((modal) => {
          if (modal.style.display === 'block') {
            closeModal(modal.id);
          }
        });
      }
    });

    const saveApiKeyButton = document.getElementById('saveApiKeyButton');
    if (saveApiKeyButton) {
      saveApiKeyButton.addEventListener('click', () => {
        if (!activeApiKeyBrand) return;
        saveApiKey(activeApiKeyBrand.id, document.getElementById('apiKeyInput').value.trim());
      });
    }

    const saveLocalDeviceButton = document.getElementById('saveLocalDeviceButton');
    if (saveLocalDeviceButton) {
      saveLocalDeviceButton.addEventListener('click', () => {
        if (!activeLocalBrand) return;
        saveLocalDeviceAuth(
          activeLocalBrand.id,
          document.getElementById('deviceIpInput').value.trim(),
          document.getElementById('deviceTokenInput').value.trim()
        );
      });
    }

    const confirmDisconnectButton = document.getElementById('confirmDisconnectButton');
    if (confirmDisconnectButton) {
      confirmDisconnectButton.addEventListener('click', () => {
        if (!pendingDisconnectBrand) return;
        disconnectBrand(pendingDisconnectBrand.id);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    loadBrandAuthStatus();

    const params = new URLSearchParams(window.location.search);
    const connected = normalizeBrandId(params.get('connected'));
    if (connected && getBrandMeta(connected)) {
      showToast(
        t('brandSettings.status.connectedSuccess', '{brand} connected.').replace('{brand}', getBrandTitle(connected))
      );
      history.replaceState({}, '', '/brand-settings');
    }
  });

  window.loadBrandAuthStatus = loadBrandAuthStatus;
  window.renderBrandsList = renderBrandsList;
  window.openOAuthFlow = openOAuthFlow;
  window.openApiKeyModal = openApiKeyModal;
  window.saveApiKey = saveApiKey;
  window.openLocalDeviceModal = openLocalDeviceModal;
  window.saveLocalDeviceAuth = saveLocalDeviceAuth;
  window.disconnectBrand = disconnectBrand;
  window.formatDate = formatDate;
})();
