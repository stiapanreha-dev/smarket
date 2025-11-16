#!/bin/bash

# Import product from American Creator website
# Usage: ./import-product.sh <product_url> <email> <password>

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ "$#" -ne 3 ]; then
    echo -e "${RED}Usage: $0 <product_url> <email> <password>${NC}"
    echo "Example: $0 https://american-creator.ru/catalog/must_have/199/ stepun+2@gmail.com password123"
    exit 1
fi

PRODUCT_URL="$1"
EMAIL="$2"
PASSWORD="$3"
API_BASE="http://localhost:3000/api/v1"
TMP_DIR="/tmp/product-import-$$"

# Create temp directory
mkdir -p "$TMP_DIR"
cd "$TMP_DIR"

echo -e "${GREEN}=== Starting product import ===${NC}"
echo "Product URL: $PRODUCT_URL"
echo "Email: $EMAIL"
echo ""

# Step 1: Login to get access token
echo -e "${YELLOW}[1/6] Logging in...${NC}"

# Escape password for JSON (handle special characters)
# Create a JSON file to avoid shell escaping issues
# Using 'EOF' (quoted) to prevent variable expansion issues
cat > "$TMP_DIR/login.json" <<'EOF_JSON'
{
  "email": "EMAIL_PLACEHOLDER",
  "password": "PASSWORD_PLACEHOLDER"
}
EOF_JSON

# Replace placeholders with actual values
sed -i "s|EMAIL_PLACEHOLDER|$EMAIL|g" "$TMP_DIR/login.json"
sed -i "s|PASSWORD_PLACEHOLDER|$PASSWORD|g" "$TMP_DIR/login.json"

LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d @"$TMP_DIR/login.json")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}Failed to login. Response:${NC}"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Logged in successfully${NC}"

# Step 2: Fetch product information using Puppeteer
echo -e "${YELLOW}[2/6] Fetching product information (using headless browser)...${NC}"

# Use the Puppeteer-based parser (run from project root to have access to node_modules)
cd /home/lexun/work/smarket
PRODUCT_INFO=$(node "$SCRIPT_DIR/parse-product-puppeteer.js" "$PRODUCT_URL" 2>&1)
PARSE_EXIT_CODE=$?
cd "$TMP_DIR"

# If puppeteer fails, fallback to simple HTTP parser
if [ $PARSE_EXIT_CODE -ne 0 ]; then
    echo -e "${YELLOW}⚠ Puppeteer failed, using fallback parser${NC}"
    echo -e "${YELLOW}Error: $PRODUCT_INFO${NC}"
    cat > parse-product.js << 'EOF'
const https = require('https');

const url = process.argv[2];
const hostname = new URL(url).hostname;
const path = new URL(url).pathname;

