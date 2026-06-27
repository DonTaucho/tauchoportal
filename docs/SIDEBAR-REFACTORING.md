# Channels Sidebar Refactoring: Complete Migration

## What Changed

### 1. Fixed `userJSON` Function (cmd/main.go)
**Problem:** `userJSON` only worked with `*main.UserProfile`, but controller returns different types
**Solution:** Created generic `toJSON(interface{})` function, made `userJSON` call it
**Impact:** Can now serialize any JSON-marshallable type from controllers

### 2. Pre-rendered Template States (templates/layouts/channels.gohtml)
**Problem:** JavaScript was generating entire accordion sections with `innerHTML`
**Solution:** Template now pre-renders ALL possible states (connected/not-connected/not-supported) with `display:none/block`

Structure:
```html
<div class="acc-body-inner">
  <!-- State 1: Not connected (OAuth required) -->
  <div class="acc-not-connected" style="display:none">...</div>
  
  <!-- State 2: Not supported (requires OAuth, not implemented) -->
  <div class="acc-stub" style="display:none">...</div>
  
  <!-- State 3: Connected or public access -->
  <div class="acc-content" style="display:none">
    <search-section>
    <your-channels>
    <subscriptions>
    <manual-add>
  </div>
</div>
```

### 3. Simplified JavaScript (public/js/channels-sidebar.js)
**Before:** `renderAccordionBodyContent()` generated all HTML
**After:** Just manages visibility states and populates data

```javascript
function renderAccordionBodyContent(platformId) {
  // Toggle visibility based on state (NO innerHTML generation)
  const notConnected = inner.querySelector('.acc-not-connected');
  const stub = inner.querySelector('.acc-stub');
  const content = inner.querySelector('.acc-content');
  
  notConnected.style.display = (platform.hasOAuth && !connected) ? 'block' : 'none';
  stub.style.display = (!platform.hasOAuth && !platform.publicAccess) ? 'block' : 'none';
  content.style.display = (connected || platform.publicAccess) ? 'block' : 'none';
  
  // Only render data into prepared containers
  if (connected) {
    loadAccOwnChannelsFromData(platformId);  // Populates acc-own-{id}
    if (hasSubscriptions) loadAccSubs(platformId, null);  // Populates acc-subs-{id}
  }
}
```

## Benefits

### ✅ No More innerHTML Generation
- Search, subscriptions, results: all use `innerHTML` (necessary for dynamic content)
- Structure/state changes: pure CSS `display` properties (safe, simple)
- Text updates: `textContent` only

### ✅ Cleaner Code
- Template is self-documenting (all possible states visible)
- JavaScript is pure logic, not template string building
- No mysterious state machines in JS

### ✅ Better Performance
- No inline style calculations
- Browser can optimize CSS display toggles
- Styles already exist in stylesheet

### ✅ Separation of Concerns
- Template: "What are the possible states?"
- Server: "What data should be shown?"
- JavaScript: "Which state are we in?"

## Before vs After: renderAccordionBodyContent

### Before (Monolithic)
```javascript
function renderAccordionBodyContent(platformId) {
  let html = '';
  if (condition1) {
    html += '<div class="...">...</div>';
  }
  if (condition2) {
    html += '<div class="..."><div class="...">...</div>...</div>';
  }
  html += '<div class="...">...</div>';
  inner.innerHTML = html;  // Danger zone!
  if (condition3) {
    loadAccOwnChannels(platformId);  // Makes API call
  }
}
```

### After (Template-based)
```javascript
function renderAccordionBodyContent(platformId) {
  // Template pre-rendered all HTML, just toggle visibility
  const notConnected = inner.querySelector('.acc-not-connected');
  notConnected.style.display = shouldShow ? 'block' : 'none';
  
  // Only populate data containers
  if (connected) {
    loadAccOwnChannelsFromData(platformId);  // Uses embedded data
  }
}
```

## What Still Uses innerHTML
✅ **Search results** - Dynamic, user-driven, requires rendering
✅ **Your Channels** - Populated from embedded data (not user input)
✅ **Subscriptions** - Lazy-loaded from API

❌ **Accordion structure** - Now CSS display toggles
❌ **Section labels** - Pre-rendered
❌ **Form fields** - Pre-rendered

## Testing Checklist
- [ ] Accordion toggles work (YouTube, Twitch, etc.)
- [ ] "Not connected" message shows when OAuth required but not done
- [ ] "Not supported" message shows for unsupported platforms
- [ ] Your Channels populates correctly (from embedded data)
- [ ] Search still works (dynamic results)
- [ ] Subscriptions load (lazy-load on first open)
- [ ] Add by ID/URL works

## Future Opportunities
1. Pre-render subscriptions too (lazy-load within page)
2. Use same pattern for other pages (conditions list, channel detail, etc.)
3. Cache "Your Channels" for 5 minutes on server
4. Add skeleton loaders with CSS animations

## Golang Template Gotchas Addressed
1. ✅ Variable scope (`:=` vs `=`) - Still needed, now clearly commented
2. ✅ Type conversions - Generic `toJSON` avoids type-specific functions
3. ✅ HTML escaping - Template auto-escapes, `display:none/block` stays in style attribute
4. ✅ Conditional rendering - Pre-render all, toggle with CSS

