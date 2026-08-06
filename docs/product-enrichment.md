# Product Catalog Enrichment - Campaign & Recommendations

**Date:** August 4, 2026  
**Feature:** Smart Product Enrichment with Campaign Data

## Overview

The product catalog now includes intelligent enrichment data that enhances the user experience and enables better monetization:

- **Campaign Badges** - Highlight special products (New, Popular, Advanced, etc.)
- **Campaign Messages** - Contextual promotional text
- **Recommendations** - Hand-picked featured products with reasons
- **Estimated Pricing** - For reference and affiliate linking
- **Discount Tracking** - Support for promotional discounts

This information is automatically generated for LIFX products based on device capabilities, and can be manually set for database products.

## Response Format

All catalog endpoints now return enriched product data:

```json
{
  "id": "lifx-1",
  "brand_id": "lifx",
  "name": "Original",
  "category": "light",
  "supported_actions": ["turn_on", "turn_off", "set_color", "set_brightness", "set_color_temperature", "start_effect"],
  "is_active": true,
  
  "campaign_badge": "Popular",
  "campaign_message": "Best-selling color bulb",
  "campaign_end_date": null,
  "discount_percent": null,
  "estimated_price": 69.99,
  
  "is_recommended": true,
  "recommended_reason": "Classic LIFX favorite - reliable and popular",
  
  "created_at": "2026-08-04T12:44:55Z",
  "updated_at": "2026-08-04T12:44:55Z"
}
```

## Field Reference

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `campaign_badge` | string (optional) | Short promotional label | "New", "Popular", "Advanced", "Limited Time" |
| `campaign_message` | string (optional) | Longer promotional text | "Perfect for live streaming lighting effects" |
| `campaign_end_date` | timestamp (optional) | When campaign expires | "2026-09-04T23:59:59Z" |
| `discount_percent` | decimal (optional) | Discount amount (0-100) | 15.50 (for 15.5% off) |
| `estimated_price` | decimal (optional) | Price in USD | 69.99 |
| `is_recommended` | boolean | Whether product is hand-picked | true/false |
| `recommended_reason` | string (optional) | Why we recommend it | "Advanced multizone control - perfect for live streaming setups" |

## LIFX Automatic Enrichment

For LIFX products, enrichment is automatic based on device capabilities:

### Campaign Badges
- **"Advanced"** - Products with multizone or matrix capabilities
- **"Popular"** - Full-color bulbs (mass-market appeal)

### Recommendations
Automatically recommended if product:
- Has matrix or extended multizone capabilities
- Is a flagship model (Original, Tile, Beam, etc.)
- Has rare/premium features

### Reasons
Automatically generated reasons:
- Matrix products: "Premium matrix lighting - creates stunning visual effects"
- Multizone: "Advanced multizone control - perfect for live streaming setups"
- Color bulbs: "Full color control - most versatile lighting option"
- Classics: "Classic LIFX favorite - reliable and popular"
- Switch: "Smart relay control - integrate any device"

## Database Products

For products stored in the database (non-API-based), admin can manually set enrichment fields via:

### Create Product with Enrichment
```
POST /catalog/products
{
  "id": "govee-h6159",
  "brand_id": "govee",
  "name": "H6159 LED Strip",
  "category": "light_strip",
  "supported_actions": ["set_color", "set_brightness", "turn_on", "turn_off"],
  
  "campaign_badge": "New",
  "campaign_message": "Just released - 20% off launch week",
  "campaign_end_date": "2026-08-11T23:59:59Z",
  "discount_percent": 20,
  "estimated_price": 59.99,
  
  "is_recommended": true,
  "recommended_reason": "Best value for multicolor LED strips",
  
  "is_active": true
}
```

### Update Product Enrichment
```
PATCH /catalog/products/update?id=govee-h6159
{
  "campaign_badge": "Flash Sale",
  "campaign_message": "Limited time: 30% off today only",
  "discount_percent": 30
}
```

## Frontend Usage

### Display Campaign Badge
```html
{if product.campaign_badge}
  <span class="badge">{product.campaign_badge}</span>
{/if}
```

