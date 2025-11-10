# Deployment Setup Guide

## Overview

This guide explains how to set up automated deployment to the production server (Pi4-2) using GitHub Actions.

---

## Infrastructure

**Domain:** https://smarket.sh3.su
**Server:** Raspberry Pi 4 (Pi4-2)
**IP:** 178.124.206.31
**SSL:** Let's Encrypt (auto-renewed)
**Nginx:** Reverse proxy on ports 80/443
**Backend Port:** 3003 (localhost only)

---

## Prerequisites

### 1. Server Setup (Already Completed ✅)

- [x] SSL certificate generated for `smarket.sh3.su`
- [x] Nginx configured with reverse proxy
- [x] Deployment directory structure created at `~/apps/smarket/`
- [x] Deploy script created at `~/apps/smarket/scripts/deploy.sh`

### 2. GitHub Repository Setup

You need to configure **GitHub Secrets** for the deployment workflow to work.

---

## GitHub Secrets Configuration

Go to your repository: `https://github.com/stiapanreha-dev/smarket/settings/secrets/actions`

### Required Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `SSH_PRIVATE_KEY` | SSH private key for accessing Pi4-2 | See below |
| `SSH_USER` | SSH username | `lexun` |
| `SERVER_HOST` | Server hostname/IP | `192.168.100.198` (internal) or use domain |
| `DB_PASSWORD` | PostgreSQL password | Generate strong password |
| `JWT_SECRET` | JWT signing secret | Generate with `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | Generate with `openssl rand -base64 32` |

### How to Get SSH_PRIVATE_KEY

#### Option A: Use Existing SSH Key

If you already have SSH access to Pi4-2:

```bash
# On your local machine
cat ~/.ssh/id_rsa  # or ~/.ssh/id_ed25519

# Copy the ENTIRE output including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ... (private key content) ...
# -----END OPENSSH PRIVATE KEY-----
```

#### Option B: Generate New Deploy Key

For better security, create a dedicated deployment key:

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/smarket_deploy_key

# Copy the private key
cat ~/.ssh/smarket_deploy_key

# Copy the public key to the server
ssh-copy-id -i ~/.ssh/smarket_deploy_key.pub lexun@Pi4-2

# Or manually add to server:
cat ~/.ssh/smarket_deploy_key.pub
# Then on server:
ssh Pi4-2
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Generate Secrets

```bash
# Generate DB password (32 characters)
openssl rand -base64 24

# Generate JWT secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET
```

---

## Adding Secrets to GitHub

1. Go to: https://github.com/stiapanreha-dev/smarket/settings/secrets/actions
2. Click **"New repository secret"**
3. Add each secret:
   - Name: `SSH_PRIVATE_KEY`
   - Value: [paste private key including BEGIN/END lines]
4. Repeat for all secrets

---

## Deployment Workflow

### Automatic Deployment

Every push to `master` branch triggers automatic deployment:

```
git push origin master
```

**Workflow Steps:**
1. GitHub Actions checks out code
2. Sets up SSH connection to Pi4-2
3. Clones/updates repository on server
4. Creates `.env.production` with secrets
5. Runs `deploy.sh` script:
   - Builds Docker images
   - Stops old containers
   - Starts new containers
   - Runs migrations
6. Verifies deployment (health check)
7. Notifies success/failure

### Manual Deployment

Trigger manually from GitHub Actions tab:

1. Go to: https://github.com/stiapanreha-dev/smarket/actions
2. Select **"Deploy to Production"** workflow
3. Click **"Run workflow"**
4. Select branch: `master`
5. Click **"Run workflow"**

---

## File Structure on Server

```
~/apps/smarket/
├── backend/                    # Git repository clone
│   ├── .git/
│   ├── src/
│   ├── docker-compose.prod.yml
│   ├── Dockerfile
│   ├── .env.production        # Created by GitHub Actions
│   └── ...
├── scripts/
│   └── deploy.sh              # Deployment script
└── logs/
    └── deploy.log             # Deployment logs
```

---

## Docker Containers

After deployment, these containers run:

| Container | Port | Description |
|-----------|------|-------------|
| `smarket-backend-prod` | 3003 (localhost) | NestJS API |
| `smarket-postgres-prod` | 5434 (localhost) | PostgreSQL 15 |
| `smarket-redis-prod` | 6381 (localhost) | Redis 7 |

**All ports are localhost-only** - nginx proxies external traffic.

---

## Nginx Configuration

**File:** `/etc/nginx/sites-available/smarket.sh3.su`

```nginx
server {
    server_name smarket.sh3.su;

    location /api/ {
        proxy_pass http://localhost:3003/api/;
        # ... (headers and settings)
    }

    location / {
        # Placeholder until frontend is deployed
        return 200 'SnailMarketplace API is running...';
    }

    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/smarket.sh3.su/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/smarket.sh3.su/privkey.pem;
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name smarket.sh3.su;
    return 301 https://$host$request_uri;
}
```

---

## Monitoring Deployment

### View GitHub Actions Log

1. Go to: https://github.com/stiapanreha-dev/smarket/actions
2. Click on the latest workflow run
3. Expand steps to see detailed logs

### SSH to Server and Check

```bash
# SSH to server
ssh Pi4-2

# Check container status
cd ~/apps/smarket/backend
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f backend

# Check deployment logs
tail -f ~/apps/smarket/logs/deploy.log

# Test API locally
curl http://localhost:3003/health
curl http://localhost:3003/api/v1

