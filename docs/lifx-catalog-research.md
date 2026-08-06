# LIFX Catalog & Affiliate Integration Research

**Date:** August 4, 2026  
**Status:** Research Complete - Ready for Implementation

## Executive Summary

LIFX is a viable option for catalog integration with **significant advantages over Govee**:
- ✅ **Public API available** - Open GitHub repository with machine-readable `products.json`
- ✅ **No authentication needed** - Can fetch product data without API key
- ✅ **Rich product metadata** - Capabilities, firmware versions, feature sets
- ⚠️ **Affiliate program uncertain** - Availability via FlexOffers but status unclear as of 2026
- ✅ **No affiliate auth needed** - Can implement basic catalog now, add affiliate links/tracking later

## LIFX API Overview

### Product Catalog Source
- **Type:** Public GitHub repository (no authentication required)
- **URL:** https://github.com/LIFX/products
- **File:** `products.json` (machine-readable format)
- **Update Frequency:** Community-maintained, regularly updated

### Product Data Structure

```json
{
  "vid": 1,                    // Vendor ID (1 = LIFX)
  "name": "LIFX",              // Brand name
  "defaults": { /* ... */ },   // Default feature flags for vendor
  "products": [
    {
      "pid": 1,                // Product ID (unique per vendor)
      "name": "Original",      // Product model name
      "features": {
        "color": true,         // Supports color adjustment
        "multizone": false,    // Supports multiple zones
        "matrix": false,       // Supports 2D matrix (Tile, Candle)
        "chain": false,        // Supports chained hardware
        "hev": false,          // Supports HEV light emission
        "infrared": false,     // Supports infrared
        "relays": false,       // Has physical relays (Switch)
        "buttons": false,      // Has physical buttons
        "temperature_range": [2500, 9000],  // Kelvin range
        "extended_multizone": false         // Advanced multizone API
      },
      "upgrades": [
        {
          "major": 2,
          "minor": 0,
          "features": { /* firmware version specific features */ }
        }
      ]
    }
  ]
}
```

### Product Categories Observed
- **Smart Bulbs:** A19, A21 (various brightness levels: 800/900/1000 lumen)
- **Smart Fixtures:** BR30 (recessed), T8 (tube)
- **Specialty:** Color A19 (RGB), White variants (tunable/static)
- **Advanced:** Tile (matrix), Candle, Beam (multizone/zone)
- **Control:** LIFX Switch (relay control)
- **Addressable:** 50+ products with varying capabilities

## API Implementation Strategy

### Option A: Direct GitHub Access (Recommended)
**Pros:**
- Zero authentication overhead
- Always up-to-date with official LIFX specs
- Lightweight caching solution
- Perfect for read-only catalog

**Cons:**
- Dependent on GitHub availability
- No rate limiting guarantees
- No pricing/inventory/stock info

**Implementation:**
```go
// Fetch products.json from LIFX GitHub
// Cache locally with TTL (24 hours)
// Parse and return filtered products
// Cost: 1 HTTP request per cache refresh
```

### Option B: LIFX Developer API
**Pros:**
- Official, documented API
- Potential for device control integration

**Cons:**
- Requires authentication (API key)
- Still doesn't provide catalog/pricing
- Built for device control, not product discovery

**Conclusion:** Not suitable for catalog purposes

### Option C: Hybrid Approach
- Use GitHub for technical specs (what we support)
- Use affiliate network for pricing/stock/links
- Combine data before returning to client

## Affiliate Program Status

### Current State (as of August 2026)
- **Direct Program:** Status unclear, possibly paused or private
- **Third-Party Networks:** Available via FlexOffers.com
- **Commission:** Typically 4-10% (industry standard for electronics)
- **Cookie Duration:** 45 days (standard)
- **Status:** Uncertain if actively recruiting new affiliates

### How to Join
1. Go to https://www.flexoffers.com/
2. Search for "LIFX"
3. Submit application (may require website/traffic details)
4. If approved, receive affiliate links and commissions

### Limitations
- ❌ No API-based affiliate feed found
- ❌ No direct API for tracking clicks/conversions
- ❌ Manual link generation (not programmatic)
- ❌ Requires separate affiliate dashboard login

### Recommendation
- **Stage 1:** Implement GitHub-based catalog now (no affiliate needed)
- **Stage 2:** Join FlexOffers or contact LIFX directly for affiliate status
- **Stage 3:** Once affiliate account active, manually generate links and embed in product responses
- **Stage 4:** Consider affiliate tracking/analytics integration later

## Comparison: Govee vs LIFX

### Why Govee Affiliate Likely Rejected You

**Possible Reasons:**
1. **Traffic/Website Requirements:**
   - Govee may require existing audience/website with traffic stats
   - API-based integration might not match their partner profile
   - They may prefer bloggers/reviewers over aggregators

2. **Business Model Mismatch:**
   - Govee may want partners driving direct consumer sales
   - Automation/API-driven traffic may trigger fraud concerns
   - They might prefer quality over quantity

3. **Geographic/Category Restrictions:**
   - Affiliate program may be limited to certain regions
   - May exclude certain types of integrations (APIs, bots, etc.)

4. **Compliance Issues:**
   - May require specific disclosure/branding terms
   - Could be IP/terms-of-service violation
   - May view aggregators as competitive threat

5. **Application Quality:**
   - Rejected because application lacked detail about monetization
   - May have misunderstood use case (saw it as internal tool, not customer-facing)

### LIFX Advantages
- ✅ Public, open API (no gatekeeper approval needed for catalog)
- ✅ Spec data freely available
- ✅ No affiliate approval needed to launch catalog feature
- ✅ Simpler product lineup (easier integration)
- ✅ More developer-friendly documentation
- ✅ Open-source ethos (easier for open integrations)

