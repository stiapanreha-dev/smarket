# Production Troubleshooting

Common production issues and solutions.

## 1. Missing Database Tables (500 Errors)

**Symptom:**
```
Error: relation "table_name" does not exist
```

**Common Missing Tables:**
- `notifications`
- `wishlists`
- `wishlist_items`

**Solution:**
Run migration SQL manually on production database.

```bash
# Example: Create notifications table
ssh SRV199 "docker exec smarket-postgres-prod psql -U snailmarket -d snailmarket -c \"
CREATE TYPE notification_type_enum AS ENUM ('ORDER_UPDATE', 'PAYMENT_SUCCESS', 'SHIPPING_UPDATE', 'BOOKING_REMINDER', 'PROMO');
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  type notification_type_enum NOT NULL,
  title varchar NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
\""
```

**See:** `production/migrations.md` for detailed migration process.

## 2. Wrong Image URLs (Images Not Loading)

**Symptom:**
- Product images show broken
- Image URLs point to `http://localhost:3000`

**Solution:**
Run image URL fix script:

```bash
./scripts/fix-image-urls.sh
```

This updates database URLs from localhost to production domain.

**Manual fix:**
```bash
ssh SRV199 "docker exec smarket-postgres-prod psql -U snailmarket -d snailmarket -c \"
UPDATE products
SET images = REPLACE(images::text, 'http://localhost:3000', 'https://market.devloc.su')::jsonb
WHERE images::text LIKE '%localhost%';
\""
```

## 3. Backend Container Not Running

**Symptom:**
- 502 Bad Gateway errors
- API endpoints not responding

**Check:**
```bash
ssh SRV199 "docker ps | grep smarket"
```

**Solution:**
```bash
# Check logs for errors
ssh SRV199 "docker logs smarket-backend-prod --tail 50"

# Restart container
ssh SRV199 "cd /home/lexun/apps/smarket.backup/backend && docker compose -f docker-compose.prod.yml restart smarket-backend-prod"

# If still failing, rebuild
ssh SRV199 "cd /home/lexun/apps/smarket.backup/backend && docker compose -f docker-compose.prod.yml up -d --build"
```

## 4. Node Not Available on Server

**Symptom:**
```
Product import fails with "node: command not found"
```

**Solution:**
Run import scripts **locally** with production API:

```bash
# From local machine
API_BASE="https://market.devloc.su/api/v1" ./scripts/import-to-prod.sh "https://american-creator.ru/catalog/must_have/199/"
```

Scripts use local Node.js to parse products, then upload to production API.

## 5. Database Connection Issues

**Symptom:**
- Backend can't connect to database
- "ECONNREFUSED" errors

**Check:**
```bash
# Check PostgreSQL container
ssh SRV199 "docker ps | grep postgres"

# Check connection
ssh SRV199 "docker exec smarket-postgres-prod psql -U snailmarket -d snailmarket -c 'SELECT 1;'"
```

**Solution:**
```bash
# Restart PostgreSQL container
ssh SRV199 "cd /home/lexun/apps/smarket.backup/backend && docker compose -f docker-compose.prod.yml restart smarket-postgres-prod"
```

## 6. Redis Connection Issues

**Symptom:**
- Cart not working
- Session errors

**Check:**
```bash
ssh SRV199 "docker exec smarket-redis-prod redis-cli ping"
```

**Solution:**
```bash
ssh SRV199 "cd /home/lexun/apps/smarket.backup/backend && docker compose -f docker-compose.prod.yml restart smarket-redis-prod"
```

## 7. Frontend Not Updating

**Symptom:**
- Code changes not visible
- Old version still showing

**Solution:**
```bash
# Rebuild frontend
cd client
npm run build

# Sync to server
rsync -avz client/dist/ SRV199:/home/lexun/apps/smarket.backup/frontend/

# Clear browser cache
# Or hard refresh: Ctrl+Shift+R
```

## 8. SSL Certificate Issues

**Symptom:**
- HTTPS not working
- Certificate expired warning

**Check:**
```bash
ssh SRV199 "sudo certbot certificates"
```

**Solution:**
```bash
# Renew certificates
ssh SRV199 "sudo certbot renew"

# Reload nginx
ssh SRV199 "sudo systemctl reload nginx"
```

## 9. High Memory Usage

**Check:**
```bash
ssh SRV199 "docker stats --no-stream"
```

**Solution:**
```bash
# Restart containers to free memory
ssh SRV199 "cd /home/lexun/apps/smarket.backup/backend && docker compose -f docker-compose.prod.yml restart"

# Or increase container memory limits in docker-compose.prod.yml
```

## 10. Disk Space Full

**Check:**
```bash
ssh SRV199 "df -h"
```

**Solution:**
```bash
# Clean Docker images
ssh SRV199 "docker system prune -a"

# Clean logs
ssh SRV199 "sudo journalctl --vacuum-time=7d"

# Remove old database backups
ssh SRV199 "find /backups -mtime +30 -delete"
```

## Monitoring Commands

```bash
# Check all container status
ssh SRV199 "docker ps"

# Check container logs
ssh SRV199 "docker logs smarket-backend-prod --tail 100"

# Check nginx logs
ssh SRV199 "sudo tail -f /var/log/nginx/error.log"

# Check system resources
ssh SRV199 "htop"
```

## Emergency Rollback

If production is broken:

```bash
# 1. Revert code
git revert HEAD
git push origin master

# 2. Redeploy
ssh SRV199 "cd /home/lexun/apps/smarket && git pull origin master"
ssh SRV199 "cd /home/lexun/apps/smarket.backup/backend && docker compose -f docker-compose.prod.yml up -d --build"
```

## Related

- See `production/deployment.md` for deployment process
- See `production/migrations.md` for database migrations
- See `production/nginx-config.md` for nginx configuration
