/**
 * Brand Settings - Brand Credentials Management
 * Uses actual /auth/brand/* API endpoints (6 implemented)
 * 
 * User ID obtained from server-side injection: window.__user.id
 * Portal proxy automatically adds X-User-ID header to API calls
 */

(function () {
  const API_BASE = window.API_BASE || '/api';
  
  // Get user ID from server-injected data (not from API call)
  function getUserId() {
    if (!window.__user) {
      console.error('User data not available - page not properly initialized');
      return null;
    }
    return window.__user.id;
  }

  // API wrapper - all calls need X-User-ID header
  function apiCall(method, path, body = null) {
    const userId = getUserId();
    if (!userId) throw new Error('Not authenticated');

    const options = {
      method,
      credentials: 'include',
      headers: {
        'X-User-ID': String(userId),
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const url = `${API_BASE}${path}`;
    return fetch(url, options).then(resp => {
      if (!resp.ok) {
        const contentType = resp.headers.get('content-type') || '';
        let errMsg = `HTTP ${resp.status}`;
        
        if (contentType.includes('application/json')) {
          return resp.json().then(data => {
            errMsg = data.error || data.message || JSON.stringify(data);
            throw new Error(errMsg);
          }).catch(e => {
            throw new Error(errMsg);
          });
        } else {
          return resp.text().then(text => {
            throw new Error(text || errMsg);
          });
        }
      }

      if (resp.status === 204) return null;
      
      const contentType = resp.headers.get('content-type') || '';
      return contentType.includes('application/json') ? resp.json() : resp.text();
    });
  }

  // ==========================================
  // API Calls
  // ==========================================

  async function loadBrandsList() {
    // GET /auth/brands - Lists all brands with connection status
    return apiCall('GET', '/auth/brands');
  }

  async function getBrandDetails(brandId) {
    // GET /auth/brand/{brand_id} - Details + credential fields
    return apiCall('GET', `/auth/brand/${brandId}`);
  }

  async function testCredentials(brandId, authType, credentials) {
    // POST /auth/brand/{brand_id}/test - Validate without saving
    return apiCall('POST', `/auth/brand/${brandId}/test`, {
      auth_type: authType,
      credentials
    });
  }

  async function connectBrand(brandId, authType, credentials) {
    // POST /auth/brand/{brand_id}/connect - Save credentials
    return apiCall('POST', `/auth/brand/${brandId}/connect`, {
      auth_type: authType,
      credentials
    });
  }

  async function disconnectBrand(brandId) {
    // POST /auth/brand/{brand_id}/disconnect - Remove credentials
    return apiCall('POST', `/auth/brand/${brandId}/disconnect`);
  }

  async function updateBrandCredentials(brandId, credentials) {
    // PATCH /auth/brand/{brand_id}/update - Partial update
    return apiCall('PATCH', `/auth/brand/${brandId}/update`, { credentials });
  }

  // ==========================================
  // UI Rendering
  // ==========================================

  function showMessage(elementId, message, type = 'info') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.className = `status-msg ${type}`;
    el.style.display = 'block';
  }

  function hideMessage(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.style.display = 'none';
  }

  function getBrandLogo(brandId) {
    // Map brand IDs to logo image names
    const logoMap = {
      'govee': 'brand_govee.png',
      'philips-hue': 'brand_philips.png',
      'lifx': 'brand_lifx.png',
      'nanoleaf': 'brand_nanoleaf.png',
      'tp-link-kasa': 'brand_tplink.png',
      'wiz': 'brand_wiz.png',
      'wled': 'brand_wled.png',
      'yeelight': 'brand_yeelight.png',
      'dwango': 'brand_dwango.png',
      'amazon-alexa': 'brand_amazon.png'
    };
    return logoMap[brandId] || 'brand_generic.png';
  }

  function formatDate(isoString) {
    if (!isoString) return 'Never';
    try {
      return new Date(isoString).toLocaleString();
    } catch (e) {
      return isoString;
    }
  }

  // ==========================================
  // Modal for Connect/Manage
  // ==========================================

  function createCredentialForm(brandDetails, currentValues = {}) {
    const fields = brandDetails.credential_fields || [];
    if (!fields.length) {
      return '<p style="color: #999;">No credential fields needed for this brand.</p>';
    }

    return fields
      .map(field => {
        if (field.type === 'info') {
          return `<div style="padding: 1rem; background: #f0f8ff; border-radius: 6px; margin-bottom: 1rem; border-left: 4px solid #0969da;">
            <p>${escapeHtml(field.help || '')}</p>
          </div>`;
        }

        const value = currentValues[field.name] || '';
        const inputType = field.type === 'password' ? 'password' : 'text';
        const required = field.required ? ' required' : '';

        return `
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">
              ${escapeHtml(field.label || field.name)}
              ${field.required ? '<span style="color: red;"> *</span>' : ''}
            </label>
            <input 
              type="${inputType}" 
              name="${escapeHtml(field.name)}"
              placeholder="${escapeHtml(field.help || '')}"
              value="${escapeHtml(value)}"
              ${required}
              style="width: 100%; padding: 0.75rem; border: 1px solid #d0d7de; border-radius: 6px; font-family: inherit; font-size: inherit;"
            />
            <small style="display: block; color: #666; margin-top: 0.25rem;">${escapeHtml(field.help || '')}</small>
          </div>
        `;
      })
      .join('');
  }

  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return String(text || '').replace(/[&<>"']/g, m => map[m]);
  }

  async function showConnectModal(brandId) {
    try {
      const brandDetails = await getBrandDetails(brandId);
      const brandName = brandDetails.name || brandId;

      // Create form HTML
      const formHtml = createCredentialForm(brandDetails);

      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
        z-index: 10000;
      `;

      modal.innerHTML = `
        <div style="background: white; border-radius: 8px; padding: 2rem; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 style="margin: 0; font-size: 1.5rem;">Connect ${escapeHtml(brandName)}</h2>
            <button onclick="this.closest('div').parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
          </div>

          <form id="connectForm" style="display: flex; flex-direction: column; gap: 1rem;">
            <div id="formFields">${formHtml}</div>
            
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
              <button type="button" id="testBtn" style="flex: 1; padding: 0.75rem; background: #f3f4f6; border: 1px solid #d0d7de; border-radius: 6px; cursor: pointer; font-weight: 500;">Test Connection</button>
              <button type="submit" id="connectBtn" style="flex: 1; padding: 0.75rem; background: #0969da; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Connect</button>
            </div>
            
            <div id="formMessage" style="padding: 0.75rem; border-radius: 6px; display: none; margin-top: 0.5rem;"></div>
          </form>
        </div>
      `;

      document.body.appendChild(modal);

      // Get form elements
      const form = modal.querySelector('#connectForm');
      const testBtn = modal.querySelector('#testBtn');
      const connectBtn = modal.querySelector('#connectBtn');
      const msgDiv = modal.querySelector('#formMessage');

      // Test credentials
      testBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        testBtn.disabled = true;
        testBtn.textContent = 'Testing...';

        try {
          const formData = new FormData(form);
          const credentials = {};
          for (const [key, value] of formData) {
            credentials[key] = value;
          }

          const result = await testCredentials(brandId, brandDetails.auth_type, credentials);

          msgDiv.style.display = 'block';
          if (result.is_valid) {
            msgDiv.style.background = '#d1fae5';
            msgDiv.style.color = '#065f46';
            msgDiv.textContent = `✅ ${result.message || 'Connection successful!'} (${result.device_count} devices found)`;
            connectBtn.disabled = false;
          } else {
            msgDiv.style.background = '#fee2e2';
            msgDiv.style.color = '#dc2626';
            msgDiv.textContent = `❌ ${result.message || 'Connection failed'}`;
            connectBtn.disabled = true;
          }
        } catch (err) {
          msgDiv.style.display = 'block';
          msgDiv.style.background = '#fee2e2';
          msgDiv.style.color = '#dc2626';
          msgDiv.textContent = `❌ Error: ${err.message}`;
          connectBtn.disabled = true;
        } finally {
          testBtn.disabled = false;
          testBtn.textContent = 'Test Connection';
        }
      });

      // Submit to save
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        connectBtn.disabled = true;
        connectBtn.textContent = 'Connecting...';

        try {
          const formData = new FormData(form);
          const credentials = {};
          for (const [key, value] of formData) {
            credentials[key] = value;
          }

          await connectBrand(brandId, brandDetails.auth_type, credentials);

          msgDiv.style.display = 'block';
          msgDiv.style.background = '#d1fae5';
          msgDiv.style.color = '#065f46';
          msgDiv.textContent = '✅ Connected successfully!';

          // Reload page after 1.5 seconds
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (err) {
          msgDiv.style.display = 'block';
          msgDiv.style.background = '#fee2e2';
          msgDiv.style.color = '#dc2626';
          msgDiv.textContent = `❌ Error: ${err.message}`;
          connectBtn.disabled = false;
          connectBtn.textContent = 'Connect';
        }
      });

      // Close on background click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });
    } catch (err) {
      alert(`Failed to load brand details: ${err.message}`);
    }
  }

  // ==========================================
  // Initialize Page
  // ==========================================

  async function initPage() {
    const grid = document.getElementById('brandsGrid');
    if (!grid) return;

    showMessage('brandSettingsMsg', 'Loading brands...');

    try {
      const data = await loadBrandsList();
      const brands = data.brands || [];

      // Build brand cards dynamically
      grid.innerHTML = brands
        .map(brand => {
          const isConnected = brand.is_connected;
          const statusClass = isConnected ? 'connected' : 'disconnected';
          const statusLabel = isConnected ? '✓ Connected' : 'Not Connected';
          const lastActivity = isConnected && brand.last_used_at
            ? formatDate(brand.last_used_at)
            : 'Never';

          const actionHtml = isConnected
            ? `
              <button class="btn-manage" onclick="window.brandSettings.showManageModal('${brand.id}')" style="padding: 0.5rem 1rem; background: #0969da; color: white; border: none; border-radius: 6px; cursor: pointer;">Manage</button>
              <button class="btn-disconnect" onclick="window.brandSettings.disconnectBrand('${brand.id}')" style="padding: 0.5rem 1rem; background: #f3f4f6; color: #dc2626; border: 1px solid #d0d7de; border-radius: 6px; cursor: pointer;">Disconnect</button>
            `
            : `
              <button class="btn-connect" onclick="window.brandSettings.showConnectModal('${brand.id}')" style="padding: 0.5rem 1rem; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer;">Connect</button>
            `;

          return `
            <div style="background: white; border: 1px solid #e1e4e8; border-radius: 8px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
              <div style="display: flex; gap: 1rem; align-items: flex-start;">
                <img src="/image/${escapeHtml(getBrandLogo(brand.id))}" alt="${escapeHtml(brand.name)}" style="height: 48px; width: auto; max-width: 80px;">
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">${escapeHtml(brand.name)}</h3>
                  <p style="margin: 0; color: #666; font-size: 0.9rem;">${brand.description || ''}</p>
                </div>
                <span style="background: ${isConnected ? '#d1fae5' : '#f3f4f6'}; color: ${isConnected ? '#065f46' : '#4b5563'}; padding: 0.5rem 0.75rem; border-radius: 4px; font-weight: 500; font-size: 0.85rem;">${statusLabel}</span>
              </div>

              <div style="padding-top: 1rem; border-top: 1px solid #e1e4e8;">
                <p style="margin: 0.5rem 0; font-size: 0.9rem; color: #666;">
                  <strong>Last Activity:</strong> ${lastActivity}
                </p>
              </div>

              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${actionHtml}
              </div>
            </div>
          `;
        })
        .join('');

      hideMessage('brandSettingsMsg');
    } catch (err) {
      showMessage('brandSettingsMsg', `Error: ${err.message}`, 'error');
    }
  }

  // Expose global functions
  window.brandSettings = {
    showConnectModal,
    async showManageModal(brandId) {
      // TODO: Implement manage modal (update credentials)
      alert('Manage modal not yet implemented');
    },
    async disconnectBrand(brandId) {
      if (!confirm('Are you sure? This will disconnect this brand and all related devices.')) {
        return;
      }

      try {
        showMessage('brandSettingsMsg', 'Disconnecting...');
        await disconnectBrand(brandId);
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        showMessage('brandSettingsMsg', `Error: ${err.message}`, 'error');
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
  } else {
    initPage();
  }
})();
