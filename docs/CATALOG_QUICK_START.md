# Device Catalog - Quick Start Guide

## For Users

### Browse Smart Devices
1. Go to `/devices` page
2. Click the **"🛒 Browse Catalog"** tab
3. Select a brand from the sidebar (e.g., Govee or Generic Smart Devices)
4. Browse available products
5. Click **"+ Add to Devices"** on any product
6. Fill in device name, location, and API credentials
7. Click **"Add Device"**

### View Your Devices
1. Go to `/devices` page
2. Click the **"🔌 My Devices"** tab
3. See all your configured devices with their status
4. Edit, test, or delete devices as needed

## For Developers

### Adding a New Catalog

**Option 1: Static JSON Catalog** (Easiest)
```
1. Create /public/catalogs/your-brand.json
2. Add product data (see example in govee.json)
3. Update CATALOG_BRANDS in /templates/pages/devices.html
```

**Option 2: API Integration** (Advanced)
```
1. Create backend endpoint: /api/catalogs/{brandId}
2. Update selectCatalogBrand() in devices.html:
   const catalogUrl = `/api/catalogs/${brandId}`;
3. Ensure response matches JSON structure
```

### JSON Structure

```json
{
  "id": "brand-id",
  "name": "Brand Name",
  "description": "Description",
  "logo": "💡",
  "products": [
    {
      "id": "product-id",
      "name": "Product Name",
      "description": "Description",
      "icon": "emoji",
      "price": "$29.99",
      "priceRange": "$19.99 - $49.99",
      "features": ["Feature 1", "Feature 2"],
      "supportedActions": ["on", "off", "color"],
      "buyUrl": "https://amazon.com/...",
      "imageUrl": "/image/catalog/product.jpg"
    }
  ]
}
```

### File Locations

**Code:**
- `/templates/pages/devices.html` - Main page with catalog logic
- `/templates/partials/catalogs/` - HTML templates (for future use)

**Styling:**
- `/public/css/devices.css` - Device page styles + nav tabs
- `/public/css/catalog.css` - Catalog-specific styles

**Data:**
- `/public/catalogs/` - Catalog JSON files

### Key JavaScript Functions

| Function | Purpose |
|----------|---------|
| `switchView(viewName)` | Switch between "My Devices" and "Browse Catalog" |
| `initializeCatalog()` | Load brand list |
| `selectCatalogBrand(btn, id)` | Load catalog for selected brand |
| `renderCatalogGrid(data)` | Render products dynamically |
| `addProductToDevices(...)` | Add product to device list |

### Supported Product Actions

- `on` - Turn on
- `off` - Turn off
- `toggle` - Toggle state
- `color` - Change color
- `brightness` - Adjust brightness
- `color_temp` - Color temperature
- `scene` - Play scene/preset
- `flash` - Flash/alert

## Features

✅ Browse multiple brand catalogs  
✅ Dynamic product grid rendering  
✅ Product filtering by features  
✅ Quick add-to-devices workflow  
✅ Responsive design (mobile, tablet, desktop)  
✅ Product images and descriptions  
✅ Price and feature information  
✅ Buy links to retailers  
✅ Integration with existing device management  

## Testing

```bash
# Build the project
go build -v ./cmd/

# Run the server
./tauchoportal

# Access the page
# http://localhost:8080/devices
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Catalog not loading | Check JSON file exists in `/public/catalogs/` |
| "Add to Devices" disabled | Ensure brand exists in BRANDS list |
| Styling looks broken | Verify `/public/css/catalog.css` is loaded |
| Products not showing | Check browser console for JSON parse errors |

## Next Steps

1. **Test on different devices** - Verify responsive design
2. **Add more catalogs** - Create catalogs for other brands
3. **Integrate real APIs** - Connect to Govee, Philips, etc.
4. **Add search/filter** - Help users find products
5. **Track favorites** - Let users save products for later

---

See `CATALOG_IMPLEMENTATION.md` for detailed documentation.
