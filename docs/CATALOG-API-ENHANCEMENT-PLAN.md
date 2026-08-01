# Catalog API Enhancement Plan - LIFX & Product Catalog

## Overview
Current implementation hardcodes products in the LIFX catalog page (5 products shown as example). This is not scalable given:
- **LIFX**: ~700-800 released products
- **Govee**: 800+ products
- **Other brands**: Similar scales

**Solution**: Enhance backend `/catalog/products` endpoint with pagination, search, and category filtering to support dynamic loading.

---

## Current State

### Existing Endpoint
```
GET /catalog/products?brand_id=<id>&active_only=true
```

**Current Parameters:**
| Param | Default | Type | Description |
|-------|---------|------|-------------|
| `brand_id` | (all) | string | Filter to specific brand |
| `active_only` | true | boolean | Include/exclude retired products |

**Current Response:**
```json
[
  {
    "id": "govee-h6159",
    "brand_id": "govee",
    "name": "H6159 LED Strip",
    "category": "light_strip",
    "logo_url": "",
    "supported_actions": ["set_color", "set_brightness", "turn_on", "turn_off"],
    "is_active": true,
    "created_at": "...",
    "updated_at": "..."
  }
]
```

### Current Frontend Usage
- LIFX page uses hardcoded array of 5 products
- No backend API calls yet
- No pagination/filtering

---

## Required Enhancements

### Backend API Changes

#### 1. Enhanced GET /catalog/products Endpoint

```
GET /catalog/products?brand_id=<id>&active_only=true&limit=20&offset=0&category=bulbs&search=a19
```

**New Query Parameters:**

| Param | Default | Type | Description | Example |
|-------|---------|------|-------------|---------|
| `brand_id` | (all) | string | Filter to specific brand | `lifx` |
| `active_only` | true | boolean | Include/exclude retired | `true` |
| `limit` | 50 | int | Items per page (max 200) | `20` |
| `offset` | 0 | int | Pagination offset | `0` |
| `search` | (none) | string | Search by name/description | `a19` |
| `category` | (all) | string | Filter by category | `bulbs` |
| `sort_by` | `name` | string | Sort field | `name`, `category`, `created_at` |

**Enhanced Response:**
```json
{
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 847,
    "total_pages": 43,
    "has_next": true,
    "has_previous": false
  },
  "products": [
    {
      "id": "lifx-a19",
      "brand_id": "lifx",
      "name": "LIFX A19 Color Bulb",
      "category": "bulbs",
      "logo_url": "/image/catalog/lifx-a19.avif",
      "description": "16 million colors, WiFi only, no hub needed",
      "supported_actions": ["set_color", "set_brightness", "turn_on", "turn_off"],
      "features": ["16M Colors", "WiFi", "No Hub", "Smart Scheduling"],
      "specifications": {
        "lumens": 1100,
        "color_temperature_range": "2000K-6500K",
        "voltage": "120V",
        "socket_type": "E26"
      },
      "price_usd": 14.99,
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Category Standardization

**Expected Categories** (per brand):
- `bulbs` - Traditional light bulbs (A19, BR30, etc.)
- `strips` - LED light strips
- `panels` - Modular panel systems (Beam, Nanoleaf, etc.)
- `smart_plugs` - Power control devices
- `switches` - Wall switches
- `sensors` - Motion/environmental sensors
- `hubs` - Bridge/hub devices
- `other` - Miscellaneous

---

## Frontend Implementation Plan

### Phase 1: API Integration (This file)

**File**: `/templates/partials/catalogs/lifx.html`

**Changes**:
1. Remove hardcoded product array
2. Add API call to fetch products on page load
3. Implement pagination (next/previous buttons or infinite scroll)
4. Connect search input to API search parameter
5. Connect category tabs to API category filter

**JavaScript Functions to Add**:
```javascript
// Load initial products
async function loadLifxProducts(options = {}) {
  const params = new URLSearchParams({
    brand_id: 'lifx',
    active_only: true,
    limit: options.limit || 20,
    offset: options.offset || 0,
    category: options.category || 'all',
    search: options.search || '',
    sort_by: options.sort_by || 'name'
  });
  
  const response = await fetch(`/api/catalog/products?${params}`);
  const data = await response.json();
  return data;
}

