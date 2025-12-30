# Product Import Scripts

Import products from external sources (e.g., american-creator.ru).

## One-Time Setup

```bash
# Create credentials file
cp scripts/.env.example scripts/.env

# Edit with merchant credentials
nano scripts/.env
```

**scripts/.env:**
```bash
MERCHANT_EMAIL=merchant@example.com
MERCHANT_PASSWORD=secure_password
API_BASE=https://market.devloc.su/api/v1
```

## Import to Production

```bash
./scripts/import-to-prod.sh "https://american-creator.ru/catalog/must_have/199/"
```

## What the Script Does

1. **Reads credentials** from `scripts/.env`
2. **Parses product info** using Puppeteer (headless browser)
3. **Creates product** via API
4. **Uploads images** to server
5. **Fixes image URLs** (localhost → production)

## Script Workflow

```bash
# 1. Parse product from URL
node scripts/parse-product-puppeteer.js <URL>

# 2. Authenticate merchant
POST /api/v1/auth/login
Body: { email, password }

# 3. Create product
POST /api/v1/catalog/products
Headers: Authorization: Bearer <token>
Body: { name, description, price, images: [...] }

# 4. Upload images
For each image:
  - Download from source
  - Upload to /api/v1/uploads
  - Update product with new image URL

# 5. Fix image URLs
UPDATE products SET images = REPLACE(images, 'localhost', 'production')
```

## Running Locally with Production API

If Node.js not available on server:

```bash
API_BASE="https://market.devloc.su/api/v1" ./scripts/import-to-prod.sh "https://american-creator.ru/catalog/must_have/199/"
```

This runs the script **locally** but creates products on **production**.

## Manual Import Steps

### 1. Parse Product

```bash
node scripts/parse-product-puppeteer.js "https://american-creator.ru/catalog/must_have/199/"
```

Outputs JSON with product data.

### 2. Create Product via API

```bash
curl -X POST https://market.devloc.su/api/v1/catalog/products \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": {
      "en": "Product Name",
      "ru": "Название продукта"
    },
    "description": {...},
    "price": 99.99,
    "images": [...]
  }'
```

### 3. Fix Image URLs

```bash
./scripts/fix-image-urls.sh
```

## Troubleshooting

**"node: command not found":**
- Run script locally with `API_BASE` environment variable

**Images not loading:**
- Check image URLs in database
- Run `fix-image-urls.sh` script
- Verify nginx serves `/uploads/` correctly

**Authentication fails:**
- Check credentials in `scripts/.env`
- Verify merchant account exists
- Test login manually: `POST /api/v1/auth/login`

**Parsing fails:**
- Check source website structure changed
- Update selectors in `parse-product-puppeteer.js`
- Verify Puppeteer dependencies installed

## Image URL Fix Script

```bash
#!/bin/bash
# scripts/fix-image-urls.sh

ssh SRV199 "docker exec smarket-postgres-prod psql -U snailmarket -d snailmarket -c \"
UPDATE products
SET images = REPLACE(images::text, 'http://localhost:3000', 'https://market.devloc.su')::jsonb
WHERE images::text LIKE '%localhost%';
\""
```

## Detailed Documentation

See `scripts/README.md` for comprehensive import script documentation.

## Related

- See `production/nginx-config.md` for `/uploads/` configuration
- See `modules/catalog.md` for product structure
- See `production/troubleshooting.md` for common issues
