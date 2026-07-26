# Devices Page Step 2 Form Population Fixes

## Problems Fixed

### 1. Product Model Textbox Was Empty
**Issue:** When clicking an owned device from the product list, the Product Model field remained empty in Step 2.

**Root Cause:** The JavaScript `selectProduct()` function was receiving parameters in the wrong order:
- Was receiving: `(brand, productName, deviceName)`
- Should receive: `(brand, productID, productName, deviceName, credentials)`

The template was passing the product NAME as the second parameter, but the function was storing it in `devProduct` (which should be ProductID) and setting `devProductDisplay` to the device name (which should be product name).

**Fix:** Updated the template onclick handler and JavaScript function signatures to pass all necessary data correctly.

### 2. Display Name Not Populated
**Issue:** The Display Name field was empty after selecting a device, forcing users to re-type the device name.

**Root Cause:** The function was resetting the form with `deviceForm.reset()` after populating the fields, which cleared all values.

**Fix:** Refactored the function to:
1. Populate fields BEFORE form.reset()
2. Re-populate fields AFTER form.reset() to preserve values
3. Set Display Name to existing device name, or provide product name as placeholder

### 3. API Credentials Not Loaded
**Issue:** If a device already had API credentials configured, they were not shown when clicking the device again.

**Root Cause:** The credentials from the device object were not being passed to the `selectProduct()` function and not being loaded into the credential fields.

**Fix:** Updated to:
1. Pass credentials object from device to JavaScript
2. Populate `cred_*` fields with existing credentials before and after form reset
3. Preserve credential values through the form reset

## Files Modified

### `/templates/pages/devices.html`

**Line 204 - Updated onclick handler:**
```html
<!-- BEFORE -->
<div class="product-item" onclick="selectProduct('{{.Brand}}', '{{.ProductName}}', '{{.Name}}')">

<!-- AFTER -->
<div class="product-item" onclick="selectProduct('{{.Brand}}', '{{.ProductID}}', '{{.ProductName}}', '{{.Name}}', {{toJSON .Credentials}})">
```

**Lines 518-560 - Refactored selectProduct() function:**

New parameter order:
```javascript
function selectProduct(brandId, productId, productName, deviceName, credentials)
```

Key improvements:
1. **Product Model Display** - Now correctly shows `productName` (human-readable product name)
2. **Hidden Product ID** - Now correctly stores `productId` (catalog product ID)
3. **Display Name Handling**:
   - If device has existing name: use it as default value
   - If new device: provide product name as placeholder hint
4. **Credentials Loading**:
   - Pass credentials object from device
   - Populate `cred_*` fields with existing values
   - Preserve credentials through form reset

## Data Flow

```
Template (devices.html)
  ↓
Device object in loop:
  - .Brand (e.g., "govee")
  - .ProductID (e.g., "prod_123")
  - .ProductName (e.g., "Smart Light Strip")
  - .Name (e.g., "Living Room Light")
  - .Credentials (e.g., {"api_key": "abc123", "device_id": "xyz"})
  ↓
onclick="selectProduct(brand, productID, productName, deviceName, credentials)"
  ↓
JavaScript selectProduct() function
  ↓
Step 2 form populated:
  - devProductDisplay: "Smart Light Strip" (read-only)
  - devProduct: "prod_123" (hidden)
  - devName: "Living Room Light" (editable, with "Smart Light Strip" as placeholder)
  - cred_api_key: "abc123" (if exists)
  - cred_device_id: "xyz" (if exists)
```

## Form Population Logic

### Scenario 1: Adding New Device (First Time)
```
User clicks owned device → selectProduct() called
  - devProductDisplay: Product name shown (read-only)
  - devProduct: ProductID stored (hidden)
  - devName: Empty with product name as placeholder
  - Credentials: Empty (new device)
```

### Scenario 2: Re-configuring Existing Device
```
User clicks owned device → selectProduct() called
  - devProductDisplay: Product name shown (read-only)
  - devProduct: ProductID stored (hidden)
  - devName: Current device name shown
  - Credentials: Existing credentials pre-filled (API key, device ID, etc.)
```

## Technical Details

### Parameter Mapping in selectProduct()
| Parameter | Source | Destination | Type |
|-----------|--------|-------------|------|
| brandId | {{.Brand}} | selectedBrand, renderCredFields | string |
| productId | {{.ProductID}} | devProduct (hidden) | string |
| productName | {{.ProductName}} | devProductDisplay | string |
| deviceName | {{.Name}} | devName (placeholder/value) | string |
| credentials | {{toJSON .Credentials}} | cred_* fields | object |

### Form Reset Behavior
**Old behavior:** Form reset cleared all fields, including ones just populated

**New behavior:**
1. Populate credential fields
2. Call `form.reset()` to clear form
3. Re-populate all fields immediately after reset
4. This ensures values persist while form is properly reset

### Credential Field IDs
The function looks for fields with ID pattern: `cred_{key}` where key is from credentials object:
- `cred_api_key` - for API key
- `cred_device_id` - for device ID
- `cred_*` - for any other credential field defined by brand

## Testing Checklist

- [ ] Click owned device → Product Model field shows product name
- [ ] Click owned device → Hidden devProduct field stores ProductID (not product name)
- [ ] Click owned device → Display Name shows existing device name
- [ ] Click owned device (no existing name) → Display Name placeholder shows product name
- [ ] Device with API key → cred_api_key field populated
- [ ] Device with device_id → cred_device_id field populated
- [ ] Form reset → values persist and don't get cleared
- [ ] Switch between devices → each device's data loads correctly
- [ ] Edit existing device → all previous values shown in form

## Related Issues Fixed
- Device form partially filled (some values in hidden fields but not displayed)
- Product registration with incorrect product ID
- Credential loss when re-editing devices
- Poor UX with empty Display Name requiring re-entry

## Backward Compatibility
✅ Fully backward compatible
- Existing devices can now be properly edited
- No API changes required
- Only affects client-side form population logic
