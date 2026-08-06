# Purchase URL Feature

## Overview

Every product returned by the catalog API now includes a **`purchase_url`** field that the frontend can use directly without implementing redirect logic.

```json
{
  "id": "amazon-smart-plug-1",
  "name": "Amazon Basics Smart Plug",
  "brand_id": "amazon",
  "category": "smart_plug",
  "purchase_url": "/catalog/products/redirect?id=amazon-smart-plug-1",
  "affiliate_url": "https://amazon.com/dp/B09XYZ?tag=taucho-20",
  "supported_actions": ["turn_on", "turn_off"],
  ...
}
```

---

## Architecture

### Why This Approach?

| Aspect | Benefit |
|--------|---------|
| **Backend owns logic** | If business logic changes (affiliate format, tracking params, fallbacks), only backend needs updating |
| **Frontend stays simple** | Just follow `purchase_url` — no redirect logic needed in frontend |
| **Easy to test** | Change redirect logic in one place: the backend handler |
| **Future-proof** | Can add user tracking, affiliate A/B testing, geolocation, etc. without frontend changes |

### How It Works

```
Frontend
  └─ Sees "purchase_url": "/catalog/products/redirect?id=product-1"
       └─ User clicks link
             └─ Redirects to: /catalog/products/redirect?id=product-1
                   └─ Backend fetches product
                       └─ Determines affiliate URL (product → brand → website)
                           └─ HTTP 302 redirect to affiliate URL
                                 └─ User lands on purchase page
```

---

## API Response Examples

### GET /catalog/products?brand_id=amazon

```json
{
  "products": [
    {
      "id": "amazon-smart-plug-1",
      "name": "Amazon Basics Smart Plug",
      "brand_id": "amazon",
      "category": "smart_plug",
      "thumbnail_url": "https://images.unsplash.com/...",
      "purchase_url": "/catalog/products/redirect?id=amazon-smart-plug-1",
      "affiliate_url": null,
      "supported_actions": ["turn_on", "turn_off"],
      "is_active": true,
      "created_at": "2026-08-05T...",
      "updated_at": "2026-08-05T..."
    },
    ...
  ],
  "pagination": { ... }
}
```

### GET /catalog/products/get?id=amazon-smart-plug-1

```json
{
  "id": "amazon-smart-plug-1",
  "name": "Amazon Basics Smart Plug",
  "brand_id": "amazon",
  "category": "smart_plug",
  "thumbnail_url": "https://images.unsplash.com/...",
  "purchase_url": "/catalog/products/redirect?id=amazon-smart-plug-1",
  "affiliate_url": "https://amazon.com/dp/B09XYZ?tag=taucho-20",
  "supported_actions": ["turn_on", "turn_off"],
  "is_active": true,
  "created_at": "2026-08-05T...",
  "updated_at": "2026-08-05T..."
}
```

### GET /catalog/brands/get?id=amazon

```json
{
  "brand": {
    "id": "amazon",
    "name": "Amazon",
    "website": "https://amazon.com",
    "affiliate_url": "https://amazon.com/?tag=taucho-20",
    ...
  },
  "products": [
    {
      "id": "amazon-smart-plug-1",
      "name": "Amazon Basics Smart Plug",
      "purchase_url": "/catalog/products/redirect?id=amazon-smart-plug-1",
      "affiliate_url": "https://amazon.com/dp/B09XYZ?tag=taucho-20",
      ...
    },
    ...
  ]
}
```

---

## Frontend Usage

### Simple Link

```html
<!-- API returns: "purchase_url": "/catalog/products/redirect?id=amazon-smart-plug-1" -->
<a href="${product.purchase_url}">
  Buy Now
</a>
```

### React Component

```javascript
import { useState, useEffect } from 'react';

export function ProductCard({ productId }) {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetch(`/catalog/products/get?id=${productId}`)
      .then(res => res.json())
      .then(data => setProduct(data));
  }, [productId]);

  if (!product) return <div>Loading...</div>;

  return (
    <div className="product-card">
      <h2>{product.name}</h2>
      <img src={product.thumbnail_url} alt={product.name} />
      
      {/* Frontend doesn't care about redirect logic — just use purchase_url */}
      <a href={product.purchase_url} target="_blank" rel="noopener noreferrer">
        Buy on {product.brand_id}
      </a>
    </div>
  );
}
```

### With Tracking

```javascript
const handlePurchaseClick = (productId, purchaseUrl) => {
  // Log analytics
  console.log('User clicked purchase for product:', productId);
  
  // Redirect
  window.location.href = purchaseUrl;
};

<a href="#" onClick={() => handlePurchaseClick(product.id, product.purchase_url)}>
  Buy Now
</a>
```

---

## Backend Implementation

### Product Model

```go
type Product struct {
  // ... existing fields ...
  PurchaseURL  *string   `json:"purchase_url,omitempty"`  // Computed by backend
  AffiliateURL *string   `json:"affiliate_url,omitempty"` // Stored in DB
}
```

