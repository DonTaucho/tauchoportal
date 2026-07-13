# Smart Lighting Brand Catalogs - Configuration Guide

## Created Brand Catalogs

### ✅ Partial Templates Created (7 new brands)

1. **`/templates/partials/catalogs/philips-hue.html`** - `catalog-philips-hue`
   - Products: 5 items (bulbs, strips, bridge, starter kit, ceiling light)
   - Focus: Premium, HomeKit integration
   - Affiliate URL: https://www.philips-hue.com/

2. **`/templates/partials/catalogs/lifx.html`** - `catalog-lifx`
   - Products: 5 items (A19 bulbs, strips, BR30, beam, filament)
   - Focus: No hub required, WiFi-only
   - Affiliate URL: https://www.lifx.com/

3. **`/templates/partials/catalogs/nanoleaf.html`** - `catalog-nanoleaf`
   - Products: 5 items (triangles, canvas, hexagons, strips, extensions)
   - Focus: Modular decorative panels
   - Affiliate URL: https://nanoleaf.me/

4. **`/templates/partials/catalogs/wiz.html`** - `catalog-wiz`
   - Products: 5 items (A19 bulbs, strips, ceiling, downlight, outdoor)
   - Focus: Budget-friendly mainstream
   - Affiliate URL: https://www.wizconnected.com/

5. **`/templates/partials/catalogs/tp-link-kasa.html`** - `catalog-tp-link-kasa`
   - Products: 5 items (color bulb, strip, switch, plug, outdoor)
   - Focus: Affordable automation, North America
   - Affiliate URL: https://www.kasasmart.com/

6. **`/templates/partials/catalogs/yeelight.html`** - `catalog-yeelight`
   - Products: 5 items (color bulb, strip, ceiling, bedside lamp, desk lamp)
   - Focus: Budget global, Xiaomi ecosystem
   - Affiliate URL: https://www.yeelight.com/

7. **`/templates/partials/catalogs/wled.html`** - `catalog-wled`
   - Products: 5 items (SP511E controller, WS2812B strip, QuinLED, PSU, starter kit)
   - Focus: Open-source, DIY-friendly
   - Affiliate URL: https://kno.wled.ge/

### ✅ Existing Brand Catalogs

8. **`/templates/partials/catalogs/govee.html`** - `catalog-govee` (pre-existing)
   - Products: 5 items (strips, bulbs, heater, sensor, diffuser)
   - Affiliate URL: Will need to be added

9. **`/templates/partials/catalogs/smart-devices.html`** - `catalog-devices` (generic multi-brand)
   - Products: Generic smart device alternatives

---

## Next Steps: Integrate into devices.html

### Update devices.html to call new partials:

Add these conditionals to `/templates/pages/devices.html` in the accordion section (around line 232):

```html
<!-- Include brand-specific catalog partial -->
{{if eq $brandId "govee"}}
    {{template "catalog-govee" .}}
{{else if eq $brandId "lifx"}}
    {{template "catalog-lifx" .}}
{{else if eq $brandId "philips-hue"}}
    {{template "catalog-philips-hue" .}}
{{else if eq $brandId "nanoleaf"}}
    {{template "catalog-nanoleaf" .}}
{{else if eq $brandId "wiz"}}
    {{template "catalog-wiz" .}}
{{else if eq $brandId "tp-link-kasa"}}
    {{template "catalog-tp-link-kasa" .}}
{{else if eq $brandId "yeelight"}}
    {{template "catalog-yeelight" .}}
{{else if eq $brandId "wled"}}
    {{template "catalog-wled" .}}
{{else if eq $brandId "generic"}}
    {{template "catalog-devices" .}}
{{end}}
```

---

## Affiliate Program Configuration

### Current Setup
- All affiliate links use base URLs **without affiliate IDs** for now
- Each partial has placeholder URLs pointing to brand websites

### To Add Affiliate IDs:

**Option 1: Direct URL replacement** (Manual)
- Edit each HTML file
- Replace base URLs with affiliate links
- Example: `https://www.amazon.com/` → `https://www.amazon.com/?tag=YOUR_AFFILIATE_ID`

**Option 2: Template helper function** (Recommended for future)
- Create a Go template function `affiliateURL(brand, path)`
- Call it in all partials
- Centralize affiliate ID management
- Easier to update across all brands

**Option 3: Database/config file**
- Store affiliate IDs in a config file or database
- Load at template render time
- Most maintainable for future scale