const options = {
  hostname: hostname,
  port: 443,
  path: path,
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    // Extract title
    const titleMatch = data.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Unknown Product';

    // Extract price - look for price in meta itemprop or JSON data
    let price = 0;
    const priceMetaMatch = data.match(/<meta\s+itemprop="price"\s+content="(\d+)"/i);
    if (priceMetaMatch) {
      price = parseInt(priceMetaMatch[1]);
    } else {
      // Fallback: look for price in div with class="price"
      const priceDivMatch = data.match(/<div[^>]*class="[^"]*price[^"]*"[^>]*data-value="(\d+)"/i);
      if (priceDivMatch) {
        price = parseInt(priceDivMatch[1]);
      } else {
        // Last resort: look for price in JSON
        const priceJsonMatch = data.match(/'VALUE':'(\d+)'/);
        if (priceJsonMatch) {
          price = parseInt(priceJsonMatch[1]);
        }
      }
    }

    // Extract all product images (not resize cache, not logos)
    const imgRegex = /\/upload\/iblock\/[a-z0-9]{3}\/[a-z0-9]+\.(?:jpg|jpeg|png|webp)/gi;
    const allMatches = data.match(imgRegex) || [];
    const uniqueImages = [...new Set(allMatches)].filter(img => !img.includes('resize_cache'));
    const images = uniqueImages.map(img => 'https://american-creator.ru' + img);

    // Extract short description from preview_text div
    let shortDescription = '';
    const previewMatch = data.match(/<div[^>]*class="preview_text"[^>]*>([\s\S]*?)<\/div>/i);
    if (previewMatch) {
      shortDescription = previewMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 500);
    }

    // Extract detailed description - simple broad approach
    let descriptionParts = [];

    // Extract ALL paragraphs from the page (after h1 title)
    const h1Match = data.match(/<h1[^>]*>[\s\S]*?<\/h1>/i);
    if (h1Match) {
      // Get everything after the title
      const afterTitle = data.substring(data.indexOf(h1Match[0]) + h1Match[0].length);

      // Extract all <p> tags
      const allParagraphs = afterTitle.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
      if (allParagraphs) {
        // Take first 10 meaningful paragraphs
        let count = 0;
        for (const p of allParagraphs) {
          const cleaned = p.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
          // Skip very short paragraphs, but keep medium ones
          if (cleaned.length >= 30 && cleaned.length <= 800 && count < 10) {
            descriptionParts.push(cleaned);
            count++;
          }
          if (count >= 10) break;
        }
      }

      // Also try to get list items if we have few paragraphs
      if (descriptionParts.length < 3) {
        const listItems = afterTitle.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
        if (listItems) {
          listItems.slice(0, 10).forEach(li => {
            const cleaned = li.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
            if (cleaned.length >= 20 && cleaned.length <= 500) {
              descriptionParts.push(cleaned);
            }
          });
        }
      }
    }

    const description = descriptionParts.length > 0 ? descriptionParts.slice(0, 10).join('\n\n') : '';

    // Extract characteristics from table with itemprop
    const specifications = {};

    // Extract volume from table
    const volumeTableMatch = data.match(/<span[^>]*itemprop="name"[^>]*>Объем[^<]*<\/span>[\s\S]{0,200}<span[^>]*itemprop="value"[^>]*>[\s\S]*?(\d+)/i);
    if (volumeTableMatch) {
      specifications.volume_ml = parseInt(volumeTableMatch[1]);
    }

    // Extract color from table
    const colorTableMatch = data.match(/<span[^>]*itemprop="name"[^>]*>Цвет<\/span>[\s\S]{0,200}<span[^>]*itemprop="value"[^>]*>([\s\S]*?)<\/span>/i);
    if (colorTableMatch) {
      specifications.color = colorTableMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    // Extract box included from table
    const boxTableMatch = data.match(/<span[^>]*itemprop="name"[^>]*>Это коробка<\/span>[\s\S]{0,200}<span[^>]*itemprop="value"[^>]*>([\s\S]*?)<\/span>/i);
    if (boxTableMatch) {
      const boxValue = boxTableMatch[1].replace(/<[^>]+>/g, '').trim().toLowerCase();
      specifications.box_included = boxValue === 'да' || boxValue === 'yes';
    }

    const product = {
      title: title,
      price: price,
      images: images,
      short_description: shortDescription,
      description: description,
      specifications: specifications
    };

    console.log(JSON.stringify(product));
  });
});

req.on('error', (error) => {
  console.error(JSON.stringify({error: error.message}));
  process.exit(1);
});

req.end();
EOF
    PRODUCT_INFO=$(node parse-product.js "$PRODUCT_URL")
fi

# Use Node.js to parse JSON reliably (handles UTF-8) and write to temp files
cat > extract-fields.js << 'EXTRACT_EOF'
const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
const fs = require('fs');

// Write each field to a separate temp file to preserve newlines
fs.writeFileSync('_title.txt', data.title || '');
fs.writeFileSync('_price.txt', String(data.price || 0));
fs.writeFileSync('_images.json', JSON.stringify(data.images || []));
fs.writeFileSync('_short_desc.txt', data.short_description || '');
fs.writeFileSync('_desc.txt', data.description || '');
fs.writeFileSync('_specs.json', JSON.stringify(data.specifications || {}));
EXTRACT_EOF

echo "$PRODUCT_INFO" | node extract-fields.js
PRODUCT_TITLE=$(cat _title.txt)
PRODUCT_PRICE=$(cat _price.txt)
PRODUCT_IMAGES=$(cat _images.json)
PRODUCT_SHORT_DESC=$(cat _short_desc.txt)
PRODUCT_DESC=$(cat _desc.txt)
PRODUCT_SPECS=$(cat _specs.json)

if [ -z "$PRODUCT_TITLE" ]; then
    echo -e "${RED}Failed to extract product information${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Product info extracted:${NC}"