### Display Campaign Message
```html
{if product.campaign_message}
  <p class="campaign-text">{product.campaign_message}</p>
{/if}
```

### Show Recommendation Star
```html
{if product.is_recommended}
  <span class="star">⭐</span>
  <p class="reason">{product.recommended_reason}</p>
{/if}
```

### Display Discounted Price
```javascript
if (product.discount_percent) {
  const discount = (product.estimated_price * product.discount_percent) / 100;
  const discounted = (product.estimated_price - discount).toFixed(2);
  console.log(`Was $${product.estimated_price}, now $${discounted}`);
}
```

### Highlight Expiring Campaigns
```javascript
if (product.campaign_end_date) {
  const endDate = new Date(product.campaign_end_date);
  const hoursLeft = (endDate - Date.now()) / (1000 * 60 * 60);
  if (hoursLeft < 24) {
    console.log(`Campaign expires in ${hoursLeft.toFixed(1)} hours!`);
  }
}
```

## API Examples

### Get Recommended Products Only (Frontend Filter)
```
GET /catalog/products?brand_id=lifx&limit=50
```
Response will include `is_recommended: true/false` on each product.

### Filter by Campaign Badge (Frontend Filter)
```javascript
const response = await fetch('https://api.taucho.org/catalog/products?brand_id=lifx');
const { products } = await response.json();
const advancedProducts = products.filter(p => p.campaign_badge === 'Advanced');
```

### Show Only Products with Active Campaigns
```javascript
const response = await fetch('https://api.taucho.org/catalog/products?brand_id=lifx');
const { products } = await response.json();
const campaignProducts = products.filter(p => p.campaign_badge && p.campaign_end_date);
```

## Monetization Benefits

1. **Increase Average Order Value** - Highlight premium/advanced products
2. **Drive Urgency** - Show expiring campaigns/discounts
3. **Encourage Discovery** - Showcase recommended products
4. **A/B Testing** - Test different badges/messages
5. **Affiliate Optimization** - Highlight high-commission products
6. **Flash Sales** - Dynamically update campaigns

## Example Frontend Display

```
┌─────────────────────────────────────────────┐
│ LIFX Original                        ⭐      │
│ ⚡ Popular - Best-selling color bulb        │
│                                             │
│ Capabilities:                               │
│  • Full RGB Color                           │
│  • Adjustable Color Temperature             │
│  • 16M Colors                               │
│                                             │
│ Actions: turn_on, turn_off, set_color      │
│                                             │
│ ⭐ Recommended: Classic LIFX favorite       │
│    - reliable and popular                   │
│                                             │
│ [Buy on LIFX →]                             │
└─────────────────────────────────────────────┘
```

## Database Schema

The enrichment fields are stored in the existing `products` table (future migration will add columns):

```sql
ALTER TABLE products ADD COLUMN campaign_badge VARCHAR(50);
ALTER TABLE products ADD COLUMN campaign_message TEXT;
ALTER TABLE products ADD COLUMN campaign_end_date TIMESTAMP;
ALTER TABLE products ADD COLUMN discount_percent DECIMAL(5,2);
ALTER TABLE products ADD COLUMN estimated_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN is_recommended BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN recommended_reason TEXT;
```

## Future Enhancements

1. **Campaign Management UI** - Admin portal to create/edit campaigns
2. **Time-Based Updates** - Automatically expire campaigns
3. **A/B Testing** - Track which campaigns drive conversions
4. **Analytics** - Measure engagement with campaign badges
5. **Bundle Deals** - Group products with discount codes
6. **Inventory Integration** - Show low-stock warnings
7. **User Preferences** - Recommend based on user interests

## Implementation Status

✅ **LIFX Automatic Enrichment** - Deployed and working  
⏳ **Database Storage** - Schema ready (migration pending)  
⏳ **Admin UI** - Planned for Phase 2  
⏳ **Analytics** - Planned for Phase 2

## Notes

- All enrichment fields are optional (nullable)
- Fields are returned for all brands (database + API)
- LIFX enrichment is automatically generated, no manual intervention needed
- Database products can be manually enriched via admin endpoints
- Frontend should handle null values gracefully
- Campaign messages support plaintext and emoji
- Prices are estimates only (not real-time)