---

## Image Placeholders

All product images are expected at `/public/image/catalog/`:

```
/public/image/catalog/
├── philips-hue/
│   ├── hue-a19.jpg
│   ├── hue-strip.jpg
│   ├── hue-bridge.jpg
│   ├── hue-starter.jpg
│   └── hue-ceiling.jpg
├── lifx/
│   ├── lifx-a19.jpg
│   ├── lifx-strip.jpg
│   ├── lifx-br30.jpg
│   ├── lifx-beam.jpg
│   └── lifx-filament.jpg
├── nanoleaf/
│   ├── nanoleaf-triangles.jpg
│   ├── nanoleaf-canvas.jpg
│   ├── nanoleaf-hexagon.jpg
│   ├── nanoleaf-strips.jpg
│   └── nanoleaf-shapes-ext.jpg
├── wiz/
│   ├── wiz-a19.jpg
│   ├── wiz-strip.jpg
│   ├── wiz-ceiling.jpg
│   ├── wiz-downlight.jpg
│   └── wiz-outdoor.jpg
├── kasa/
│   ├── kasa-color-a19.jpg
│   ├── kasa-strip.jpg
│   ├── kasa-switch.jpg
│   ├── kasa-plug.jpg
│   └── kasa-outdoor.jpg
├── yeelight/
│   ├── yeelight-color.jpg
│   ├── yeelight-strip.jpg
│   ├── yeelight-ceiling.jpg
│   ├── yeelight-bedside.jpg
│   └── yeelight-desk.jpg
├── wled/
│   ├── wled-sp511e.jpg
│   ├── wled-ws2812b.jpg
│   ├── wled-quinled-uno.jpg
│   ├── wled-psu-12v.jpg
│   └── wled-starter-kit.jpg
├── govee/
│   ├── govee-h6127.jpg
│   ├── govee-h6052.jpg
│   ├── govee-heater.jpg
│   ├── govee-h5075.jpg
│   └── govee-diffuser.jpg
```

Use `/image/product-placeholder.png` as fallback if image is missing.

---

## Product Categories Used

All products are tagged with data-category for filtering:

- **bulbs** - Standard light bulbs
- **strips** - LED strips/tape lighting
- **panels** - Modular lighting panels
- **fixtures** - Built-in ceiling/wall lights
- **lamps** - Table/desk/bedside lamps
- **hubs** - Central hubs/bridges
- **switches** - Wall switches
- **plugs** - Smart outlets/plugs
- **controllers** - LED strip controllers
- **accessories** - Power supplies, extensions
- **kits** - Starter/bundle kits
- **outdoor** - Weather-resistant outdoor lights

---

## Next Actions

1. ✅ Create all 7 new brand partial templates (DONE)
2. ⏳ Update `/templates/pages/devices.html` to include conditional partial calls
3. ⏳ Add brand entries to database (if using database for brands)
4. ⏳ Copy/provide product images to `/public/image/catalog/`
5. ⏳ Add affiliate IDs to brand configuration
6. ⏳ Test modal accordion with new partials
7. ⏳ Add new brands to brand selector UI

---

## Brand ID Mapping

Use these IDs in database/configuration:

| ID | Brand | Partial | Status |
|---|---|---|---|
| `govee` | Govee | `catalog-govee` | ✅ Ready |
| `lifx` | LIFX | `catalog-lifx` | ✅ Ready |
| `philips-hue` | Philips Hue | `catalog-philips-hue` | ✅ Ready |
| `nanoleaf` | Nanoleaf | `catalog-nanoleaf` | ✅ Ready |
| `wiz` | WiZ | `catalog-wiz` | ✅ Ready |
| `tp-link-kasa` | TP-Link Kasa | `catalog-tp-link-kasa` | ✅ Ready |
| `yeelight` | Yeelight | `catalog-yeelight` | ✅ Ready |
| `wled` | WLED | `catalog-wled` | ✅ Ready |
| `generic` | Generic Smart Devices | `catalog-devices` | ✅ Ready |

---

## Notes

- All partials follow the same HTML structure for consistency
- Each product has action tags for filtering (see JavaScript in devices.html)
- Affiliate links are placeholder URLs ready for ID insertion
- All images use fallback placeholder on 404
- Products include realistic pricing and features for each brand
- Ready to be modified independently without affecting modal logic
