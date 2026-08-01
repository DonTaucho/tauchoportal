(function () {
  const BRANDS = [
    { id: 'govee', label: 'GV', authType: 'api-key' },
    { id: 'philips-hue', label: 'HU', authType: 'local', requiresToken: true },
    { id: 'lifx', label: 'LX', authType: 'api-key' },
    { id: 'nanoleaf', label: 'NL', authType: 'local', requiresToken: true },
    { id: 'tp-link-kasa', label: 'KS', authType: 'local', requiresToken: true },
    { id: 'wiz', label: 'WZ', authType: 'local', requiresToken: true },
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

  // Phase 1: Setup guides for each brand
  const SETUP_GUIDES = {
    'govee': {
      steps: [
        { title: 'Open Govee App', content: 'Launch the Govee app on your iOS or Android phone.' },
        { title: 'Get API Key', content: 'Go to Profile > Settings > API Key. Copy the full key (it looks like a UUID). This authenticates your devices.' },
        { title: 'Add Device', content: 'In the Govee app, add your devices and note their names. You\'ll need to identify which device you want to control.' },
        { title: 'Enter Credentials', content: 'Paste your API key. Then enter the device MAC address (found in device info in the app, format: XX:XX:XX:XX:XX:XX).' },
        { title: 'Test Connection', content: 'Click "Test Credentials" to verify everything works before saving.' }
      ],
      helpFields: {
        'api_key': 'Your Govee API key from the app settings. Used to authenticate all API requests.',
        'device_id': 'The MAC address of your Govee device. Found in the device info page of the Govee app. Format: XX:XX:XX:XX:XX:XX'
      }
    },
    'philips-hue': {
      steps: [
        { title: 'Locate Bridge', content: 'You need a Hue Bridge (physical hub) connected to your network. If you don\'t have one, you\'ll need to get one.' },
        { title: 'Bridge IP Address', content: 'Find your Bridge IP on your router. Look for a device named "Philips Hue Bridge" or use the official Hue app to find it.' },
        { title: 'Generate Token', content: 'Access the Bridge at http://[BRIDGE_IP]/debug/clip.html. Press the bridge button, then create a user. Copy the returned username (this is your API key).' },
        { title: 'Light Identifier', content: 'In the Hue app, find the Light ID or name. You\'ll use this to identify which light to control.' },
        { title: 'Test Connection', content: 'Click "Test Credentials" to verify the Bridge responds and your token is valid.' }
      ],
      helpFields: {
        'bridge_ip': 'IP address of your Hue Bridge on your network. Example: 192.168.1.50',
        'api_key': 'API key generated from the Bridge (username). Get this from the Bridge settings.',
        'light_id': 'ID or name of the light you want to control. Get this from the Hue app.'
      }
    },
    'lifx': {
      steps: [
        { title: 'Get API Key', content: 'Visit https://cloud.lifx.com/settings and generate an API token.' },
        { title: 'Copy Token', content: 'Your personal API token will be shown. Copy it - you won\'t see it again!' },
        { title: 'Find Device Selector', content: 'In the LIFX app or https://cloud.lifx.com, find your device label or ID. You can use "all" to control all devices.' },
        { title: 'Enter Credentials', content: 'Paste your API token. Enter your device selector (e.g., "Living Room Light" or "all").' },
        { title: 'Test Connection', content: 'Click "Test Credentials" to verify your token and device are accessible.' }
      ],
      helpFields: {
        'api_key': 'Your LIFX personal API token from https://cloud.lifx.com/settings',
        'selector': 'LIFX device selector. Can be device name, ID, group name, or "all". Example: "Living Room Light"'
      }
    },
    'wiz': {
      steps: [
        { title: 'Locate Controller', content: 'Find your WiZ device\'s IP address on your local network. Check your router or the WiZ app.' },
        { title: 'Get Auth Token', content: 'Use the WiZ app to generate an API token or auth key for local access.' },
        { title: 'Enter IP & Token', content: 'Enter your WiZ device IP address and the authentication token.' },
        { title: 'Test Connection', content: 'Click "Test Credentials" to verify the device responds correctly.' }
      ],
      helpFields: {
        'device_ip': 'IP address of your WiZ device on your local network. Example: 192.168.1.100',
        'api_key': 'Auth token for WiZ device local API access.'
      }
    },
    'nanoleaf': {
      steps: [
        { title: 'Locate Controller', content: 'Find your Nanoleaf controller\'s IP address. Access it via the Nanoleaf app or your router.' },
        { title: 'Enable API', content: 'The Nanoleaf device has an API running locally. You just need its IP address and auth token.' },
        { title: 'Generate Token', content: 'Hold the power button for 5 seconds until it pulses. This enables the API. Then generate a token using: curl -X POST http://[IP]:[PORT]/api/v1/new' },
        { title: 'Enter Details', content: 'Enter your Nanoleaf device IP and the auth token you generated.' },
        { title: 'Test Connection', content: 'Click "Test Credentials" to verify local connection to your device.' }
      ],
      helpFields: {
        'device_ip': 'IP address of your Nanoleaf device on your local network. Example: 192.168.1.100',
        'api_key': 'Auth token generated from your Nanoleaf device.'
      }
    },
    'tp-link-kasa': {
      steps: [
        { title: 'Find Device IP', content: 'Use the Kasa app or check your router to find your device\'s local IP address.' },
        { title: 'Note Device IP', content: 'The Kasa smart device runs a local API. You only need its IP address on your network.' },
        { title: 'Verify Local Access', content: 'Make sure your portal server can reach the device. Devices behind a VPN or firewall may not work.' },
        { title: 'Enter IP', content: 'Type in your device\'s IP address in the format: 192.168.1.50' },
        { title: 'Test Connection', content: 'Click "Test Credentials" to verify your device is reachable.' }
      ],
      helpFields: {
        'device_ip': 'IP address of your Kasa device on your local network. Example: 192.168.1.100'
      }
    },
    'yeelight': {
      steps: [
        { title: 'Find Device IP', content: 'In the Yeelight app, go to Device Settings. You\'ll see the device IP address.' },
        { title: 'Enable Local Control', content: 'In Yeelight app, make sure "Local Network Control" is enabled in the device settings.' },
        { title: 'Note the IP', content: 'Copy the device IP from the settings page.' },
        { title: 'Enter IP Address', content: 'Type in your Yeelight device\'s IP address.' },
        { title: 'Test Connection', content: 'Click "Test Credentials" to verify your device is reachable on the network.' }
      ],
      helpFields: {
        'device_ip': 'IP address of your Yeelight device on your local network. Example: 192.168.1.100'
      }
    },
    'wled': {
      steps: [
        { title: 'Find Device IP', content: 'Connect to your WLED device. You can find the IP in your router or from the WLED web interface.' },
        { title: 'Local Control', content: 'WLED devices run a local API. No authentication is typically needed, just the device IP.' },
        { title: 'Test Access', content: 'Make sure your portal can reach the device (same network or VPN).' },
        { title: 'Enter IP', content: 'Type your WLED device\'s IP address.' },
        { title: 'Test Connection', content: 'Click "Test Credentials" to verify the device responds.' }
      ],
      helpFields: {
        'device_ip': 'IP address of your WLED device on your local network. Example: 192.168.1.100'
      }
    },
    'wyze': {
      steps: [
        { title: 'Unsupported', content: 'Wyze integration is currently not supported through direct API. We\'re investigating OAuth options.' },
        { title: 'More Info', content: 'Check back later for updates on Wyze support.' }
      ]
    },
    'amazon-alexa': {
      steps: [
        { title: 'External App', content: 'Amazon Alexa integration uses an external flow. Control your Alexa devices through the official Alexa app.' },
        { title: 'Coming Soon', content: 'Native Alexa integration is planned for future releases.' }
      ]
    }
  };

  let brandAuthStatus = {};
  let activeApiKeyBrand = null;
  let activeLocalBrand = null;
  let pendingDisconnectBrand = null;
  let setupWizardState = { brandId: null, currentStep: 0, credentials: {} };

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
      await apiRequest('POST', `/auth/brand/${encodeURIComponent(brand)}/connect`, {
        auth_type: 'api_key',
        credentials: {
          api_key: key
        }
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
      await apiRequest('POST', `/auth/brand/${encodeURIComponent(brand)}/connect`, {
        auth_type: 'local',
        credentials: {
          bridge_ip: ip,
          api_key: token
        }
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
      await apiRequest('POST', `/auth/brand/${encodeURIComponent(brand)}/disconnect`);
      closeModal('disconnectModal');
      pendingDisconnectBrand = null;
      showToast(getUiString('disconnectedMessage', 'Brand disconnected.'));
      await loadBrandAuthStatus();
    } catch (error) {
      setPageMessage(`${getUiString('disconnectFailedMessage', 'Unable to disconnect brand')}: ${error.message}`, 'error');
    }
  }

  // Phase 1: Setup Wizard Functions
  function getSetupGuide(brandId) {
    return SETUP_GUIDES[normalizeBrandId(brandId)] || { steps: [], helpFields: {} };
  }

  function openSetupWizard(brandId) {
    const normalized = normalizeBrandId(brandId);
    const guide = getSetupGuide(normalized);
    const meta = getBrandMeta(normalized);
    
    if (!meta || !guide || guide.steps.length === 0) {
      // Fall back to regular modals
      handleBrandAction(normalized);
      return;
    }

    setupWizardState.brandId = normalized;
    setupWizardState.currentStep = 0;
    setupWizardState.credentials = {};
    
    showSetupWizardStep(normalized, 0, guide);
  }

  function showSetupWizardStep(brandId, stepIndex, guide) {
    const modal = document.getElementById('setupWizardModal');
    if (!modal) {
      handleBrandAction(brandId);
      return;
    }

    const step = guide.steps[stepIndex];
    if (!step) return;

    const titleEl = modal.querySelector('#setupWizardTitle');
    const contentEl = modal.querySelector('#setupWizardContent');
    const credentialsEl = modal.querySelector('#setupWizardCredentials');
    const progressEl = modal.querySelector('#setupWizardProgress');
    const nextBtn = modal.querySelector('[data-wizard-action="next"]');
    const backBtn = modal.querySelector('[data-wizard-action="back"]');
    const testBtn = modal.querySelector('[data-wizard-action="test"]');
    const saveBtn = modal.querySelector('[data-wizard-action="save"]');

    if (titleEl) titleEl.textContent = step.title;
    if (contentEl) contentEl.textContent = step.content;
    if (progressEl) progressEl.textContent = `Step ${stepIndex + 1} of ${guide.steps.length}`;

    // Clear credentials section
    if (credentialsEl) clearNode(credentialsEl);

    // Show credential fields only on last step
    const isLastStep = stepIndex === guide.steps.length - 1;
    const meta = getBrandMeta(brandId);
    
    if (isLastStep && credentialsEl && meta) {
      renderWizardCredentialFields(credentialsEl, meta, guide, brandId);
    }

    // Update button visibility
    if (backBtn) backBtn.style.display = stepIndex === 0 ? 'none' : '';
    if (nextBtn) nextBtn.style.display = isLastStep ? 'none' : '';
    if (testBtn) testBtn.style.display = !isLastStep ? 'none' : '';
    if (saveBtn) saveBtn.style.display = !isLastStep ? 'none' : '';

    openModal('setupWizardModal');
    setupWizardState.currentStep = stepIndex;
  }

  function renderWizardCredentialFields(container, meta, guide, brandId) {
    if (meta.authType === 'unsupported' || meta.authType === 'external' || meta.authType === 'oauth') {
      return; // These don't need credential entry in wizard
    }

    const fieldsToShow = guide.helpFields ? Object.keys(guide.helpFields) : [];
    if (fieldsToShow.length === 0) return;

    const fieldset = document.createElement('fieldset');
    fieldset.className = 'wizard-credentials-fieldset';
    
    const legend = document.createElement('legend');
    legend.textContent = 'Enter Your Credentials';
    fieldset.appendChild(legend);

    fieldsToShow.forEach((fieldId) => {
      const fieldGroup = document.createElement('div');
      fieldGroup.className = 'form-group';

      const label = document.createElement('label');
      label.setAttribute('for', `wizCred_${fieldId}`);
      label.textContent = fieldId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      fieldGroup.appendChild(label);

      const input = document.createElement('input');
      input.id = `wizCred_${fieldId}`;
      input.setAttribute('data-field-id', fieldId);
      input.type = fieldId.includes('password') || fieldId.includes('key') || fieldId.includes('token') ? 'password' : 'text';
      input.placeholder = guide.helpFields[fieldId] || '';
      input.value = setupWizardState.credentials[fieldId] || '';
      
      input.addEventListener('change', (e) => {
        setupWizardState.credentials[fieldId] = e.target.value;
      });

      fieldGroup.appendChild(input);

      // Add copy button for display (if it's showing a hint)
      const hint = document.createElement('small');
      hint.className = 'field-hint';
      hint.textContent = guide.helpFields[fieldId];
      fieldGroup.appendChild(hint);

      container.appendChild(fieldGroup);
    });
  }

  async function testWizardCredentials(brandId) {
    const meta = getBrandMeta(brandId);
    if (!meta) return;

    if (!setupWizardState.credentials || Object.keys(setupWizardState.credentials).length === 0) {
      showToast(window._i18nMsg?.['brandSettings.fillAllFields'] || 'Please fill in all credential fields.');
      return;
    }

    try {
      const testBtn = document.querySelector('[data-wizard-action="test"]');
      if (testBtn) {
        testBtn.disabled = true;
        testBtn.textContent = 'Testing...';
      }

      // Build credentials payload based on auth type
      const credentialsPayload = buildCredentialsPayload(meta, setupWizardState.credentials);
      
      // Call test endpoint
      const result = await apiRequest('POST', `/auth/brand/${encodeURIComponent(brandId)}/test`, {
        auth_type: meta.authType,
        credentials: credentialsPayload
      });
      
      if (result && result.is_valid) {
        const deviceCount = result.device_count || 0;
        const msg = result.message || `✅ Credentials verified! Found ${deviceCount} device(s).`;
        showToast(msg);
      } else {
        const error = result?.error || 'Credentials validation failed';
        showToast(`❌ ${error}`);
      }
      
      if (testBtn) {
        testBtn.disabled = false;
        testBtn.textContent = 'Test Credentials';
      }
    } catch (error) {
      showToast(`❌ Test failed: ${error.message}`);
      const testBtn = document.querySelector('[data-wizard-action="test"]');
      if (testBtn) {
        testBtn.disabled = false;
        testBtn.textContent = 'Test Credentials';
      }
    }
  }

  function buildCredentialsPayload(meta, wizardCredentials) {
    if (meta.authType === 'api_key') {
      return {
        api_key: wizardCredentials.api_key || wizardCredentials.token
      };
    } else if (meta.authType === 'local') {
      return {
        bridge_ip: wizardCredentials.device_ip || wizardCredentials.bridge_ip,
        api_key: wizardCredentials.api_key || wizardCredentials.token
      };
    }
    return wizardCredentials;
  }


  async function saveWizardCredentials(brandId) {
    const meta = getBrandMeta(brandId);
    if (!meta) return;

    if (!setupWizardState.credentials || Object.keys(setupWizardState.credentials).length === 0) {
      showToast(window._i18nMsg?.['brandSettings.fillAllFields'] || 'Please fill in all credential fields.');
      return;
    }

    try {
      const credentialsPayload = buildCredentialsPayload(meta, setupWizardState.credentials);
      
      await apiRequest('POST', `/auth/brand/${encodeURIComponent(brandId)}/connect`, {
        auth_type: meta.authType,
        credentials: credentialsPayload
      });
      
      closeModal('setupWizardModal');
      showToast(window._i18nMsg?.['brandSettings.savedSuccess'] || '✅ Brand credentials saved successfully!');
      await loadBrandAuthStatus();
    } catch (error) {
      showToast(`❌ Failed to save credentials: ${error.message}`);
    }
  }

  function handleBrandAction(brandId) {
    const meta = getBrandMeta(brandId);
    if (!meta) return;

    // Try to use setup wizard if available
    const guide = getSetupGuide(brandId);
    if (guide && guide.steps && guide.steps.length > 0) {
      openSetupWizard(brandId);
      return;
    }

    // Fall back to original modals
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

    // Wizard event handlers
    document.addEventListener('click', (event) => {
      const wizardAction = event.target.getAttribute('data-wizard-action');
      if (!wizardAction) return;

      const brandId = setupWizardState.brandId;
      const guide = getSetupGuide(brandId);
      if (!guide) return;

      if (wizardAction === 'back') {
        if (setupWizardState.currentStep > 0) {
          showSetupWizardStep(brandId, setupWizardState.currentStep - 1, guide);
        }
      } else if (wizardAction === 'next') {
        if (setupWizardState.currentStep < guide.steps.length - 1) {
          showSetupWizardStep(brandId, setupWizardState.currentStep + 1, guide);
        }
      } else if (wizardAction === 'test') {
        testWizardCredentials(brandId);
      } else if (wizardAction === 'save') {
        saveWizardCredentials(brandId);
      }
    });
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
  window.openSetupWizard = openSetupWizard;
  window.testWizardCredentials = testWizardCredentials;
  window.saveWizardCredentials = saveWizardCredentials;
})();
