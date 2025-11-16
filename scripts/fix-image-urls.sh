#!/bin/bash

# Fix image URLs on production - replace localhost URLs with production URLs
# Usage: ./fix-image-urls.sh

echo "Fixing image URLs on production..."

ssh Pi4-2 "docker exec smarket-postgres-prod psql -U snailmarket -d snailmarket -c \"
UPDATE products
SET
  image_url = REPLACE(image_url, 'http://localhost:3000', 'https://smarket.sh3.su'),
  images = (
    SELECT jsonb_agg(REPLACE(value::text, 'http://localhost:3000', 'https://smarket.sh3.su')::jsonb)
    FROM jsonb_array_elements(images)
  )
WHERE image_url LIKE 'http://localhost:3000%' OR images::text LIKE '%localhost:3000%';

SELECT COUNT(*) as updated_products FROM products WHERE image_url LIKE 'https://smarket.sh3.su%';
\""

echo "✓ Image URLs fixed!"
