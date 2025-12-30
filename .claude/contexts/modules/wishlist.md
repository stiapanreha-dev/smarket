# Wishlist Module

User wishlist management for saving favorite products.

## Purpose

Allows users to save products for later purchase.

## Key Features

- Add/remove products from wishlist
- Multiple wishlists (future: "Favorites", "Gift Ideas", etc.)
- Share wishlist with others
- Price drop notifications (future)
- Move items to cart

## Wishlist Entities

```typescript
Wishlist {
  id: UUID
  user_id: UUID
  name: string
  is_public: boolean
  share_token: string | null
}

WishlistItem {
  id: UUID
  wishlist_id: UUID
  product_id: UUID
  added_at: Date
}
```

## Sharing Wishlists

Users can share wishlists publicly:
```
https://market.devloc.su/wishlist/share/{share_token}
```

Public wishlists viewable without login.

## Key Endpoints

```typescript
// Get user wishlists
GET /wishlists

// Create wishlist
POST /wishlists
Body: { name: 'My Favorites', is_public: false }

// Add item to wishlist
POST /wishlists/:id/items
Body: { product_id: 'uuid' }

// Remove item
DELETE /wishlists/:id/items/:item_id

// Share wishlist
POST /wishlists/:id/share
Response: { share_token: 'abc123' }

// Get shared wishlist (public)
GET /wishlists/shared/:token
```

## Integration Points

- **User Module**: User wishlists
- **Catalog Module**: Product references
- **Cart Module**: Move wishlist items to cart

## Common Issues

**Missing wishlist tables in production:**
- Symptom: `relation "wishlists" does not exist`
- Solution: Run migration SQL manually on production
- See `production/migrations.md` for process

## Related

- See `modules/catalog.md` for products
- See `modules/cart.md` for cart integration
- See `production/troubleshooting.md` for common issues
