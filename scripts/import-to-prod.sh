#!/bin/bash

# Wrapper script to import products to production
# Usage: ./import-to-prod.sh <product_url>

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create $SCRIPT_DIR/.env file with your credentials:"
    echo ""
    echo "MERCHANT_EMAIL=your-email@example.com"
    echo "MERCHANT_PASSWORD=your-password"
    echo ""
    echo "You can copy .env.example as a template:"
    echo "  cp $SCRIPT_DIR/.env.example $SCRIPT_DIR/.env"
    exit 1
fi

# Load credentials from .env file
source "$SCRIPT_DIR/.env"

# Check arguments
if [ "$#" -ne 1 ]; then
    echo -e "${RED}Usage: $0 <product_url>${NC}"
    echo "Example: $0 https://american-creator.ru/catalog/must_have/199/"
    exit 1
fi

PRODUCT_URL="$1"

# Validate credentials
if [ -z "$MERCHANT_EMAIL" ] || [ -z "$MERCHANT_PASSWORD" ]; then
    echo -e "${RED}Error: MERCHANT_EMAIL or MERCHANT_PASSWORD not set in .env file${NC}"
    exit 1
fi

echo -e "${GREEN}=== Importing to Production ===${NC}"
echo "Product URL: $PRODUCT_URL"
echo "Merchant: $MERCHANT_EMAIL"
echo ""

# Run import with production API
API_BASE="https://smarket.sh3.su/api/v1" "$SCRIPT_DIR/import-product.sh" "$PRODUCT_URL" "$MERCHANT_EMAIL" "$MERCHANT_PASSWORD"

# Check if import was successful
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${YELLOW}Fixing image URLs...${NC}"
    "$SCRIPT_DIR/fix-image-urls.sh"
    echo ""
    echo -e "${GREEN}✓ Import completed and image URLs fixed!${NC}"
else
    echo -e "${RED}✗ Import failed${NC}"
    exit 1
fi
