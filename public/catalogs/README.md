# Device Catalog System

This directory contains product catalogs for smart devices that users can browse and add to their device list.

## Structure

Each catalog is a JSON file with the following structure:

```json
{
  "id": "brand-id",
  "name": "Brand Name",
  "description": "Description of the brand",
  "logo": "emoji or icon",
  "products": [
    {
      "id": "product-id",
      "name": "Product Name",
      "description": "Product description",
      "category": "Product Category",
      "icon": "emoji",
      "price": "$29.99",
      "priceRange": "$19.99 - $49.99",
      "features": ["feature1", "feature2"],
      "supported_actions": ["on", "off", "color", "brightness"],
      "buyUrl": "https://amazon.com/...",
      "imageUrl": "/image/catalog/product.jpg"
    }
  ]
}
```

## Adding a New Catalog

1. Create a new JSON file in this directory (e.g., `philips-hue.json`)
2. Add the catalog data following the structure above
3. Add the new brand to the `BRANDS` array in your backend (if using database) or ensure it's in the sorted brands list
4. The catalog will automatically appear in the device selection modal

## Field Descriptions

- `id`: Unique identifier for the brand (used in URLs and data)
- `name`: Display name for the brand
- `description`: Brief description shown in the modal
- `logo`: Emoji or character to represent the brand
- `products`: Array of product objects
  - `id`: Unique product identifier
  - `name`: Display name
  - `description`: Product description
  - `category`: **[NEW]** Category for filtering (e.g., "Lights", "Sensors", "Climate Control", "Power")
  - `icon`: Emoji representing the product type
  - `price`: Single price (e.g., "$29.99")
  - `priceRange`: Price range (e.g., "$19.99 - $49.99") - use instead of `price` if prices vary
  - `features`: List of key features
  - `supported_actions`: Smart home actions the device supports (on, off, color, brightness, scene, etc.)
  - `buyUrl`: Link to purchase the product
  - `imageUrl`: URL to product image, can be null

## Supported Actions

Common actions include:
- `on` - Turn on
- `off` - Turn off
- `toggle` - Toggle on/off
- `color` - Set color
- `brightness` - Adjust brightness
- `color_temp` - Color temperature control
- `scene` - Play scene/preset
- `flash` - Flash/alert mode

## Categories

Use category field to organize products for filtering in the modal. Common categories:
- **Lights**: LED strips, smart bulbs, light switches
- **Power**: Smart plugs, outlets, power controllers
- **Sensors**: Motion, temperature, humidity, occupancy sensors
- **Climate Control**: Heaters, thermostats, fans, air quality
- **Hubs & Speakers**: Smart speakers, hubs, controllers
- **Accessories**: Diffusers, controllers, add-ons

## API Integration

Currently, catalogs are loaded from static JSON files. For real-time product data (e.g., from Govee API):

1. Create a backend endpoint that fetches from the brand's API
2. Update the `selectCatalogBrand()` function in `/templates/pages/devices.html` to call your endpoint instead of loading the JSON file
3. Ensure the response follows the same JSON structure

Example endpoint location: `/api/catalogs/{brandId}`

## Integrated Modal Design

Products are now displayed in the device selection modal with an integrated experience:
- **Owned Devices**: Listed first with "✓ Owned" badge
- **Separator**: Clear visual divider between owned and available products
- **Available Catalog**: Catalog products grouped by category with filter buttons
- **Green Accent**: Catalog items have a green left border to distinguish from owned devices

See `/docs/CATALOG_INTEGRATED_MODAL.md` for more details on the modal design.

## Future Enhancements

- Sync with Govee API for real-time product listings
- Add search capabilities to the modal
- Show real-time pricing and availability
- User reviews and ratings
- Product specifications and compatibility matrix
