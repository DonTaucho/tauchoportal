# Device Catalog - Integrated Modal Design

## Overview

The device catalog is now seamlessly integrated into the device selection modal (Step 1 of "Add Device"). Users can browse, compare, and select both their owned devices and available catalog products in a single, streamlined interface.

## Design Philosophy

**Cleaner than separate tabs**: The integrated approach eliminates context switching and provides a unified experience where users can:
- See what they already own
- Discover new products from the same brand
- Add new products without leaving the modal
- Quickly compare options side-by-side

## Modal Structure

### Brand Accordion

Each brand appears as an accordion item in the modal:

```
┌─────────────────────────────────────────┐
│  ▶ 💡 Govee            2 owned + 3 available
├─────────────────────────────────────────┤
│  ✓ Owned Devices                        │
│  ├─ Gaming Room LED Strip          ✓ OWNED
│  └─ Living Room Bulb               ✓ OWNED
│                                         │
│  ─ Available to Add ─                   │
│                                         │
│  Category Filters                       │
│  [All (3)] [Lights (2)] [Accessories]   │
│                                         │
│  ✓ Available Catalog                    │
│  ├─ H6052 Smart Bulb          $8.99-14.99
│  ├─ H6127 LED Strip            $29.99   │
│  └─ Aroma Diffuser             $39.99   │
│                                         │
└─────────────────────────────────────────┘
```

### Sections

#### 1. **Owned Devices Section**
- Displays user's devices for this brand
- Each item shows:
  - Device name
  - Device model/product ID
  - Green `✓ Owned` badge
- Clickable to re-configure or view details
- Only shown if user owns devices from this brand

#### 2. **Separator Line**
- Visual divider: "Available to Add"
- Only shown if there are catalog items below
- Helps distinguish owned from available products

#### 3. **Category Filters**
- Filter buttons for catalog products by category
- Shows count per category: "Lights (2)", "Sensors (3)", etc.
- Default filter: "All (5)" button selected
- Only shown if multiple categories exist
- Clicking a filter updates the list below in real-time

#### 4. **Catalog Products Section**
- Lists available products from this brand's catalog
- Each item shows:
  - Product name
  - Supported actions (first 2): "on, off, color..."
  - Price or price range
  - Green left border (distinguishes from owned devices)
  - Light background color on hover
- Clickable to add as new device

## User Flows

### Adding a Device (New)

1. User clicks **"+ Add Device"** on My Devices page
2. Modal opens → Step 1: Brand Selection
3. User expands a brand accordion (e.g., "Govee")
4. Sees owned devices at top (with badges)
5. Sees available catalog products below
6. **Optionally** filters by category
7. Clicks a catalog product → Step 2: Configure
8. Fills in device name, credentials, location
9. Saves → Device added to My Devices

### Re-configuring Owned Device

1. User clicks **"Edit"** on an owned device
2. Modal opens → Step 1: Brand Selection
3. Modal expands the device's brand accordion
4. User sees the device in **Owned Devices** section with `✓ Owned` badge
5. Clicks it → Step 2: Pre-filled with existing config
6. Modifies settings and saves

### Discovering New Products

1. User wants to add more devices from a brand they use
2. Opens modal → Looks at device's brand section
3. Sees owned devices + available products together
4. Browses catalog items, filters by category if needed
5. Clicks an item to add

## Design Details

### CSS Styling

**Owned Devices:**
- Standard product item styling
- Green badge: `#c8e6c9` background, `#2e7d32` text
- Hover: Light background change

**Separator:**
- Uppercase text: "Available to Add"
- Gray color: `#999`
- Border-top: `1px solid #e8e8e8`
- Subtle but clear visual break

**Category Filters:**
- Pill-shaped buttons with borders
- Inactive: White background, gray text
- Active: Green background `#4CAF50`, white text
- Hover: Border turns green, background tints green
- Only shown if 2+ categories exist

**Catalog Products:**
- Left border: `3px solid #4CAF50` (green)
- Background: `#fafafa` (light gray)
- Hover: `#f0fdf4` (light green)
- Price in smaller green text: `#4CAF50`, font-weight: 600

