# Device Modal Refactor - HTML Templates Instead of JavaScript Generation

## Problem
Too much JavaScript-generated HTML made debugging confusing and hard to maintain:
- Catalog products not showing
- Accordion rendering issues  
- Hard to trace where HTML comes from
- Difficult to distinguish between template and runtime code

## Solution
**Moved ALL HTML generation from JavaScript to Go templates** using CSS display toggling for dynamic behavior.

## What Changed

### Before (JavaScript-Heavy)
```javascript
function renderBrandAccordion() {
    const catalogItems = BRANDS.map(b => {
        let productsHtml = `<div class="accordion-products">`;
        // ... 100+ lines of template literals
        productsHtml += `<div class="catalog-products-section">`;
        allProducts.forEach(p => {
            productsHtml += `<div class="catalog-product-item">...`;  
        });
        // ... more string concatenation
    });
    document.getElementById('brandAccordion').innerHTML = catalogItems;
}
```
Problems:
- Hard to see actual HTML structure
- String escaping errors  
- Impossible to use browser DevTools to inspect
- Error-prone quote escaping

### After (HTML Templates)
```html
{{range .Devices.BrandsSorted}}
    <div class="accordion-item" data-brand-id="{{.Id}}">
        <button type="button" class="accordion-header" onclick="toggleAccordion(this)">
            ...
        </button>
        <div class="accordion-products">
            {{range $.Devices.Devices}}
                {{if eq .Brand .BrandId}}
                <div class="product-item">{{.Name}}</div>
                {{end}}
            {{end}}
        </div>
    </div>
{{end}}
```
Benefits:
- ✅ Clear, readable HTML structure
- ✅ Works with browser DevTools
- ✅ No string escaping needed
- ✅ Easy to maintain and modify
- ✅ All rendering in one place

## JavaScript Simplification

### Removed Functions (130+ lines)
- ❌ `renderBrandAccordion()` - Complex JS template generation
- ❌ `extractCategories()` - Logic moved to template
- ❌ Dynamic product loading on accordion open

### Kept Functions (Simplified, ~40 lines)
- ✅ `toggleAccordion(headerBtn)` - Opens/closes accordion with CSS
- ✅ `filterCatalogByCategory(btn, brandId, category)` - Filters with `display: block/none`
- ✅ `selectProduct(brandId, productId, productName)` - Handles selection

## HTML Template Structure

**File:** `/templates/pages/devices.html` (lines 154-261)

```
Modal Body
├── Brand Accordion Items ({{range .Devices.BrandsSorted}})
│   ├── Accordion Header
│   └── Accordion Products
│       ├── Owned Devices Section
│       ├── Section Divider (conditionally shown)
│       ├── Category Filters (conditionally shown)
│       └── Catalog Products Section
└── Custom Device Item
```

### Key Template Logic

**Owned Devices (Always rendered at load time)**
```html
{{range $.Devices.Devices}}
    {{if eq .Brand $brandId}}
    <div class="product-item">{{.Name}} <span class="product-owned-badge">✓ Owned</span></div>
    {{end}}
{{end}}
```

**Separator (Shown only if owned devices + catalog items exist)**
```html
{{if and $hasOwned (gt (len $products) 0)}}
<div class="section-divider">Available to Add</div>
{{end}}
```

**Catalog Products (All rendered at load time)**
```html
{{if gt (len $products) 0}}
<div class="catalog-products-section" data-brand-id="{{$brandId}}">
    {{range $products}}
    <div class="catalog-product-item" data-category="{{.Category}}">
        {{.Name}}
    </div>
    {{end}}
</div>
{{end}}
```

## Dynamic Behavior (CSS + Minimal JS)

### Accordion Toggle
```javascript
function toggleAccordion(headerBtn) {
    const item = headerBtn.closest('.accordion-item');
    const isOpen = item.classList.contains('open');
    
    // Close others
    document.querySelectorAll('.accordion-item.open').forEach(i => {
        if (i !== item) i.classList.remove('open');
    });
    
    // Toggle this one
    item.classList.toggle('open', !isOpen);
}
```

**CSS handles visibility:**
```css
.accordion-products {
    display: none;  /* Hidden by default */
}

.accordion-item.open .accordion-products {
    display: block;  /* Shown when open */
}
```

### Category Filtering
```javascript
function filterCatalogByCategory(btn, brandId, category) {
    // Update button states
    btn.closest('.catalog-category-filters')
        .querySelectorAll('.category-filter-btn')
        .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Show/hide items
    const section = document.querySelector(`.catalog-products-section[data-brand-id="${brandId}"]`);
    section.querySelectorAll('.catalog-product-item').forEach(item => {
        item.style.display = (category === '' || item.dataset.category === category) ? 'block' : 'none';
    });
}
```

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **HTML Location** | Scattered in JS | Single template file |
| **Debugging** | Browser console only | Browser DevTools + template |
| **Line Count (JS)** | ~140 lines | ~40 lines |
| **String Escaping** | Error-prone | None needed |
| **Performance** | Slower rendering | Faster (static HTML) |
| **Maintainability** | Hard | Easy |
| **New Developer** | Confusing | Clear |

## How It Works Now

### Page Load
1. Server renders Go template → Full accordion HTML sent to browser
2. Owned devices + catalog products already in DOM
3. Accordion items hidden by default (`display: none`)

### User Clicks "+ Add Device"
1. Modal opens
2. `openAddModal()` just calls `showStep(1)` (no rendering)
3. All HTML already there

### User Clicks Brand Accordion
1. `toggleAccordion()` called
2. Adds/removes `open` class
3. CSS shows/hides `.accordion-products` div
4. **No re-rendering, just visibility toggle**

### User Clicks Category Filter
1. `filterCatalogByCategory()` called
2. Updates button `.active` state
3. Sets `display: block/none` on catalog items
4. **Instant filtering, no re-rendering**

## Migration Path for Other Components

If other pages/components have similar JS template generation issues:

```javascript
// ❌ OLD (Bad)
function renderItems() {
    let html = '';
    items.forEach(item => {
        html += `<div class="item">${item.name}</div>`;
    });
    container.innerHTML = html;
}

// ✅ NEW (Good)
<!-- In template -->
{{range .Items}}
    <div class="item">{{.Name}}</div>
{{end}}

<!-- In JavaScript -->
function showItems(category) {
    document.querySelectorAll('.item').forEach(el => {
        el.style.display = el.dataset.category === category ? 'block' : 'none';
    });
}
```

## Testing Checklist

- ✅ Build succeeds
- ✅ Modal opens without errors
- ✅ Owned devices show correctly
- ✅ Catalog products show with green border
- ✅ "Available to Add" separator visible when needed
- ✅ Category filters work (click and items filter)
- ✅ Accordion open/close works
- ✅ Product selection works (click → Step 2)
- ✅ Custom device option visible
- ✅ Responsive on mobile/tablet

## Code Locations

- **HTML Template**: `/templates/pages/devices.html` lines 154-261
- **Accordion CSS**: `/public/css/devices.css` lines ~470-680
- **JS Functions**: `/templates/pages/devices.html` lines ~520-560
- **Category Filters**: `/public/css/devices.css` lines ~590-620
- **Product Items**: `/public/css/devices.css` lines ~625-675

## Benefits for Future

This approach makes it easy to:
- ✅ Add new sections (just add HTML + CSS)
- ✅ Modify styling (change CSS, don't touch JS)
- ✅ Debug issues (inspect real HTML elements)
- ✅ Onboard new developers (clear structure)
- ✅ Test functionality (static HTML is predictable)
