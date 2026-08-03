-- Create brand_setup_guides table
CREATE TABLE IF NOT EXISTS brand_setup_guides (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL,
  language_code TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  help_fields TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(brand_id, language_code, step_order)
);

-- Insert Govee guides (English only for now)
INSERT INTO brand_setup_guides (id, brand_id, language_code, step_order, title, content, help_fields) VALUES
('govee-en-1', 'govee', 'en', 1, 'Open Govee App',                                                                   'Launch the Govee app on your iOS or Android phone.', '{}'),
('govee-en-2', 'govee', 'en', 2, 'Get API Key',                                                                      'Go to Profile > Settings > API Key. Copy the full key (it looks like a UUID). This authenticates your devices.', '{"api_key": "Your Govee API key from the app settings. Used to authenticate all API requests."}'),
('govee-en-3', 'govee', 'en', 3, 'Add Device',                                                                       'In the Govee app, add your devices and note their names. You will need to identify which device you want to control.', '{}'),
('govee-en-4', 'govee', 'en', 4, 'Enter Credentials',                                                                'Paste your API key. Then enter the device MAC address (found in device info in the app, format: XX:XX:XX:XX:XX:XX).', '{"api_key": "Your Govee API key from the app settings. Used to authenticate all API requests.", "device_id": "The MAC address of your Govee device. Found in the device info page of the Govee app. Format: XX:XX:XX:XX:XX:XX"}'),
('govee-en-5', 'govee', 'en', 5, 'Test Connection',                                                                  'Click "Test Credentials" to verify everything works before saving.', '{}');

-- Insert Philips Hue guides (English only for now)
INSERT INTO brand_setup_guides (id, brand_id, language_code, step_order, title, content, help_fields) VALUES
('philips-hue-en-1', 'philips-hue', 'en', 1,                                                                         'Locate Bridge',         'You need a Hue Bridge (physical hub) connected to your network. If you do not have one, you will need to get one.', '{}'),
('philips-hue-en-2', 'philips-hue', 'en', 2,                                                                         'Bridge IP Address',     'Find your Bridge IP on your router. Look for a device named "Philips Hue Bridge" or use the official Hue app to find it.', '{"bridge_ip": "IP address of your Hue Bridge on your network. Example: 192.168.1.50"}'),
('philips-hue-en-3', 'philips-hue', 'en', 3,                                                                         'Generate Token',        'Access the Bridge at http://[BRIDGE_IP]/debug/clip.html. Press the bridge button, then create a user. Copy the returned username (this is your API key).', '{"api_key": "API key generated from the Bridge (username). Get this from the Bridge settings."}'),
('philips-hue-en-4', 'philips-hue', 'en', 4,                                                                         'Light Identifier',      'In the Hue app, find the Light ID or name. You will use this to identify which light to control.', '{"light_id": "ID or name of the light you want to control. Get this from the Hue app."}'),
('philips-hue-en-5', 'philips-hue', 'en', 5,                                                                         'Test Connection',       'Click "Test Credentials" to verify the Bridge responds and your token is valid.', '{}');

-- Insert LIFX guides (English only for now)
INSERT INTO brand_setup_guides (id, brand_id, language_code, step_order, title, content, help_fields) VALUES
('lifx-en-1', 'lifx', 'en', 1,                                                                                       'Get API Key',           'Visit https://cloud.lifx.com/settings and generate an API token.', '{}'),
('lifx-en-2', 'lifx', 'en', 2,                                                                                       'Copy Token',            'Your personal API token will be shown. Copy it - you will not see it again!', '{"api_key": "Your LIFX personal API token from https://cloud.lifx.com/settings"}'),
('lifx-en-3', 'lifx', 'en', 3,                                                                                       'Find Device Selector',  'In the LIFX app or https://cloud.lifx.com, find your device label or ID. You can use "all" to control all devices.', '{"selector": "LIFX device selector. Can be device name, ID, group name, or all. Example: Living Room Light"}'),
('lifx-en-4', 'lifx', 'en', 4,                                                                                       'Enter Credentials',     'Paste your API token. Enter your device selector (e.g., "Living Room Light" or "all").', '{"api_key": "Your LIFX personal API token from https://cloud.lifx.com/settings", "selector": "LIFX device selector. Can be device name, ID, group name, or all. Example: Living Room Light"}'),
('lifx-en-5', 'lifx', 'en', 5,                                                                                       'Test Connection',       'Click "Test Credentials" to verify your token and device are accessible.', '{}');