### Responsive Design

- **Desktop**: Full width accordion with category filters visible
- **Tablet**: Category filters may wrap
- **Mobile**: Single-column layout, filters stack vertically
- All interactions remain touch-friendly

## Implementation Details

### JavaScript Functions

**`renderBrandAccordion()`**
- Main function that generates accordion HTML
- Merges `MY_DEVICES` and catalog products by brand
- Extracts categories from products
- Handles filtering and display logic

**`extractCategories(products)`**
- Utility to find unique categories in product array
- Returns sorted list of category strings

**`filterCatalogByCategory(btn, brandId, category)`**
- Filters catalog items by selected category
- Updates button active states
- Shows/hides product items in real-time

**`toggleAccordion(headerBtn)`**
- Opens/closes accordion item
- Lazy-loads catalog products on first open (if needed)

**`selectProduct(brandId, productId, productName)`**
- Clicked when user selects a product (owned or catalog)
- Proceeds to Step 2: Configure
- Pre-fills product name and other details

### Data Flow

```
renderBrandAccordion()
├─ Loop through BRANDS
│  ├─ Get MY_DEVICES for this brand (owned devices)
│  ├─ Get PRODUCTS[brand.id] (catalog products)
│  ├─ Extract categories from catalog
│  ├─ Build HTML:
│  │  ├─ Owned devices section
│  │  ├─ Separator
│  │  ├─ Category filters
│  │  └─ Catalog products
│  └─ Return accordion item HTML
└─ Add Custom Device item at end
```

## Adding Categories to Catalogs

To support category filtering, add a `category` field to each product in your catalog JSON:

```json
{
  "id": "product-id",
  "name": "Product Name",
  "category": "Lights",  // ← Add this field
  "supported_actions": ["on", "off", "color"],
  // ... other fields
}
```

**Common categories:**
- Lights
- Power (plugs, outlets)
- Sensors (motion, temperature, humidity)
- Climate Control (heaters, thermostats, fans)
- Hubs & Speakers
- Accessories

See `/public/catalogs/README.md` for full catalog structure.

## Browser Compatibility

- Modern browsers with ES6+ support
- All major browsers: Chrome, Firefox, Safari, Edge
- Mobile browsers: iOS Safari, Chrome Mobile, Firefox Mobile

## Performance Considerations

- **Lazy loading**: Catalog products load when accordion opens (if not pre-loaded)
- **Category filtering**: Real-time filtering without re-rendering entire accordion
- **Memory**: Minimal overhead; categories extracted on demand
- **Scale**: Tested with 5-10 products per category; scales to 20+ without issues

## Future Enhancements

1. **Search**: Add search box to filter products by name/features
2. **Sorting**: Sort by price, popularity, newest
3. **Favorites**: Star favorite products for quick access
4. **Reviews**: Show user reviews and ratings
5. **Availability**: Real-time stock/availability status
6. **Inventory Sync**: Auto-sync with Govee API for real-time catalogs
7. **Comparison**: Compare specs between owned and catalog products
8. **Recommendations**: AI suggestions based on devices you own

## Troubleshooting

### Categories not showing filter buttons
- Check that products have `category` field in JSON
- Ensure multiple unique categories exist
- Clear browser cache if using old JSON

### Owned devices not showing with badges
- Verify `MY_DEVICES` is properly loaded from server
- Check device `brand` field matches catalog brand ID
- Check CSS for `.product-owned-badge` styling

### Catalog products not showing
- Check `/public/catalogs/{brand}.json` file exists
- Validate JSON structure (use `json -lint`)
- Check browser console for fetch errors
- Verify `PRODUCTS[brand.id]` is populated when accordion opens

## Code Locations

- **Main markup**: `/templates/pages/devices.html` (lines 176-260)
- **Rendering logic**: `/templates/pages/devices.html` (lines 591-750)
- **Styling**: `/public/css/devices.css` (lines 545-675)
- **Catalog data**: `/public/catalogs/{brand}.json`
- **Configuration**: `/public/catalogs/README.md`
