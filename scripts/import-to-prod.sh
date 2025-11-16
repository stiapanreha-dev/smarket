#!/bin/bash

# Wrapper script to import products to production
# Usage: ./import-to-prod.sh <product_url>

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check arguments
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <product_url>"
    echo "Example: $0 https://american-creator.ru/catalog/must_have/199/"
    exit 1
fi

PRODUCT_URL="$1"
EMAIL="stepun+2@gmail.com"
PASSWORD="270176As!"

# Run import with production API
API_BASE="https://smarket.sh3.su/api/v1" "$SCRIPT_DIR/import-product.sh" "$PRODUCT_URL" "$EMAIL" "$PASSWORD"