-- Insert WiZ guides (English only for now)
INSERT INTO brand_setup_guides (id, brand_id, language_code, step_order, title, content, help_fields) VALUES
('wiz-en-1', 'wiz', 'en', 1,                                                                                         'Locate Controller',     'Find your WiZ device IP address on your local network. Check your router or the WiZ app.', '{}'),
('wiz-en-2', 'wiz', 'en', 2,                                                                                         'Get Auth Token',        'Use the WiZ app to generate an API token or auth key for local access.', '{"api_key": "Auth token for WiZ device local API access."}'),
('wiz-en-3', 'wiz', 'en', 3,                                                                                         'Enter IP & Token',      'Enter your WiZ device IP address and the authentication token.', '{"device_ip": "IP address of your WiZ device on your local network. Example: 192.168.1.100", "api_key": "Auth token for WiZ device local API access."}'),
('wiz-en-4', 'wiz', 'en', 4,                                                                                         'Test Connection',       'Click "Test Credentials" to verify the device responds correctly.', '{}');

-- Insert Nanoleaf guides (English only for now)
INSERT INTO brand_setup_guides (id, brand_id, language_code, step_order, title, content, help_fields) VALUES
('nanoleaf-en-1', 'nanoleaf', 'en', 1,                                                                               'Locate Controller',     'Find your Nanoleaf controller IP address. Access it via the Nanoleaf app or your router.', '{}'),
('nanoleaf-en-2', 'nanoleaf', 'en', 2,                                                                               'Enable API',            'The Nanoleaf device has an API running locally. You just need its IP address and auth token.', '{}'),
('nanoleaf-en-3', 'nanoleaf', 'en', 3,                                                                               'Generate Token',        'Hold the power button for 5 seconds until it pulses. This enables the API. Then generate a token using: curl -X POST http://[IP]:[PORT]/api/v1/new', '{"api_key": "Auth token generated from your Nanoleaf device."}'),
('nanoleaf-en-4', 'nanoleaf', 'en', 4,                                                                               'Enter Details',         'Enter your Nanoleaf device IP and the auth token you generated.', '{"device_ip": "IP address of your Nanoleaf device on your local network. Example: 192.168.1.100", "api_key": "Auth token generated from your Nanoleaf device."}'),
('nanoleaf-en-5', 'nanoleaf', 'en', 5,                                                                               'Test Connection',       'Click "Test Credentials" to verify local connection to your device.', '{}');

-- Insert TP-Link Kasa guides (English only for now)
INSERT INTO brand_setup_guides (id, brand_id, language_code, step_order, title, content, help_fields) VALUES
('tp-link-kasa-en-1', 'tp-link-kasa', 'en', 1,                                                                       'Find Device IP',        'Use the Kasa app or check your router to find your device local IP address.', '{}'),
('tp-link-kasa-en-2', 'tp-link-kasa', 'en', 2,                                                                       'Note Device IP',        'The Kasa smart device runs a local API. You only need its IP address on your network.', '{}'),
('tp-link-kasa-en-3', 'tp-link-kasa', 'en', 3,                                                                       'Verify Local Access',   'Make sure your portal server can reach the device. Devices behind a VPN or firewall may not work.', '{}'),
('tp-link-kasa-en-4', 'tp-link-kasa', 'en', 4,                                                                       'Enter IP',              'Type in your device IP address in the format: 192.168.1.50', '{"device_ip": "IP address of your Kasa device on your local network. Example: 192.168.1.100"}'),
('tp-link-kasa-en-5', 'tp-link-kasa', 'en', 5,                                                                       'Test Connection',       'Click "Test Credentials" to verify your device is reachable.', '{}');