// Handle search with debounce
function setupSearchHandler() {
  const searchInput = document.getElementById('lifxSearch');
  let timeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      loadProducts({ search: e.target.value, offset: 0 });
    }, 300);
  });
}

// Handle category tab switching
function switchLifxTab(button, category) {
  // ... existing tab styling code ...
  loadProducts({ category, offset: 0 });
}

// Handle pagination
function loadNextPage() {
  const currentOffset = state.pagination.offset;
  const nextOffset = currentOffset + state.pagination.limit;
  loadProducts({ offset: nextOffset });
}
```

**New UI Elements**:
- Pagination buttons (Previous/Next)
- Loading spinner during API calls
- "No results" message for empty searches
- Result count display (e.g., "Showing 1-20 of 847")

---

## Backend Implementation Checklist

**Required Changes in Backend** (For you to coordinate with backend team):

- [ ] Add `limit`, `offset` parameters to GET `/catalog/products`
- [ ] Add `search` parameter (searches name + description fields)
- [ ] Add `category` filter parameter
- [ ] Add `sort_by` parameter (name, category, created_at)
- [ ] Add pagination metadata to response:
  - `limit`, `offset`, `total`, `total_pages`, `has_next`, `has_previous`
- [ ] Ensure all products have standardized `category` field (not nullable)
- [ ] Add optional fields to product response:
  - `description` (text summary)
  - `features` (array of strings)
  - `specifications` (object with key specs)
  - `price_usd` (optional for affiliate tracking)
- [ ] Performance: Add database indexes on:
  - `brand_id` + `is_active` (for filtering)
  - `category` (for filtering)
  - `name` (for search, with full-text index preferred)

---

## Implementation Timeline

### Stage 1: Backend API Enhancement
**Estimated**: 1-2 days
- Modify `/catalog/products` endpoint
- Add pagination & search logic
- Test with large product sets (800+ items)
- Document updated API

### Stage 2: Frontend Integration
**Estimated**: 1 day
- Update `/templates/partials/catalogs/lifx.html`
- Implement API calls + UI binding
- Add loading states & error handling
- Test with real API

### Stage 3: Reusable Catalog Pattern
**Estimated**: 1-2 days
- Create reusable `/templates/partials/catalogs/catalog-template.html`
- Apply same pattern to other brands (Govee, Nanoleaf, Hue, etc.)
- Consistent search/tab/pagination UI across all catalogs

---

## Questions for Backend Team

Before backend starts implementation:

1. **Search Behavior**: Should search be:
   - Case-insensitive prefix matching (fast): `a19` matches `A19 Color Bulb`
   - Full-text search (slower): `a19 color` matches products with both terms
   - Fuzzy search (most helpful): `a91` might match `A19`?

2. **Product Categories**: Is there a fixed list of categories, or can we add new ones dynamically?

3. **Specifications Field**: Should this be a fixed schema (lumens, voltage, etc.) or flexible JSON per brand?

4. **Image URLs**: Are `logo_url` and product images hosted on backend, or should frontend construct URLs from product IDs?

5. **Performance Limits**: What's the max realistic `limit` value we should support (e.g., 100, 500)?

---

## Notes

- **Backward Compatibility**: Existing hardcoded products still work in current page
- **Gradual Migration**: Can migrate one brand at a time (start with LIFX, then Govee)
- **Fallback**: If API fails, page shows empty state with retry button (graceful degradation)
- **Caching**: Consider frontend caching of product list for 5-10 minutes to reduce API calls

---

## References

- Current API Spec: `/docs/api-spec.md` (Line: `GET /catalog/products?brand_id=...`)
- LIFX Catalog Page: `/templates/partials/catalogs/lifx.html`
- Related Brand Settings: `/templates/pages/brand-settings.html`
