# Production Deployment

Deployment procedures for SRV199 production server.

## Server Information

- **Server**: SRV199 (Raspberry Pi)
- **Location**: `/home/lexun/apps/smarket`
- **Domain**: https://market.devloc.su
- **Backend Port**: 3003 (Docker container)
- **Frontend**: Static files served by nginx

## Deployment Process

### Step 1: Push Changes

```bash
git add .
git commit -m "Your changes"
git push origin master
```

### Step 2: Pull on Server

```bash
ssh SRV199 "cd /home/lexun/apps/smarket && git pull origin master"
```

### Step 3: Build Frontend

```bash
# Build locally or on server
cd client
npm run build
```

### Step 4: Sync Frontend to Server

```bash
rsync -avz client/dist/ SRV199:/home/lexun/apps/smarket.backup/frontend/
```

### Step 5: Rebuild Backend Containers

```bash
ssh SRV199 "cd /home/lexun/apps/smarket.backup/backend && docker compose -f docker-compose.prod.yml up -d --build"
```

### Step 6: Reload Nginx

```bash
ssh SRV199 "sudo systemctl reload nginx"
```

## Production Docker Containers

Managed via `docker-compose.prod.yml`:

- `smarket-backend-prod` - NestJS backend (port 3003)
- `smarket-postgres-prod` - PostgreSQL (port 5434)
- `smarket-redis-prod` - Redis (port 6381)

### Container Operations

```bash
# View logs
ssh SRV199 "docker logs smarket-backend-prod --tail 50"

# Follow logs in real-time
ssh SRV199 "docker logs smarket-backend-prod -f"

# Restart container
ssh SRV199 "cd /home/lexun/apps/smarket.backup/backend && docker compose -f docker-compose.prod.yml restart smarket-backend-prod"

# Stop all containers
ssh SRV199 "cd /home/lexun/apps/smarket.backup/backend && docker compose -f docker-compose.prod.yml down"

# Start all containers
ssh SRV199 "cd /home/lexun/apps/smarket.backup/backend && docker compose -f docker-compose.prod.yml up -d"

# Check container status
ssh SRV199 "docker ps | grep smarket"
```

## Environment Variables

Production environment variables stored in:
- Backend: `/home/lexun/apps/smarket.backup/backend/.env.production`
- Frontend: Build-time variables in `client/.env.production`

## Database Backups

```bash
# Manual backup
ssh SRV199 "docker exec smarket-postgres-prod pg_dump -U snailmarket snailmarket > /backups/smarket_$(date +%Y%m%d).sql"

# Restore from backup
ssh SRV199 "docker exec -i smarket-postgres-prod psql -U snailmarket -d snailmarket < /backups/smarket_20250121.sql"
```

## Deployment Checklist

Before deploying:
- [ ] Tests pass locally
- [ ] Database migrations reviewed
- [ ] Environment variables updated
- [ ] Frontend built successfully
- [ ] Backend builds without errors

After deploying:
- [ ] Check container logs for errors
- [ ] Verify API health endpoint
- [ ] Test critical user flows
- [ ] Monitor error logs

## Rollback Procedure

```bash
# 1. Revert git commit
git revert HEAD
git push origin master

# 2. Pull on server
ssh SRV199 "cd /home/lexun/apps/smarket && git pull origin master"

# 3. Rebuild and restart
ssh SRV199 "cd /home/lexun/apps/smarket.backup/backend && docker compose -f docker-compose.prod.yml up -d --build"
```

## Health Checks

```bash
# Check API health
curl https://market.devloc.su/api/health

# Check specific module
curl https://market.devloc.su/api/v1/catalog/info
```

## Related

- See `production/migrations.md` for database migration process
- See `production/nginx-config.md` for nginx setup
- See `production/troubleshooting.md` for common issues
