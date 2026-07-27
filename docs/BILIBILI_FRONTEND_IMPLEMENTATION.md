# Bilibili QR Code Login - Frontend Implementation Guide

## Overview
The frontend needs to implement a **QR code scanning flow** for Bilibili login. This is a 3-step process:
1. **Generate QR code** - Backend creates a scannable QR code
2. **Poll for completion** - Frontend repeatedly checks if user scanned and confirmed
3. **Finish login** - Frontend exchanges credentials for auth session

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────┐
│ Sign In / Create Account Page                       │
│  (User clicks "Sign in with Bilibili")              │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ QR Code Screen                                      │
│  • Display QR code                                  │
│  • Show "Scan with Bilibili App" message            │
│  • Start polling for completion                     │
└────────┬────────────────────────────────────────────┘
         │
         ├─ User scans QR with phone
         │
         ├─ User confirms on phone
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ Sending credentials to backend                      │
│  • Backend returns confirmation                     │
│  • Frontend receives auth cookie                    │
└────────┬────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ Dashboard / Home Page                               │
│  • User logged in successfully                      │
└─────────────────────────────────────────────────────┘
```

---

## Screen 1: Initial Button

**Where:** Sign In / Create Account page  
**What user sees:** A button like "Sign in with Bilibili"

```html
<button onclick="showBilibiliQRCode()">
  <img src="/bilibili-icon.png" alt="Bilibili" />
  Sign in with Bilibili
</button>
```

---

## Screen 2: QR Code Display (Main Screen)

**Where:** New modal/page after clicking Bilibili button  
**What user sees:**
- Large QR code (recommended: 250x250 pixels or larger)
- Text: "Scan this QR code with your Bilibili app"
- Text: "Opening the Bilibili app on your phone and scanning this code"
- Loading indicator if still generating QR
- Error message if something fails
- Optional: Countdown timer showing time remaining (180 seconds = 3 minutes)

### Implementation Steps:

#### Step 1: Call backend to generate QR code

```javascript
async function showBilibiliQRCode() {
  try {
    // Call backend to generate QR code
    const response = await fetch('/api/bilibili/login/qrcode/generate', {
      method: 'GET'
    });
    
    if (!response.ok) {
      showError('Failed to generate QR code');
      return;
    }
    
    const data = await response.json();
    
    // data.qrcode_url = URL string for QR code image
    // data.qrcode_key = unique key for polling
    // data.ttl_seconds = time until expiry (usually 180)
    
    displayQRCode(data.qrcode_url, data.qrcode_key, data.ttl_seconds);
  } catch (error) {
    showError('QR code generation error: ' + error.message);
  }
}
```

#### Step 2: Display QR code image

```javascript
function displayQRCode(qrcodeUrl, qrcodeKey, ttlSeconds) {
  // Show modal/page with QR code
  const qrCodeElement = document.getElementById('qr-code-image');
  
  // Generate QR image from URL using a QR library
  // Option 1: Display the URL as an image directly
  qrCodeElement.src = qrcodeUrl;
  
  // Option 2: Use a QR library like qrcode.js to generate locally
  // (requires adding: <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.0/build/qrcode.min.js"></script>)
  // QRCode.toCanvas(document.getElementById('qr-canvas'), qrcodeUrl, (error) => {
  //   if (error) console.error(error);
  // });
  
  // Show QR code screen
  showQRCodeScreen();
  
  // Start countdown timer
  startCountdownTimer(ttlSeconds);
  
  // Start polling for scan completion
  pollForQRCompletion(qrcodeKey);
}
```

#### HTML Structure for QR Code Screen

```html
<div id="bilibili-qr-modal" class="modal">
  <div class="modal-content">
    <h2>Sign in with Bilibili</h2>
    
    <!-- QR Code Display -->
    <div class="qr-code-container">
      <img id="qr-code-image" src="" alt="Bilibili QR Code" />
    </div>
    
    <!-- Instructions -->
    <p class="qr-instruction">
      Open the Bilibili app on your phone and scan this QR code
    </p>
    
    <!-- Countdown Timer -->
    <p class="qr-countdown">
      Expires in: <span id="countdown-timer">180</span> seconds
    </p>
    
    <!-- Loading/Status Messages -->
    <div id="status-message" class="status-message"></div>
    
    <!-- Error Display -->
    <div id="error-message" class="error-message" style="display: none;"></div>
    
    <!-- Cancel Button -->
    <button onclick="cancelBilibiliLogin()" class="btn-cancel">
      Cancel
    </button>
  </div>
