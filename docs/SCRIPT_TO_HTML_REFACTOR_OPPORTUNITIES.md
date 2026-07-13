# Script-to-HTML Refactor Opportunities

## Analysis Results

I've reviewed the JavaScript in `devices.html` and identified the following HTML-generating patterns:

### ✅ Already Refactored
- **Brand Accordion** (lines 244-268 in HTML): Moved to Go template conditionals with CSS-only state management
- **Owned Devices List**: Pre-rendered in Go template
- **Catalog Products**: Moved to partial templates by brand

---

## 🔄 Candidates for Refactoring (Can be converted but lower priority)

### 1. **Credential Fields** (`renderCredFields()` - lines 586-612)
**Current approach:** JavaScript generates HTML based on brand's credential_fields array

```javascript
document.getElementById('credFields').innerHTML = brand.credential_fields.map(f => {
    if (f.type === 'info') return `<div class="cred-info"><p>${f.help}</p></div>`;
    // ... more HTML generation
}).join('');
```

**Could be moved to:** Go template in HTML with `display: none` for each field, toggled by JS
**Complexity:** Medium - Would need to render all credential fields for all brands upfront
**Benefit:** Slightly cleaner, but JavaScript generation is appropriate here because:
- Only rendered when a product is selected (lazy rendering)
- Reduces initial HTML payload
- Fields are data-driven (depends on brand.credential_fields)

**Recommendation:** Keep as-is (JavaScript is appropriate for data-driven rendering)

---

### 2. **Custom Actions List** (`renderCustomActionsList()` - lines 623-650)
**Current approach:** JavaScript generates custom action cards dynamically

```javascript
const html = window.customActions.map((action, idx) => `
    <div class="custom-action-card" ...>
        // Form inputs for action configuration
    </div>
`).join('');
```

**Could be moved to:** Pre-rendered template with hidden cards, toggled by JS
**Complexity:** High - Would need to pre-render empty templates for N possible actions
**Benefit:** Slightly cleaner HTML structure
**Recommendation:** Keep as-is (JavaScript generation is appropriate here because:
- Variable number of actions (0 to many)
- Each action card includes onchange handlers bound to array indices
- Fully dynamic content driven by user input
- Pre-rendering N blank cards would bloat HTML unnecessarily

---

### 3. **Step 2 Header Content** (`setStep2Brand()` / `setStep2Custom()` - lines 550-584)
**Current approach:** JavaScript sets innerHTML for brand badge

```javascript
document.getElementById('step2BrandBadge').innerHTML =
    `<span class="brand-step-badge" ...>${brandIcon} ${brand.name}</span>`;
```

**Could be moved to:** Pre-rendered badges for each step, toggled by display
**Complexity:** Low - Just a few small badges
**Benefit:** Minimal - These are small, rarely change after initial rendering
**Recommendation:** Keep as-is (Very low-value refactor, not worth the overhead)

---

## 📊 Summary Table

| Function | Lines | Type | HTML Size | Frequency | Recommendation |
|----------|-------|------|-----------|-----------|-----------------|
| `renderCredFields()` | 586-612 | Data-driven | Small-Medium | Per product select | Keep JavaScript |
| `renderCustomActionsList()` | 623-650 | Variable-length | Medium | Per action add/remove | Keep JavaScript |
| `setStep2Brand/Custom()` | 550-584 | Badge replacement | Tiny | Per product select | Keep JavaScript |

---

## ✨ Conclusion

**The good news:** Your accordion refactor was the **major win**. The remaining JavaScript HTML generation is:

1. **Appropriately dynamic** - These are triggered by user actions, not page load
2. **Data-driven** - Content depends on API data, not just static templating
3. **Variable-sized** - Don't have fixed counts (credential fields vary by brand, custom actions are 0-to-many)
4. **Low complexity** - Not worth the overhead of pre-rendering and toggling

**Recommendation:** No further refactoring needed. The current state is:
- ✅ Clean and maintainable
- ✅ Performant (minimal re-rendering)
- ✅ Uses JavaScript appropriately for dynamic content
- ✅ Uses Go templates for static structure

The pattern you established—**static structure in templates, CSS toggling for visibility, JavaScript only for event-driven dynamic content**—is the optimal approach for this page. 🎯