echo "  Title: $PRODUCT_TITLE"
echo "  Price: $PRODUCT_PRICE ₽"
echo "  Short Description: $PRODUCT_SHORT_DESC"
IMAGE_COUNT=$(echo "$PRODUCT_IMAGES" | grep -o 'https://' | wc -l)
echo "  Images: $IMAGE_COUNT found"

# Step 3: Download product images
echo -e "${YELLOW}[3/6] Downloading product images...${NC}"
DOWNLOADED_IMAGES=()
if [ -n "$PRODUCT_IMAGES" ] && [ "$PRODUCT_IMAGES" != "[]" ]; then
    # Extract image URLs from JSON array
    IMAGE_URLS=$(echo "$PRODUCT_IMAGES" | grep -o 'https://[^"]*' || echo "")

    INDEX=0
    for IMG_URL in $IMAGE_URLS; do
        INDEX=$((INDEX + 1))
        curl -s -o "product-image-$INDEX.jpg" "$IMG_URL"
        if [ -f "product-image-$INDEX.jpg" ]; then
            DOWNLOADED_IMAGES+=("product-image-$INDEX.jpg")
        fi
    done

    if [ ${#DOWNLOADED_IMAGES[@]} -gt 0 ]; then
        echo -e "${GREEN}✓ Downloaded ${#DOWNLOADED_IMAGES[@]} image(s)${NC}"
    else
        echo -e "${RED}Failed to download images${NC}"
    fi
else
    echo -e "${YELLOW}⚠ No images found${NC}"
fi

# Step 4: Create product
echo -e "${YELLOW}[4/6] Creating product...${NC}"

# Calculate price in minor units (kopecks)
PRICE_MINOR=$((PRODUCT_PRICE * 100))

# Generate slug from title
SLUG=$(echo "$PRODUCT_TITLE" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')

# Create EditorJS description - use node to properly escape JSON
cat > create-product.js << 'JSEOF'
const fs = require('fs');
const title = process.argv[2];
const shortDesc = process.argv[3];
const priceMinor = process.argv[4];
const slug = process.argv[5];
const specsJson = process.argv[6];

// Read description from file to preserve newlines
const desc = fs.existsSync('_desc.txt') ? fs.readFileSync('_desc.txt', 'utf8') : '';

// Create EditorJS blocks from description
const blocks = [
  {
    id: "block1",
    type: "header",
    data: { text: title, level: 2 }
  }
];

// Split description by sections and create structured blocks
if (desc && desc.trim().length > 0) {
  // Split by section headers (Описание, Применение, Нанесение)
  const sections = desc.split(/\n\n(?=Описание|Применение|Нанесение)/);
  let blockId = 2;

  sections.forEach(section => {
    const lines = section.trim().split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return;

    // Check if first line is a section header
    const firstLine = lines[0].trim();
    if (firstLine === 'Описание' || firstLine === 'Применение' || firstLine === 'Нанесение') {
      // Add header
      blocks.push({
        id: "block" + blockId++,
        type: "header",
        data: { text: firstLine, level: 3 }
      });

      // Add remaining lines as paragraphs
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length > 0) {
          blocks.push({
            id: "block" + blockId++,
            type: "paragraph",
            data: { text: line }
          });
        }
      }
    } else {
      // No header, just add as paragraphs
      lines.forEach(line => {
        if (line.trim().length > 0) {
          blocks.push({
            id: "block" + blockId++,
            type: "paragraph",
            data: { text: line.trim() }
          });
        }
      });
    }
  });
} else if (shortDesc && shortDesc.trim().length > 0) {
  // Fallback to short description if no full description
  blocks.push({
    id: "block2",
    type: "paragraph",
    data: { text: shortDesc.trim() }
  });
}

const editorDesc = JSON.stringify({
  time: Date.now(),
  blocks: blocks,
  version: "2.31.0"
});

// Parse specifications from JSON
let specifications = {};
try {
  if (specsJson && specsJson !== '{}') {
    specifications = JSON.parse(specsJson);
  }
} catch (e) {
  console.error('Failed to parse specifications:', e);
}

const payload = {
  type: "PHYSICAL",
  title: title,
  short_description: shortDesc || "",
  description: editorDesc,
  base_price_minor: parseInt(priceMinor),
  currency: "RUB",
  status: "active",
  slug: slug,
  attrs: {
    specifications: specifications,
    tags: [],
    category: []
  },
  variants: [
    {
      sku: "SKU-" + Date.now(),
      title: title,
      price_minor: parseInt(priceMinor),
      currency: "RUB",
      inventory_quantity: 50,
      attrs: {
        weight: 0,
        capacity: 0,
        cost_per_item: 0
      }
    }
  ],
  seo: {
    meta_title: title,
    meta_description: shortDesc || desc
  }
};

console.log(JSON.stringify(payload));
JSEOF

CREATE_PAYLOAD=$(node create-product.js "$PRODUCT_TITLE" "$PRODUCT_SHORT_DESC" "$PRICE_MINOR" "$SLUG" "$PRODUCT_SPECS")

CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/merchant/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "$CREATE_PAYLOAD")