### LIFX Disadvantages
- ❌ Smaller product catalog (~50 vs Govee's 100+)
- ❌ Affiliate program may be less lucrative
- ❌ Fewer product variants/SKUs per category
- ❌ Less aggressive affiliate recruitment

## Data Mapping for Your API

### Current Response Format
```json
{
  "brand_id": "lifx",
  "products": [
    {
      "product_id": "lifx-original",
      "name": "LIFX Original",
      "category": "smart_bulb",
      "capabilities": {
        "color": true,
        "multizone": false,
        "remote_control": true
      },
      "purchase_url": "https://affiliate.lifx.com/..." // Stage 2+
    }
  ]
}
```

### Data Structure for Catalog Return
```go
type LifxProduct struct {
    ProductID      string            // e.g., "lifx-original"
    Name           string            // e.g., "LIFX Original"
    Features       LifxFeatures      // Capabilities from products.json
    Price          decimal.Decimal   // From affiliate data (Stage 2+)
    AffiliateLink  string            // From affiliate account (Stage 2+)
    InStock        bool              // From affiliate data (Stage 2+)
}

type LifxFeatures struct {
    Color              bool   `json:"color"`
    Multizone          bool   `json:"multizone"`
    Matrix             bool   `json:"matrix"`
    Chain              bool   `json:"chain"`
    HEV                bool   `json:"hev"`
    Infrared           bool   `json:"infrared"`
    Relays             bool   `json:"relays"`
    Buttons            bool   `json:"buttons"`
    TemperatureRange   [2]int `json:"temperature_range"` // [min, max] Kelvin
    ExtendedMultizone  bool   `json:"extended_multizone"`
}
```

## Implementation Roadmap

### Stage 1: Basic Catalog (1-2 days)
- [x] Research complete
- [ ] Create LIFX service layer
- [ ] Implement `GetProducts(ctx, brandID string)` fetching from GitHub
- [ ] Implement `GetProduct(ctx, productID string)` for single product
- [ ] Cache products.json locally (24-hour TTL)
- [ ] Add LIFX to `/catalog/products?brand_id=lifx` endpoint
- [ ] Return only spec data (no pricing/links yet)

### Stage 2: Affiliate Setup (1-3 weeks)
- [ ] Apply to LIFX affiliate program via FlexOffers
- [ ] Get approved and receive affiliate ID/links
- [ ] Create mapping of product_id → affiliate_url
- [ ] Update response to include purchase links
- [ ] Add price/stock fields (manual or semi-automated)

### Stage 3: Advanced Integration (Future)
- [ ] Investigate LIFX API for device control features
- [ ] Add firmware version compatibility info
- [ ] Implement real-time stock checking (if available)
- [ ] Add user reviews/ratings (if available)
- [ ] Consider competitor comparison

### Stage 4: Other Brands (Future)
- [ ] Apply same pattern to other smart home brands
- [ ] Research individual APIs and affiliate programs
- [ ] Prioritize by user demand and affiliate commission rates

## Risk Assessment

### Technical Risks
- **GitHub Availability:** Low risk, GitHub has excellent uptime
- **Rate Limiting:** No published limits, but responsible caching mitigates
- **Data Changes:** products.json rarely changes, 24-hour cache acceptable

### Business Risks
- **Affiliate Approval:** Medium risk, but not blocking catalog launch
- **Commission Rates:** Unknown, may be lower than other brands
- **Market Share:** LIFX smaller than competitors, fewer potential sales

### Mitigation Strategy
1. Implement as optional brand (fallback to DB if API fails)
2. Start with GitHub source, affiliate links optional
3. Monitor affiliate program status, join when ready
4. Use same architecture for other brands to diversify revenue

## Recommendations

### Short Term (This Week)
1. ✅ **Implement Stage 1:** Launch LIFX catalog via GitHub API
   - Provides value immediately (spec data)
   - Zero dependency on affiliate approval
   - Builds foundation for future enhancements

2. ✅ **Contact LIFX:** Reach out to their business/partnership team
   - Ask about affiliate program status
   - Inquire if they have API-based partner integrations
   - Provide use case (smart device orchestration for live streamers)

### Medium Term (Next 2-4 Weeks)
1. **Join FlexOffers:** Submit application for LIFX affiliate program
   - Even if commission is lower, builds revenue stream
   - Understand their API/feed capabilities
   - Get sample links to integrate

2. **Expand to Other Brands:** Research and prioritize next brands
   - Nanoleaf (affiliate program exists, modern API)
   - Phillips Hue (large market share, strong affiliate)
   - Ying Shang/Kasa (STEM education, growing)

### Avoid (for Now)
- ❌ Trying to force Govee integration (business model mismatch likely)
- ❌ Building from scratch without affiliate (focus on revenue, not just features)
- ❌ Real-time inventory from LIFX (they don't provide this)

## Questions to Clarify with Your Team

1. **Monetization Priority:** Is affiliate revenue a major goal, or is product discovery the main value?
2. **Multiple Brands:** Should LIFX be first of many, or focus point for now?
3. **User Preference:** Do your users expect pricing/stock info, or is feature compatibility enough?
4. **Update Frequency:** How fresh do specs need to be? (24hr cache sufficient?)
5. **Technical Debt:** Should catalog be abstracted for easy brand expansion?

## Conclusion

**LIFX is a strong choice for Stage 1 implementation because:**
- ✅ Public API removes approval/authentication friction
- ✅ Rich spec data available immediately
- ✅ No dependency on affiliate program for basic catalog
- ✅ Can be launched this week
- ✅ Sets pattern for other brands

**Recommend:**
1. Start implementation today (basic catalog)
2. Research affiliate program status in parallel
3. Use same architecture for other brands
4. Revisit Govee if they expand affiliate opportunities

