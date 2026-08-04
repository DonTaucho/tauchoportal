(function () {
  // Use catalog brands directly from backend
  const BRANDS = window._allBrands || [];
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

  // Cache for setup guides (brand_id -> { steps, helpFields })
  const setupGuidesCache = new Map();
  // Track pending guide fetches to avoid duplicate requests
  const pendingGuideFetches = new Map();

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

  function getBrandMeta(brandId) {
    return BRAND_LOOKUP[normalizeBrandId(brandId)] || null;
  }

  function getBrandName(brandId) {
    const normalizedId = normalizeBrandId(brandId);
    for (const brand of BRANDS) {
      if (normalizeBrandId(brand.id) === normalizedId) {
        return brand.name || brand.id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }
    return brandId;
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

  async function fetchSetupGuide(brandId) {
    const normalizedId = normalizeBrandId(brandId);
    
    // Check cache first
    if (setupGuidesCache.has(normalizedId)) {
      return setupGuidesCache.get(normalizedId);
    }

    // Check if we're already fetching this guide
    if (pendingGuideFetches.has(normalizedId)) {
      return pendingGuideFetches.get(normalizedId);
    }

    // Fetch from backend API
    const fetchPromise = (async () => {
      try {
        const lang = document.documentElement.lang || 'en';
        const result = await apiRequest('GET', `/brand/${encodeURIComponent(normalizedId)}/setup-guide?lang=${encodeURIComponent(lang)}`);
        
        // Transform API response to match expected format
        const guide = {
          steps: (result.steps || []).map(step => ({
            title: step.title || '',
            content: step.content || ''
          })),
          helpFields: result.help_fields || {}
        };
        
        setupGuidesCache.set(normalizedId, guide);
        pendingGuideFetches.delete(normalizedId);
        return guide;
      } catch (error) {
        console.warn(`Failed to fetch setup guide for ${normalizedId}:`, error);
        pendingGuideFetches.delete(normalizedId);
        return null;
      }
    })();

    pendingGuideFetches.set(normalizedId, fetchPromise);
    return fetchPromise;
  }

  async function setOAuthModalContent(result, meta) {
    const link = document.getElementById('oauthLink');
    const qrContainer = document.getElementById('oauthQrContainer');
    qrContainer.innerHTML = '';

    if (result?.qr_code_data_url || result?.qr_code_url || result?.qr_code_image) {
      const img = document.createElement('img');
      img.src = result.qr_code_data_url || result.qr_code_url || result.qr_code_image;
      img.alt = `${getBrandName(meta.id)} QR Code`;
      img.style.maxWidth = '300px';
      qrContainer.appendChild(img);
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
      await setOAuthModalContent(result, meta);
      openModal('oauthModal');
    } catch (error) {
      showToast(`❌ ${error.message}`);
    }
  }

  function openApiKeyModal(brand) {
    const meta = getBrandMeta(brand);
    if (!meta) return;
    activeApiKeyBrand = meta;
    document.getElementById('apiKeyInput').value = '';
    openModal('apiKeyModal');
    document.getElementById('apiKeyInput').focus();
  }

  async function saveApiKey(brand, key) {
    if (!key) {
      showToast(window._i18nMsg?.['brandSettings.validation.apiKeyRequired'] || 'Please enter an API key or token.');
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
      showToast('✅ ' + (window._i18nMsg?.['brandSettings.status.saved'] || 'Brand authentication saved.') + ' Please refresh to see updated status.');
    } catch (error) {
      showToast(`❌ ${error.message}`);
    }
  }

  function openLocalDeviceModal(brand) {
    const meta = getBrandMeta(brand);
    if (!meta) return;
    activeLocalBrand = meta;
    document.getElementById('deviceIpInput').value = '';
    document.getElementById('deviceTokenInput').value = '';
    const tokenGroup = document.getElementById('deviceTokenGroup');
    if (tokenGroup) {
      tokenGroup.style.display = meta.requiresToken ? 'block' : 'none';
    }
    openModal('localDeviceModal');
    document.getElementById('deviceIpInput').focus();
  }

  async function saveLocalDeviceAuth(brand, ip, token) {
    if (!ip) {
      showToast(window._i18nMsg?.['brandSettings.validation.ipRequired'] || 'Please enter a device IP address.');
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
      showToast('✅ ' + (window._i18nMsg?.['brandSettings.status.saved'] || 'Brand authentication saved.') + ' Please refresh to see updated status.');
    } catch (error) {
      showToast(`❌ ${error.message}`);
    }
  }

  function promptDisconnect(brand) {
    const meta = getBrandMeta(brand);
    if (!meta) return;
    pendingDisconnectBrand = meta;
    openModal('disconnectModal');
  }

  async function disconnectBrand(brandId) {
    try {
      await apiRequest('POST', `/auth/brand/${encodeURIComponent(brandId)}/disconnect`);
      closeModal('disconnectModal');
      showToast('✅ ' + (window._i18nMsg?.['brandSettings.status.disconnected'] || 'Brand disconnected.') + ' Please refresh to see updated status.');
    } catch (error) {
      showToast(`❌ ${error.message}`);
    }
  }

  async function openSetupWizard(brandId) {
    const guide = await fetchSetupGuide(brandId);
    if (!guide || !guide.steps || guide.steps.length === 0) return;
    
    setupWizardState = { brandId, currentStep: 0, credentials: {} };
    showSetupWizardStep(brandId, 0, guide);
    openModal('setupWizardModal');
  }

  function showSetupWizardStep(brandId, stepIndex, guide) {
    if (stepIndex < 0 || stepIndex >= guide.steps.length) return;
    setupWizardState.currentStep = stepIndex;

    const step = guide.steps[stepIndex];
    const titleEl = document.getElementById('setupWizardTitle');
    const contentEl = document.getElementById('setupWizardContent');
    const progressEl = document.getElementById('setupWizardProgress');
    const credentialsSection = document.getElementById('setupWizardCredentials');
    const backBtn = document.querySelector('[data-wizard-action="back"]');
    const nextBtn = document.querySelector('[data-wizard-action="next"]');
    const testBtn = document.querySelector('[data-wizard-action="test"]');
    const saveBtn = document.querySelector('[data-wizard-action="save"]');

    if (titleEl) titleEl.textContent = step.title;
    if (contentEl) contentEl.textContent = step.content;
    if (progressEl) progressEl.textContent = `Step ${stepIndex + 1} of ${guide.steps.length}`;

    if (backBtn) backBtn.style.display = stepIndex > 0 ? 'block' : 'none';
    if (nextBtn) nextBtn.style.display = stepIndex < guide.steps.length - 1 ? 'block' : 'none';
    if (testBtn) testBtn.style.display = stepIndex === guide.steps.length - 1 ? 'block' : 'none';
    if (saveBtn) saveBtn.style.display = stepIndex === guide.steps.length - 1 ? 'block' : 'none';

    if (stepIndex === guide.steps.length - 1 && credentialsSection) {
      renderCredentialsForm(guide, credentialsSection);
    } else if (credentialsSection) {
      credentialsSection.innerHTML = '';
    }
  }

  function renderCredentialsForm(guide, container) {
    container.innerHTML = '';
    const legend = document.createElement('legend');
    legend.textContent = 'Enter Your Credentials';
    container.appendChild(legend);

    const meta = getBrandMeta(setupWizardState.brandId);
    if (!meta) return;

    const fieldIds = meta.auth_type === 'api_key' 
      ? ['api_key'] 
      : meta.auth_type === 'local' 
        ? ['device_ip', ...(meta.requires_token ? ['api_key'] : [])]
        : [];

    fieldIds.forEach(fieldId => {
      const group = document.createElement('div');
      group.className = 'form-group';

      const label = document.createElement('label');
      label.htmlFor = fieldId;
      label.textContent = fieldId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      const input = document.createElement('input');
      input.type = fieldId.includes('password') || fieldId === 'api_key' ? 'password' : 'text';
      input.id = fieldId;
      input.autocomplete = 'off';
      input.placeholder = fieldId.replace(/_/g, ' ');
      input.addEventListener('input', (e) => {
        setupWizardState.credentials[fieldId] = e.target.value;
      });

      group.appendChild(label);
      group.appendChild(input);

      if (guide.helpFields && guide.helpFields[fieldId]) {
        const hint = document.createElement('span');
        hint.className = 'field-hint';
        hint.textContent = guide.helpFields[fieldId];
        group.appendChild(hint);
      }

      container.appendChild(group);
    });
  }

  async function testWizardCredentials(brandId) {
    const meta = getBrandMeta(brandId);
    if (!meta) return;

    if (!setupWizardState.credentials || Object.keys(setupWizardState.credentials).length === 0) {
      showToast(window._i18nMsg?.['brandSettings.fillAllFields'] || 'Please fill in all credential fields.');
      return;
    }

    const testBtn = document.querySelector('[data-wizard-action="test"]');
    if (testBtn) {
      testBtn.disabled = true;
      testBtn.textContent = 'Testing...';
    }

    try {
      const credentialsPayload = meta.auth_type === 'api_key'
        ? { api_key: setupWizardState.credentials.api_key }
        : { bridge_ip: setupWizardState.credentials.device_ip, api_key: setupWizardState.credentials.api_key };

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
    } catch (error) {
      showToast(`❌ Test failed: ${error.message}`);
    } finally {
      if (testBtn) {
        testBtn.disabled = false;
        testBtn.textContent = 'Test Credentials';
      }
    }
  }

  async function saveWizardCredentials(brandId) {
    const meta = getBrandMeta(brandId);
    if (!meta) return;

    if (!setupWizardState.credentials || Object.keys(setupWizardState.credentials).length === 0) {
      showToast(window._i18nMsg?.['brandSettings.fillAllFields'] || 'Please fill in all credential fields.');
      return;
    }

    try {
      const credentialsPayload = meta.auth_type === 'api_key'
        ? { api_key: setupWizardState.credentials.api_key }
        : { bridge_ip: setupWizardState.credentials.device_ip, api_key: setupWizardState.credentials.api_key };

      await apiRequest('POST', `/auth/brand/${encodeURIComponent(brandId)}/connect`, {
        auth_type: meta.authType,
        credentials: credentialsPayload
      });

      closeModal('setupWizardModal');
      showToast('✅ ' + (window._i18nMsg?.['brandSettings.savedSuccess'] || 'Brand credentials saved successfully!') + ' Please refresh to see updated status.');
    } catch (error) {
      showToast(`❌ ${error.message}`);
    }
  }

  async function handleBrandAction(brandId) {
    const meta = getBrandMeta(brandId);
    if (!meta) return;

    // Try to fetch and show setup wizard if available
    const guide = await fetchSetupGuide(brandId);
    if (guide && guide.steps && guide.steps.length > 0) {
      await openSetupWizard(brandId);
      return;
    }

    // Fall back to direct auth methods if no guide
    if (meta.auth_type === 'oauth') {
      openOAuthFlow(meta.id);
      return;
    }
    if (meta.auth_type === 'api-key' || meta.auth_type === 'api_key') {
      openApiKeyModal(meta.id);
      return;
    }
    if (meta.auth_type === 'local') {
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
          if (modal.style.display !== 'none') {
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

    document.addEventListener('click', (event) => {
      const wizardAction = event.target.getAttribute('data-wizard-action');
      if (!wizardAction) return;

      const brandId = setupWizardState.brandId;
      const cacheKey = normalizeBrandId(brandId);
      const guide = setupGuidesCache.get(cacheKey);
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

    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    if (connected) {
      showToast(`✅ ${getBrandName(connected)} connected. Please refresh to see updated status.`);
      history.replaceState({}, '', '/brand-settings');
    }
  });

  window.handleBrandAction = handleBrandAction;
  window.promptDisconnect = promptDisconnect;
})();
