# Nginx Configuration

Production nginx configuration for market.devloc.su.

## Config Location

`/etc/nginx/sites-available/market.devloc.su`

## Configuration Structure

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name market.devloc.su;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name market.devloc.su;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/market.devloc.su/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/market.devloc.su/privkey.pem;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3003/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploaded files (product images, etc.)
    location /uploads/ {
        proxy_pass http://localhost:3003/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_set_header Host $host;
    }

    # Frontend static files
    location / {
        root /home/lexun/apps/smarket.backup/frontend;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

## Key Locations

### `/api/` - Backend API
- Proxies to `http://localhost:3003/api/`
- WebSocket support (Upgrade header)
- Real IP forwarding

### `/uploads/` - Static File Uploads
- Product images, documents
- Long cache (1 year)
- Immutable cache control

### `/` - Frontend SPA
- React app static files
- Fallback to `index.html` for client-side routing
- Shorter cache (1 hour)

## Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload configuration (no downtime)
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

## SSL Certificates

Certificates managed by Let's Encrypt (certbot):

```bash
# Renew certificates
sudo certbot renew

# Check certificate expiry
sudo certbot certificates
```

Auto-renewal configured via cron.

## Common Nginx Issues

**502 Bad Gateway:**
- Backend container not running
- Check: `docker ps | grep smarket-backend-prod`
- Fix: Restart backend container

**404 on API routes:**
- Proxy configuration incorrect
- Check backend is listening on port 3003

**Frontend routes return 404:**
- Missing `try_files $uri $uri/ /index.html;`
- SPA routing requires fallback to index.html

**Uploads not loading:**
- Check `/uploads/` proxy pass configuration
- Verify backend serves files at `/uploads/`

## Image URL Fixes

After product import, image URLs may need fixing:

```bash
# Fix localhost URLs to production
./scripts/fix-image-urls.sh
```

This updates database URLs from `http://localhost:3000` to `https://market.devloc.su`.

## Performance Optimization

Current config includes:
- Gzip compression for text/JSON
- Cache headers for static assets
- HTTP/2 support
- Keep-alive connections

## Related

- See `production/deployment.md` for deployment process
- See `production/troubleshooting.md` for common issues
- See `production/product-import.md` for image URL handling