-- Insert Yeelight guides (English only for now)
INSERT INTO brand_setup_guides (id, brand_id, language_code, step_order, title, content, help_fields) VALUES
('yeelight-en-1', 'yeelight', 'en', 1,                                                                               'Find Device IP',        'In the Yeelight app, go to Device Settings. You will see the device IP address.', '{}'),
('yeelight-en-2', 'yeelight', 'en', 2,                                                                               'Enable Local Control',  'In Yeelight app, make sure "Local Network Control" is enabled in the device settings.', '{}'),
('yeelight-en-3', 'yeelight', 'en', 3,                                                                               'Note the IP',           'Copy the device IP from the settings page.', '{"device_ip": "IP address of your Yeelight device on your local network. Example: 192.168.1.100"}'),
('yeelight-en-4', 'yeelight', 'en', 4,                                                                               'Enter IP Address',      'Type in your Yeelight device IP address.', '{"device_ip": "IP address of your Yeelight device on your local network. Example: 192.168.1.100"}'),
('yeelight-en-5', 'yeelight', 'en', 5,                                                                               'Test Connection',       'Click "Test Credentials" to verify your device is reachable on the network.', '{}');

-- Insert WLED guides (English only for now)
INSERT INTO brand_setup_guides (id, brand_id, language_code, step_order, title, content, help_fields) VALUES
('wled-en-1', 'wled', 'en', 1,                                                                                       'Find Device IP',        'Connect to your WLED device. You can find the IP in your router or from the WLED web interface.', '{}'),
('wled-en-2', 'wled', 'en', 2,                                                                                       'Local Control',         'WLED devices run a local API. No authentication is typically needed, just the device IP.', '{}'),
('wled-en-3', 'wled', 'en', 3,                                                                                       'Test Access',           'Make sure your portal can reach the device (same network or VPN).', '{}'),
('wled-en-4', 'wled', 'en', 4,                                                                                       'Enter IP',              'Type your WLED device IP address.', '{"device_ip": "IP address of your WLED device on your local network. Example: 192.168.1.100"}'),
('wled-en-5', 'wled', 'en', 5,                                                                                       'Test Connection',       'Click "Test Credentials" to verify the device responds.', '{}');

-- Insert Wyze guides (English only for now)
INSERT INTO brand_setup_guides (id, brand_id, language_code, step_order, title, content, help_fields) VALUES
('wyze-en-1', 'wyze', 'en', 1,                                                                                       'Unsupported',           'Wyze integration is currently not supported through direct API. We are investigating OAuth options.', '{}'),
('wyze-en-2', 'wyze', 'en', 2,                                                                                       'More Info',             'Check back later for updates on Wyze support.', '{}');

-- Insert Amazon Alexa guides (English only for now)
INSERT INTO brand_setup_guides (id, brand_id, language_code, step_order, title, content, help_fields) VALUES
('amazon-alexa-en-1', 'amazon-alexa', 'en', 1,                                                                       'External App', 'Amazon Alexa integration uses an external flow. Control your Alexa devices through the official Alexa app.', '{}'),
('amazon-alexa-en-2', 'amazon-alexa', 'en', 2,                                                                       'Coming Soon', 'Native Alexa integration is planned for future releases.', '{}');

-- NOTE: Translation SQLs would need to be added for other languages (fr, es, de, ja, ko, zh)
-- Current implementation includes all English (en) guides. Each language would require
-- equivalent INSERT statements with translated titles, content, and help_fields.
-- 
-- Suggested approach:
-- 1. Use professional translation service or native speakers for accuracy
-- 2. Generate SQL for each language following the same pattern as above
-- 3. Update help_fields JSON with localized help text for each field
-- 4. Verify translations in context (some technical terms may need to stay as-is)