</div>
```

---

## Screen 3: Polling States

The frontend needs to continuously call the **poll endpoint** and handle different responses. This happens in the background while the QR code is displayed.

### Polling API Contract

**Endpoint:** `GET /api/bilibili/login/qrcode/poll?qrcode_key={qrcode_key}`

**Response Types:**

#### 3a. Waiting (Not Yet Scanned)
```json
{
  "status": "waiting",
  "message": "User has not scanned QR code yet"
}
```
**Frontend action:** Keep polling (every 3-5 seconds)

#### 3b. Confirming (Scanned But Not Confirmed)
```json
{
  "status": "confirming",
  "message": "User scanned QR code but has not confirmed"
}
```
**Frontend action:** Keep polling, update UI message to "Please confirm on your phone..."

#### 3c. Confirmed (Ready to Finish)
```json
{
  "status": "confirmed",
  "refresh_token": "xxxxxxx",
  "sessdata": "xxxxxxx",
  "bili_jct": "xxxxxxx",
  "dede_user_id": 12345
}
```
**Frontend action:** Call finish endpoint (see Screen 4)

#### 3d. Expired
```json
{
  "status": "expired",
  "error": "QR code has expired"
}
```
**Frontend action:** Show error message, allow user to click "Try Again" button

#### 3e. Invalid
```json
{
  "status": "invalid",
  "error": "QR code not found or already used"
}
```
**Frontend action:** Show error message, allow user to generate new QR

### Polling Implementation

```javascript
let pollInterval = null;
let pollCount = 0;