# Test via nginx
curl https://smarket.sh3.su/health
curl https://smarket.sh3.su/api/v1
```

---

## Troubleshooting

### Deployment Fails: SSH Connection Error

**Problem:** GitHub Actions can't connect to server

**Solutions:**
1. Check `SSH_PRIVATE_KEY` secret is correct
2. Verify public key is in `~/.ssh/authorized_keys` on server
3. Check `SERVER_HOST` is correct (use internal IP: `192.168.100.198`)
4. Ensure server is accessible from GitHub (firewall/router)

### Deployment Fails: Docker Build Error

**Problem:** ARM architecture build fails

**Solution:** Ensure Dockerfile uses ARM-compatible base images:
```dockerfile
FROM node:20-alpine AS builder
# ... (Alpine Linux supports ARM64)
```

### Health Check Fails

**Problem:** API doesn't respond after deployment

**Diagnostic Steps:**
```bash
ssh Pi4-2

# Check if containers are running
docker compose -f ~/apps/smarket/backend/docker-compose.prod.yml ps

# Check backend logs
docker compose -f ~/apps/smarket/backend/docker-compose.prod.yml logs backend

# Check if port is listening
ss -tlnp | grep 3003

# Test API directly
curl http://localhost:3003/health
```

### Database Connection Issues

**Problem:** Backend can't connect to PostgreSQL

**Solution:**
1. Check `.env.production` has correct credentials
2. Verify PostgreSQL container is healthy:
   ```bash
   docker compose -f ~/apps/smarket/backend/docker-compose.prod.yml ps postgres
   ```
3. Test database connection:
   ```bash
   docker exec smarket-postgres-prod psql -U snailmarket -d snailmarket -c "SELECT 1;"
   ```

---

## Manual Deployment (Without GitHub Actions)

If you need to deploy manually:

```bash
# SSH to server
ssh Pi4-2

# Run deploy script
cd ~/apps/smarket
./scripts/deploy.sh
```

---

## Rollback Procedure

If deployment breaks production:

```bash
# SSH to server
ssh Pi4-2
cd ~/apps/smarket/backend

# Check git log for previous working commit
git log --oneline -5

# Rollback to previous commit
git reset --hard <PREVIOUS_COMMIT_SHA>

# Redeploy
cd ~/apps/smarket
./scripts/deploy.sh
```

**Or use GitHub Actions:** Manually trigger deployment with an older commit.

---

## Security Best Practices

### SSH Key Management

- ✅ Use dedicated deploy key (not your personal key)
- ✅ Set key permissions: `chmod 600 ~/.ssh/smarket_deploy_key`
- ✅ Rotate keys every 6 months
- ✅ Never commit private keys to repository

### Secrets Management

- ✅ Use GitHub Secrets (encrypted at rest)
- ✅ Never hardcode secrets in code
- ✅ Rotate JWT secrets periodically
- ✅ Use strong passwords (≥32 characters)

### Server Hardening

- ✅ Disable SSH password authentication
- ✅ Use fail2ban for SSH brute-force protection
- ✅ Keep server updated: `sudo apt update && sudo apt upgrade`
- ✅ Monitor logs: `sudo journalctl -u ssh -f`

---

## SSL Certificate Renewal

Certbot auto-renews certificates. To verify:

```bash
ssh Pi4-2
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer
```

If renewal fails, manually renew:

```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

---

## Performance Tuning

### Docker Resource Limits

If server runs out of memory, edit `docker-compose.prod.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1.5G
        reservations:
          memory: 512M
```

### PostgreSQL Tuning

For Raspberry Pi 4 (8GB RAM):

```bash
ssh Pi4-2
docker exec -it smarket-postgres-prod psql -U snailmarket

ALTER SYSTEM SET shared_buffers = '512MB';
ALTER SYSTEM SET effective_cache_size = '2GB';
ALTER SYSTEM SET maintenance_work_mem = '128MB';
ALTER SYSTEM SET max_connections = 50;

# Restart PostgreSQL
docker compose -f ~/apps/smarket/backend/docker-compose.prod.yml restart postgres
```

---

## Backup Strategy

### Database Backups

Create automated daily backups:

```bash
# Create backup script
ssh Pi4-2
cat > ~/apps/smarket/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="$HOME/apps/smarket/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

docker exec smarket-postgres-prod pg_dump -U snailmarket snailmarket | gzip > "$BACKUP_DIR/smarket_$DATE.sql.gz"

# Keep only last 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "Backup created: smarket_$DATE.sql.gz"
EOF

chmod +x ~/apps/smarket/scripts/backup.sh

# Add to crontab
crontab -e
# Add line:
# 0 2 * * * $HOME/apps/smarket/scripts/backup.sh >> $HOME/apps/smarket/logs/backup.log 2>&1
```

### Restore from Backup

```bash
ssh Pi4-2
cd ~/apps/smarket/backups

# Stop backend
cd ~/apps/smarket/backend
docker compose -f docker-compose.prod.yml stop backend

# Restore database
gunzip < smarket_YYYYMMDD_HHMMSS.sql.gz | docker exec -i smarket-postgres-prod psql -U snailmarket snailmarket

# Restart backend
docker compose -f docker-compose.prod.yml start backend
```

---

## Next Steps

1. **Configure GitHub Secrets** (see above)
2. **Test deployment:**
   ```bash
   git commit --allow-empty -m "test: Trigger deployment"
   git push origin master
   ```
3. **Monitor deployment** in GitHub Actions
4. **Verify API:** https://smarket.sh3.su/api/v1
5. **Set up monitoring** (Uptime Robot, etc.)

---

## Support

**Deployment Issues:** Check GitHub Actions logs
**Server Issues:** SSH to Pi4-2 and check Docker logs
**Nginx Issues:** Check `/var/log/nginx/error.log`

**Quick Health Check:**
```bash
curl -I https://smarket.sh3.su/health
```

Expected response: `HTTP/2 200`

---

**Document Version:** 1.0
**Last Updated:** 2025-11-10
**Maintainer:** lexun