PRODUCT_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PRODUCT_ID" ]; then
    echo -e "${RED}Failed to create product. Response:${NC}"
    echo "$CREATE_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Product created with ID: $PRODUCT_ID${NC}"

# Step 5: Upload images if available
if [ ${#DOWNLOADED_IMAGES[@]} -gt 0 ]; then
    echo -e "${YELLOW}[5/6] Uploading product images (${#DOWNLOADED_IMAGES[@]} total)...${NC}"

    UPLOADED_IMAGE_URLS=()
    for IMG_FILE in "${DOWNLOADED_IMAGES[@]}"; do
        UPLOAD_RESPONSE=$(curl -s -X POST "$API_BASE/merchant/products/upload-image" \
          -H "Authorization: Bearer $ACCESS_TOKEN" \
          -F "file=@$IMG_FILE")

        IMG_URL=$(echo "$UPLOAD_RESPONSE" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)

        if [ -n "$IMG_URL" ]; then
            UPLOADED_IMAGE_URLS+=("$IMG_URL")
        fi
    done

    if [ ${#UPLOADED_IMAGE_URLS[@]} -gt 0 ]; then
        echo -e "${GREEN}✓ Uploaded ${#UPLOADED_IMAGE_URLS[@]} image(s)${NC}"

        # Build JSON array of image URLs
        IMAGES_JSON="["
        for i in "${!UPLOADED_IMAGE_URLS[@]}"; do
            if [ $i -gt 0 ]; then
                IMAGES_JSON+=","
            fi
            IMAGES_JSON+="\"${UPLOADED_IMAGE_URLS[$i]}\""
        done
        IMAGES_JSON+="]"

        # Update product with all images (first one as main)
        curl -s -X PATCH "$API_BASE/merchant/products/$PRODUCT_ID" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $ACCESS_TOKEN" \
          -d "{
            \"image_url\": \"${UPLOADED_IMAGE_URLS[0]}\",
            \"images\": $IMAGES_JSON
          }" > /dev/null

        echo -e "${GREEN}✓ Product updated with ${#UPLOADED_IMAGE_URLS[@]} image(s)${NC}"
    else
        echo -e "${YELLOW}⚠ Failed to upload images${NC}"
    fi
else
    echo -e "${YELLOW}[5/6] Skipping image upload (no images downloaded)${NC}"
fi

# Step 6: Get final product details
echo -e "${YELLOW}[6/6] Fetching final product details...${NC}"
FINAL_PRODUCT=$(curl -s "$API_BASE/products/$PRODUCT_ID")

echo ""
echo -e "${GREEN}=== Import completed successfully! ===${NC}"
echo ""
echo "Product ID: $PRODUCT_ID"
echo "Product URL: http://localhost:5173/catalog/$PRODUCT_ID"
echo ""
echo "Product details:"
echo "$FINAL_PRODUCT" | grep -o '"title":"[^"]*"' | head -1
echo "$FINAL_PRODUCT" | grep -o '"base_price_minor":"[^"]*"' | head -1
echo "$FINAL_PRODUCT" | grep -o '"image_url":"[^"]*"' | head -1
FINAL_IMAGE_COUNT=$(echo "$FINAL_PRODUCT" | grep -o '"images":\[[^]]*\]' | grep -o 'http' | wc -l)
echo "Images uploaded: $FINAL_IMAGE_COUNT"
echo ""

# Cleanup
cd /
rm -rf "$TMP_DIR"

echo -e "${GREEN}✓ Cleanup completed${NC}"