function pollForQRCompletion(qrcodeKey) {
  pollCount = 0;
  
  pollInterval = setInterval(async () => {
    pollCount++;
    
    try {
      const response = await fetch(`/api/bilibili/login/qrcode/poll?qrcode_key=${encodeURIComponent(qrcodeKey)}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        showStatusMessage('Error during polling', 'error');
        return;
      }
      
      const data = await response.json();
      
      switch (data.status) {
        case 'waiting':
          showStatusMessage('Waiting for scan...', 'info');
          break;
          
        case 'confirming':
          showStatusMessage('Please confirm on your phone...', 'info');
          break;
          
        case 'confirmed':
          clearInterval(pollInterval);
          finishBilibiliLogin(data);
          break;
          
        case 'expired':
          clearInterval(pollInterval);
          showStatusMessage('QR code expired. Click "Try Again" to generate a new one.', 'error');
          showRetryButton();
          break;
          
        case 'invalid':
          clearInterval(pollInterval);
          showStatusMessage('Invalid QR code. Please start over.', 'error');
          showRetryButton();
          break;
          
        default:
          console.warn('Unknown poll status:', data.status);
      }
    } catch (error) {
      console.error('Poll error:', error);
      showStatusMessage('Connection error. Please try again.', 'error');
    }
  }, 3000); // Poll every 3 seconds
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}
```

### Countdown Timer Implementation

```javascript
function startCountdownTimer(ttlSeconds) {
  let remaining = ttlSeconds;
  const timerElement = document.getElementById('countdown-timer');
  
  const timerInterval = setInterval(() => {
    remaining--;
    timerElement.textContent = remaining;
    
    if (remaining <= 0) {
      clearInterval(timerInterval);
      stopPolling();
      showStatusMessage('QR code expired', 'error');
    } else if (remaining <= 30) {
      // Warn user when less than 30 seconds remaining
      timerElement.classList.add('warning');
    }
  }, 1000);
}
```

---

## Screen 4: Finish Login

**When:** After polling returns `status: "confirmed"`

**What happens:** Frontend sends credentials to backend to complete login

### Finish Login API Contract

**Endpoint:** `POST /api/bilibili/login/finish`

**Request Body:**
```json
{
  "sessdata": "xxxxxxx",
  "bili_jct": "xxxxxxx",
  "refresh_token": "xxxxxxx"
}
```

**Success Response (User Created or Linked):**
```json
{
  "status": "authenticated",
  "user_id": 42,
  "redirect": "/dashboard"
}
```

**Error Response:**
```json
{
  "error": "Failed to verify Bilibili account: ..."
}
```

### Implementation

```javascript
async function finishBilibiliLogin(pollData) {
  try {
    stopPolling();
    showStatusMessage('Completing login...', 'loading');
    
    const response = await fetch('/api/bilibili/login/finish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessdata: pollData.sessdata,
        bili_jct: pollData.bili_jct,
        refresh_token: pollData.refresh_token
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      showStatusMessage('Login failed: ' + error.error, 'error');
      return;
    }
    
    const result = await response.json();
    
    if (result.status === 'authenticated') {
      // Success! Redirect to dashboard
      showStatusMessage('Login successful! Redirecting...', 'success');
      
      // Give user time to see success message
      setTimeout(() => {
        window.location.href = result.redirect;
      }, 1000);
    } else {
      showStatusMessage('Unexpected response from server', 'error');
    }
  } catch (error) {
    console.error('Finish login error:', error);
    showStatusMessage('Error completing login: ' + error.message, 'error');
  }
}
```

---

## Error Handling Flowchart

```
┌─ QR Generation Fails?
│  └─ Show: "Failed to generate QR code"
│     Action: Show retry button
│
├─ Poll Error (network)?
│  └─ Show: "Connection error"
│     Action: Retry automatically or show retry button
│
├─ QR Expired?
│  └─ Show: "QR code expired"
│     Action: Show retry button (generates new QR)
│
├─ Finish Login Fails?
│  └─ Show: "Failed to verify Bilibili account: [error]"
│     Action: Show retry button (generates new QR)
│
└─ All Others?
   └─ Show generic error with option to go back
```

---

## Complete Code Example

Here's a complete, working example:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .modal-content {
      background: white;
      padding: 40px;
      border-radius: 8px;
      max-width: 400px;
      text-align: center;
    }
    
    .qr-code-container {
      margin: 30px 0;
    }
    
    #qr-code-image {
      max-width: 100%;
      border: 2px solid #ddd;
      border-radius: 8px;
    }
    
    .status-message {
      padding: 10px;
      margin: 15px 0;
      border-radius: 4px;
    }
    
    .status-message.info {
      background: #e3f2fd;
      color: #1976d2;
    }
    
    .status-message.error {
      background: #ffebee;
      color: #c62828;
    }
    
    .status-message.success {
      background: #e8f5e9;
      color: #2e7d32;
    }
    
    .qr-countdown {
      color: #666;
      font-size: 14px;
    }
    
    #countdown-timer {
      font-weight: bold;
      font-size: 18px;
    }
    
    #countdown-timer.warning {
      color: #ff6f00;
    }
    
    button {
      padding: 10px 20px;
      margin: 10px 5px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .btn-cancel {
      background: #f0f0f0;
      color: #333;
    }
    
    .btn-retry {
      background: #1976d2;
      color: white;
    }
  </style>
</head>
<body>

<div id="bilibili-qr-modal" class="modal" style="display: none;">
  <div class="modal-content">
    <h2>Sign in with Bilibili</h2>
    
    <div class="qr-code-container">
      <img id="qr-code-image" src="" alt="Bilibili QR Code" />
    </div>
    
    <p class="qr-instruction">
      Open the Bilibili app on your phone and scan this QR code
    </p>
    
    <p class="qr-countdown">
      Expires in: <span id="countdown-timer">180</span> seconds
    </p>
    
    <div id="status-message" class="status-message"></div>
    
    <button id="btn-cancel" onclick="cancelBilibiliLogin()" class="btn-cancel">
      Cancel
    </button>
    <button id="btn-retry" onclick="showBilibiliQRCode()" class="btn-retry" style="display: none;">
      Try Again
    </button>
  </div>
</div>

<button onclick="showBilibiliQRCode()">Sign in with Bilibili</button>

<script>
let pollInterval = null;
let currentQRCodeKey = null;

async function showBilibiliQRCode() {
  document.getElementById('btn-cancel').style.display = 'inline-block';
  document.getElementById('btn-retry').style.display = 'none';
  
  try {
    showStatusMessage('Generating QR code...', 'info');
    
    const response = await fetch('/api/bilibili/login/qrcode/generate', {
      method: 'GET'
    });
    
    if (!response.ok) {
      showStatusMessage('Failed to generate QR code', 'error');
      showRetryButton();
      return;
    }
    
    const data = await response.json();
    currentQRCodeKey = data.qrcode_key;
    
    displayQRCode(data.qrcode_url, data.qrcode_key, data.ttl_seconds);
  } catch (error) {
    showStatusMessage('Error: ' + error.message, 'error');
    showRetryButton();
  }
}

function displayQRCode(qrcodeUrl, qrcodeKey, ttlSeconds) {
  const qrCodeElement = document.getElementById('qr-code-image');
  qrCodeElement.src = qrcodeUrl;
  
  document.getElementById('bilibili-qr-modal').style.display = 'flex';
  showStatusMessage('');
  
  startCountdownTimer(ttlSeconds);
  pollForQRCompletion(qrcodeKey);
}

function pollForQRCompletion(qrcodeKey) {
  if (pollInterval) clearInterval(pollInterval);
  
  pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/bilibili/login/qrcode/poll?qrcode_key=${encodeURIComponent(qrcodeKey)}`, {
        method: 'GET'
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      
      switch (data.status) {
        case 'waiting':
          showStatusMessage('Waiting for scan...', 'info');
          break;
        case 'confirming':
          showStatusMessage('Please confirm on your phone...', 'info');
          break;
        case 'confirmed':
          clearInterval(pollInterval);
          finishBilibiliLogin(data);
          break;
        case 'expired':
          clearInterval(pollInterval);
          showStatusMessage('QR code expired', 'error');
          showRetryButton();
          break;
        case 'invalid':
          clearInterval(pollInterval);
          showStatusMessage('Invalid QR code', 'error');
          showRetryButton();
          break;
      }
    } catch (error) {
      console.error('Poll error:', error);
    }
  }, 3000);
}

function startCountdownTimer(ttlSeconds) {
  let remaining = ttlSeconds;
  const timerElement = document.getElementById('countdown-timer');
  
  const timerInterval = setInterval(() => {
    remaining--;
    timerElement.textContent = remaining;
    
    if (remaining <= 0) {
      clearInterval(timerInterval);
    } else if (remaining <= 30) {
      timerElement.classList.add('warning');
    }
  }, 1000);
}

async function finishBilibiliLogin(pollData) {
  clearInterval(pollInterval);
  showStatusMessage('Completing login...', 'info');
  
  try {
    const response = await fetch('/api/bilibili/login/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessdata: pollData.sessdata,
        bili_jct: pollData.bili_jct,
        refresh_token: pollData.refresh_token
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      showStatusMessage('Login failed: ' + error.error, 'error');
      showRetryButton();
      return;
    }
    
    const result = await response.json();
    showStatusMessage('Login successful! Redirecting...', 'success');
    
    setTimeout(() => {
      window.location.href = result.redirect;
    }, 1500);
  } catch (error) {
    showStatusMessage('Error: ' + error.message, 'error');
    showRetryButton();
  }
}

function cancelBilibiliLogin() {
  clearInterval(pollInterval);
  currentQRCodeKey = null;
  document.getElementById('bilibili-qr-modal').style.display = 'none';
}

function showStatusMessage(message, type) {
  const element = document.getElementById('status-message');
  element.textContent = message;
  element.className = `status-message ${type}`;
  if (!message) element.style.display = 'none';
  else element.style.display = 'block';
}

function showRetryButton() {
  document.getElementById('btn-cancel').style.display = 'none';
  document.getElementById('btn-retry').style.display = 'inline-block';
}
</script>

</body>
</html>
```

---

## Key Implementation Notes

1. **Polling Interval:** Poll every 3-5 seconds (not faster, to avoid rate limiting)
2. **QR Code Expiry:** Always show countdown; usually 180 seconds (3 minutes)
3. **Error Recovery:** Always give user option to retry by generating new QR
4. **Mobile-Friendly:** QR code should work well on desktop (user scans from phone)
5. **Cookie Handling:** Backend sets auth cookie automatically; frontend just follows redirects
6. **Fallback:** If user closes QR modal, stop polling and clean up timers

---

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/bilibili/login/qrcode/generate` | Generate new QR code |
| GET | `/api/bilibili/login/qrcode/poll?qrcode_key=...` | Poll for scan completion |
| POST | `/api/bilibili/login/finish` | Complete login with credentials |
| GET | `/api/bilibili/channels/mine` | Get user's own Bilibili channel *(requires auth)* |

---

## Testing Checklist

- [ ] QR code displays correctly
- [ ] Polling starts after QR code is shown
- [ ] Status messages update during polling
- [ ] Countdown timer updates every second
- [ ] "Confirm" state is handled correctly
- [ ] Expired QR shows error and retry option
- [ ] Login completion redirects to dashboard
- [ ] Cancel button closes modal and stops polling
- [ ] Network errors are handled gracefully
- [ ] Works on mobile and desktop browsers
