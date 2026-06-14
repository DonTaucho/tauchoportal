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

  function getUiStringsElement() {
    return document.getElementById('brandSettingsStrings');
  }

  function getUiString(key, fallback = '') {
    const value = getUiStringsElement()?.dataset?.[key];
    return value || fallback;
  }

  function getBrandMeta(brandId) {
    return BRAND_LOOKUP[normalizeBrandId(brandId)] || null;
  }

  function getBrandCard(brandId) {
    const normalizedBrandId = normalizeBrandId(brandId);
    const safeBrandId = window.CSS?.escape ? window.CSS.escape(normalizedBrandId) : normalizedBrandId;
    return document.querySelector(`[data-brand-card][data-brand-id="${safeBrandId}"]`);
  }

  function getBrandTitle(brandId) {
    return getBrandCard(brandId)?.dataset.brandTitle || brandId;
  }

  function getBrandDescription(brandId) {
    return getBrandCard(brandId)?.dataset.brandDescription || '';
  }

  function getBrandActionLabel(brandId, labelName) {
    const card = getBrandCard(brandId);
    if (!card) return '';
    if (labelName === 'connect') return card.dataset.connectLabel || '';
    if (labelName === 'disconnect') return card.dataset.disconnectLabel || '';
    return '';
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
    const neverConnected = getUiString('neverConnected', 'Never');
    if (!timestamp || timestamp === '0001-01-01T00:00:00Z') {
      return neverConnected;
    }
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return neverConnected;
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
      return {
        badgeClass: 'warn',
        badgeText: getUiString('unsupportedLabel', 'Unsupported'),
        cardClass: 'is-unsupported'
      };
    }
    if (meta.authType === 'external') {
      return {
        badgeClass: 'info',
        badgeText: getUiString('externalLabel', 'External app'),
        cardClass: 'is-external'
      };
    }
    if (isConnected(record)) {
      return {
        badgeClass: 'connected',
        badgeText: getUiString('connectedLabel', 'Connected'),
        cardClass: 'is-connected'
      };
    }
    return {
      badgeClass: 'disconnected',
      badgeText: getUiString('notConnectedLabel', 'Not connected'),
      cardClass: ''
    };
  }

  function updateBrandCard(meta, record) {
    const card = getBrandCard(meta.id);
    if (!card) return;

    const state = getCardState(meta, record);
    const badge = card.querySelector('[data-brand-status]');
    const lastConnectedValue = card.querySelector('[data-brand-last-connected]');
    const actionButton = card.querySelector('[data-brand-action-button]');
    const note = card.querySelector('[data-brand-note]');

    card.classList.remove('is-connected', 'is-unsupported', 'is-external');
    if (state.cardClass) {
      card.classList.add(state.cardClass);
    }

    if (badge) {
      badge.className = `status-badge ${state.badgeClass}`;
      badge.textContent = state.badgeText;
    }

    if (lastConnectedValue) {
      lastConnectedValue.textContent = formatDate(getLastConnected(record));
    }

    if (!actionButton || !note) {
      return;
    }

    note.textContent = '';
    note.hidden = true;
    note.className = 'brand-note';
    actionButton.disabled = false;
    actionButton.hidden = false;

    if (isConnected(record)) {
      actionButton.className = 'btn-disconnect brand-action-button';
      actionButton.setAttribute('data-brand-action', 'prompt-disconnect');
      actionButton.textContent = getBrandActionLabel(meta.id, 'disconnect');
      return;
    }

    if (meta.authType === 'oauth' || meta.authType === 'api-key' || meta.authType === 'local') {
      actionButton.className = 'btn-connect brand-action-button';
      actionButton.setAttribute('data-brand-action', 'connect');
      actionButton.textContent = getBrandActionLabel(meta.id, 'connect');
      return;
    }

    actionButton.className = 'btn-connect brand-action-button';
    actionButton.removeAttribute('data-brand-action');
    actionButton.disabled = true;
    actionButton.textContent = getBrandActionLabel(meta.id, 'connect');
    note.textContent = getBrandDescription(meta.id);
    note.hidden = false;
    if (meta.authType === 'unsupported') {
      note.classList.add('warn');
    }
  }

  function renderBrandsList() {
    BRANDS.forEach((meta) => {
      updateBrandCard(meta, brandAuthStatus[meta.id] || {});
    });
  }

  async function loadBrandAuthStatus() {
    setPageMessage(getUiString('loadingMessage', 'Loading brand connections...'));
    try {
      const payload = await apiRequest('GET', '/auth/brands');
      brandAuthStatus = normalizeStatusMap(payload);
      renderBrandsList();
      setPageMessage('');
    } catch (error) {
      brandAuthStatus = normalizeStatusMap({});
      renderBrandsList();
      setPageMessage(`${getUiString('loadErrorMessage', 'Failed to load brand connections')}: ${error.message}`, 'error');
    }
  }

  function createBrandNoteElement(message) {
    const note = document.createElement('p');
    note.className = 'brand-note';
    note.textContent = message;
    return note;
  }

  function createQrImage(src, alt) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    return img;
  }

  function sanitizeSvgElement(svgElement) {
    const importedSvg = document.importNode(svgElement, true);
    importedSvg.querySelectorAll('script, foreignObject, iframe, object, embed').forEach((node) => node.remove());
    importedSvg.querySelectorAll('*').forEach((node) => {
      Array.from(node.attributes).forEach((attribute) => {
        if (/^on/i.test(attribute.name)) {
          node.removeAttribute(attribute.name);
        }
      });
    });
    return importedSvg;
  }

  function createQrSvg(markup) {
    const parser = new DOMParser();
    const documentSvg = parser.parseFromString(markup, 'image/svg+xml');
    if (documentSvg.querySelector('parsererror')) {
      return null;
    }
    const svgElement = documentSvg.documentElement?.nodeName === 'svg'
      ? documentSvg.documentElement
      : documentSvg.querySelector('svg');
    return svgElement ? sanitizeSvgElement(svgElement) : null;
  }

  function clearNode(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function setOAuthModalContent(result, meta) {
    document.getElementById('oauthModalBrand').textContent = getBrandTitle(meta.id);
    const qrContainer = document.getElementById('oauthQrContainer');
    const link = document.getElementById('oauthLink');
    clearNode(qrContainer);

    if (result?.qr_code_svg) {
      const svg = createQrSvg(result.qr_code_svg);
      if (svg) {
        qrContainer.appendChild(svg);
      } else {
        qrContainer.appendChild(createBrandNoteElement(getUiString('oauthUnavailableMessage', 'QR code is not available for this connection.')));
      }
    } else if (result?.qr_code_data_url || result?.qr_code_url || result?.qr_code_image) {
      qrContainer.appendChild(
        createQrImage(result.qr_code_data_url || result.qr_code_url || result.qr_code_image, getBrandTitle(meta.id))
      );
    } else {
      qrContainer.appendChild(createBrandNoteElement(getUiString('oauthUnavailableMessage', 'QR code is not available for this connection.')));
    }

    const authUrl = result?.auth_url || result?.authorization_url || result?.url || '';
    link.href = authUrl || '#';
    link.style.display = authUrl ? 'inline-flex' : 'none';
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
      setPageMessage(`${getUiString('connectFailedMessage', 'Unable to start connection')}: ${error.message}`, 'error');
    }
  }

  function openApiKeyModal(brand) {
    const meta = getBrandMeta(brand);
    if (!meta) return;
    activeApiKeyBrand = meta;
    document.getElementById('apiKeyModalBrand').textContent = getBrandTitle(meta.id);
    document.getElementById('apiKeyInput').value = '';
    openModal('apiKeyModal');
    document.getElementById('apiKeyInput').focus();
  }

  async function saveApiKey(brand, key) {
    if (!key) {
      setPageMessage(getUiString('apiKeyRequiredMessage', 'Please enter an API key or token.'), 'error');
      return;
    }

    try {
      await apiRequest('POST', `/auth/brand/${encodeURIComponent(brand)}/api-key`, {
        api_key: key,
        token: key,
        key
      });
      closeModal('apiKeyModal');
      showToast(getUiString('savedMessage', 'Brand authentication saved.'));
      await loadBrandAuthStatus();
    } catch (error) {
      setPageMessage(`${getUiString('saveFailedMessage', 'Unable to save authentication')}: ${error.message}`, 'error');
    }
  }

  function openLocalDeviceModal(brand) {
    const meta = getBrandMeta(brand);
    if (!meta) return;
    activeLocalBrand = meta;
    document.getElementById('localDeviceModalBrand').textContent = getBrandTitle(meta.id);
    document.getElementById('deviceIpInput').value = '';
    document.getElementById('deviceTokenInput').value = '';
    document.getElementById('deviceTokenGroup').style.display = meta.requiresToken ? 'block' : 'none';
    document.getElementById('deviceTokenHint').textContent = meta.requiresToken
      ? getUiString('authTokenHintMessage', 'Paste the token created on the device or bridge.')
      : getUiString('optionalTokenMessage', 'Token is optional for this brand.');
    openModal('localDeviceModal');
    document.getElementById('deviceIpInput').focus();
  }

  async function saveLocalDeviceAuth(brand, ip, token) {
    if (!ip) {
      setPageMessage(getUiString('ipRequiredMessage', 'Please enter a device IP address.'), 'error');
      return;
    }

    try {
      await apiRequest('POST', `/auth/brand/${encodeURIComponent(brand)}/local`, {
        ip,
        token,
        auth_token: token
      });
      closeModal('localDeviceModal');
      showToast(getUiString('savedMessage', 'Brand authentication saved.'));
      await loadBrandAuthStatus();
    } catch (error) {
      setPageMessage(`${getUiString('saveFailedMessage', 'Unable to save authentication')}: ${error.message}`, 'error');
    }
  }

  function promptDisconnect(brand) {
    const meta = getBrandMeta(brand);
    if (!meta) return;
    pendingDisconnectBrand = meta;
    document.getElementById('disconnectModalDescription').textContent = getUiString(
      'confirmDisconnectDescription',
      'Disconnect {brand} from your account?'
    ).replace('{brand}', getBrandTitle(meta.id));
    openModal('disconnectModal');
  }

  async function disconnectBrand(brand) {
    try {
      await apiRequest('DELETE', `/auth/brand/${encodeURIComponent(brand)}`);
      closeModal('disconnectModal');
      pendingDisconnectBrand = null;
      showToast(getUiString('disconnectedMessage', 'Brand disconnected.'));
      await loadBrandAuthStatus();
    } catch (error) {
      setPageMessage(`${getUiString('disconnectFailedMessage', 'Unable to disconnect brand')}: ${error.message}`, 'error');
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
      if (brandButton && !brandButton.disabled) {
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
    renderBrandsList();
    loadBrandAuthStatus();

    const params = new URLSearchParams(window.location.search);
    const connected = normalizeBrandId(params.get('connected'));
    if (connected && getBrandMeta(connected)) {
      showToast(
        getUiString('connectedSuccessMessage', '{brand} connected.').replace('{brand}', getBrandTitle(connected))
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