### Helper Functions

```go
// setPurchaseURL sets the PurchaseURL field on a product to the redirect endpoint.
func (a *CatalogAPI) setPurchaseURL(product *models.Product) {
  if product != nil {
    url := fmt.Sprintf("/catalog/products/redirect?id=%s", product.ID)
    product.PurchaseURL = &url
  }
}

// setPurchaseURLs sets PurchaseURL on multiple products.
func (a *CatalogAPI) setPurchaseURLs(products []*models.Product) {
  for _, p := range products {
    a.setPurchaseURL(p)
  }
}
```

### Handler Integration

```go
// HandleListProducts
func (a *CatalogAPI) HandleListProducts(w http.ResponseWriter, r *http.Request) {
  // ... fetch and filter products ...
  
  // Set purchase URLs on all products before returning
  a.setPurchaseURLs(result.Products)
  
  w.Header().Set("Content-Type", "application/json")
  json.NewEncoder(w).Encode(result)
}

// HandleGetProduct
func (a *CatalogAPI) HandleGetProduct(w http.ResponseWriter, r *http.Request) {
  // ... fetch product ...
  
  a.setPurchaseURL(product)
  
  w.Header().Set("Content-Type", "application/json")
  json.NewEncoder(w).Encode(product)
}

// HandleGetBrand
func (a *CatalogAPI) HandleGetBrand(w http.ResponseWriter, r *http.Request) {
  // ... fetch brand and products ...
  
  a.setPurchaseURLs(products)
  
  w.Header().Set("Content-Type", "application/json")
  json.NewEncoder(w).Encode(map[string]interface{}{
    "brand":    brand,
    "products": products,
  })
}
```

---

## Key Points

### 1. Purchase URL Format

All products get:
```
/catalog/products/redirect?id={product_id}
```

This is a relative URL that works on any domain:
- Development: `http://localhost:8080/catalog/products/redirect?id=amazon-smart-plug-1`
- Production: `https://api.taucho.org/catalog/products/redirect?id=amazon-smart-plug-1`

### 2. URL Encoding

Product IDs in the database use:
- Hyphens: `amazon-smart-plug-1`
- Lowercase: `govee-h6159`
- No spaces or special characters

The URL is ready to use without additional encoding.

### 3. Always Set

- ✅ When returning single product: `GET /catalog/products/get?id=...`
- ✅ When returning product list: `GET /catalog/products?brand_id=...`
- ✅ When returning brand with products: `GET /catalog/brands/get?id=...`

### 4. Uses HTTP 302

The redirect handler uses `http.Redirect(w, r, url, http.StatusFound)` which is:
- **HTTP 302 Found** (temporary redirect)
- Allows browser to cache, but marked as temporary
- Good for affiliate tracking (allows affiliate to track redirect source)

---

## Future Enhancements

### Add UTM Parameters

Backend can compute purchase_url with UTM params:
```go
url := fmt.Sprintf("/catalog/products/redirect?id=%s&utm_source=catalog&utm_medium=api&utm_campaign=%s",
  product.ID, product.BrandID)
```

Frontend still just follows the URL — no changes needed!

### Add User Tracking

Backend can log which user clicked which product:
```go
func (a *CatalogAPI) HandleProductRedirect(w http.ResponseWriter, r *http.Request) {
  userID := r.Context().Value("user_id")
  productID := r.URL.Query().Get("id")
  
  // Log: userID clicked productID
  a.analyticsStore.LogProductClick(userID, productID)
  
  // Redirect as normal
  ...
}
```

### Geolocation-Based Fallback

Backend can choose affiliate URL based on user's country:
```go
country := getCountryFromIP(r.RemoteAddr)
affiliateURL := selectAffiliateByCountry(product, country)
```

---

## Testing

### Check Purchase URL in Response

```bash
curl "https://api.taucho.org/catalog/products/get?id=amazon-smart-plug-1" | jq .purchase_url

# Output:
# "/catalog/products/redirect?id=amazon-smart-plug-1"
```

### Follow the Redirect

```bash
curl -L "https://api.taucho.org/catalog/products/redirect?id=amazon-smart-plug-1"

# Will follow:
# 1. GET /catalog/products/redirect?id=amazon-smart-plug-1
# 2. 302 redirect to affiliate URL (e.g., Amazon)
# 3. Returns Amazon product page
```

---

## Summary

| What | Where | How |
|------|-------|-----|
| **Purchase URL field** | All product responses | Computed by backend as `/catalog/products/redirect?id={id}` |
| **Frontend usage** | HTML links, React, etc. | Just use `product.purchase_url` directly |
| **Backend logic** | Redirect handler | Determines final affiliate URL (product → brand → website) |
| **Future changes** | Backend only | No frontend code changes needed for logic updates |

✅ **Status: Implemented and compiled successfully**

Next: Frontend can start using `product.purchase_url` in product cards and listings.
