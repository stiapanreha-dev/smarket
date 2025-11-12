#!/bin/bash

set -e

echo "🚀 Starting deployment to production..."

# Configuration
APP_DIR="$HOME/apps/smarket/backend"
CLIENT_SOURCE_DIR="$APP_DIR/client"
CLIENT_DEPLOY_DIR="$HOME/apps/smarket/frontend"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1/7: Updating backend repository...${NC}"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin
  git reset --hard origin/master
  echo -e "${GREEN}✓ Backend updated to latest commit: $(git rev-parse --short HEAD)${NC}"
else
  echo -e "${YELLOW}Backend directory not found at $APP_DIR${NC}"
  exit 1
fi

echo -e "${BLUE}Step 2/7: Installing backend dependencies...${NC}"
cd "$APP_DIR"
npm install --production=false
echo -e "${GREEN}✓ Dependencies installed${NC}"

echo -e "${BLUE}Step 3/7: Running database migrations...${NC}"
npm run migration:run
echo -e "${GREEN}✓ Migrations completed${NC}"

echo -e "${BLUE}Step 4/7: Building backend application...${NC}"
npm run build
echo -e "${GREEN}✓ Backend built successfully${NC}"

echo -e "${BLUE}Step 5/7: Restarting backend service...${NC}"
if command -v pm2 &> /dev/null; then
  pm2 restart smarket-backend || pm2 start dist/main.js --name smarket-backend
  echo -e "${GREEN}✓ Backend service restarted via PM2${NC}"
elif command -v systemctl &> /dev/null; then
  sudo systemctl restart smarket-backend
  echo -e "${GREEN}✓ Backend service restarted via systemd${NC}"
else
  echo -e "${YELLOW}⚠ No process manager found. Please restart manually.${NC}"
fi

echo -e "${BLUE}Step 6/7: Building and deploying frontend...${NC}"
if [ -d "$CLIENT_SOURCE_DIR" ]; then
  cd "$CLIENT_SOURCE_DIR"
  echo "Installing client dependencies..."
  npm install --production=false
  echo "Building client..."
  npm run build

  # Copy built files to deployment directory
  echo "Deploying built files..."
  mkdir -p "$CLIENT_DEPLOY_DIR"
  rsync -av --delete dist/ "$CLIENT_DEPLOY_DIR/"

  echo -e "${GREEN}✓ Frontend built and deployed${NC}"
else
  echo -e "${YELLOW}⚠ Client source directory not found at $CLIENT_SOURCE_DIR (skipping)${NC}"
fi

echo -e "${BLUE}Step 7/7: Verifying deployment...${NC}"
sleep 3
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
  echo -e "${GREEN}✅ Deployment successful! Backend is healthy.${NC}"
  echo -e "${GREEN}✅ Production URL: https://smarket.sh3.su${NC}"
else
  echo -e "${YELLOW}⚠ Backend may not be fully ready yet (HTTP $HEALTH_CHECK)${NC}"
  echo -e "${YELLOW}   Check logs with: pm2 logs smarket-backend${NC}"
fi

echo -e "${GREEN}🎉 Deployment completed!${NC}"
