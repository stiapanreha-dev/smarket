# Server Assessment for MVP Production Deployment

**Server:** Pi4-2 (Raspberry Pi 4)
**Domain:** smarket.sh3.su
**Public IP:** 178.124.206.31
**Assessment Date:** 2025-11-10
**Target:** SnailMarketplace MVP

---

## Executive Summary

### Verdict: ⚠️ **CONDITIONALLY SUITABLE** for MVP

**Can it work?** Yes, with limitations
**Recommended?** Only for **very early MVP** (≤50 concurrent users)
**Production-ready?** No, better suited for **staging/demo environment**

---

## Server Specifications

### Hardware Profile

| Component | Specification | MVP Status |
|-----------|--------------|------------|
| **Device** | Raspberry Pi 4 | 🟡 Acceptable for MVP |
| **Architecture** | ARM64 (aarch64) Cortex-A72 | ✅ Compatible with Docker |
| **CPU** | 4 cores @ ~1.5GHz | 🟡 Modest but usable |
| **RAM** | 8 GB (5.4 GB available) | ✅ Good for small workload |
| **Storage** | 229 GB SSD (187 GB free) | ✅ Sufficient |
| **Network** | Local: 192.168.100.198 | ✅ Static local IP |
| **Public IP** | 178.124.206.31 | ✅ Internet accessible |
| **Uptime** | 44 days, 23 hours | ✅ Stable |
| **Temperature** | 37°C | ✅ Normal operating temp |

### Software Environment

| Software | Status | Version |
|----------|--------|---------|
| **OS** | ✅ Installed | Debian 12 (Bookworm) |
| **Docker** | ✅ Installed | 28.1.1 |
| **Docker Compose** | ✅ Installed | v2.35.1 |
| **Node.js** | ❌ Not installed | Required for build |
| **Nginx** | ✅ Running | System nginx + containerized |
| **SSL/TLS** | ⚠️ Misconfigured | Certificate doesn't match domain |

### Current Workload

**Running Applications:** 6 containers
- food-discount-platform (frontend + backend + PostgreSQL)
- training-session-planner (frontend + backend)
- paystr-stripe-subscription
- ai-consultant-app (stopped)

**Resource Usage:**
- RAM: 2.3 GB / 7.6 GB used (30%)
- Disk: 31 GB / 229 GB used (14%)
- Load Average: 0.20 (low)

**Verdict:** ✅ Server has capacity for SnailMarketplace MVP

---

## Network & Domain Assessment

### DNS Configuration

```
Domain: smarket.sh3.su
CNAME: sh3.su
A Record: 178.124.206.31 ✅
```

**Status:** ✅ DNS correctly points to server

### SSL/TLS Certificate

**Current Issue:**
```
SSL: no alternative certificate subject name matches target host name 'smarket.sh3.su'
```

**Problem:** Existing SSL certificate doesn't include `smarket.sh3.su` subdomain

**Solution Required:**
1. Generate new Let's Encrypt certificate for `smarket.sh3.su`
2. Configure nginx/reverse proxy to serve it

**Estimated Fix Time:** 30 minutes

### Open Ports

| Port | Service | Status | Purpose |
|------|---------|--------|---------|
| 80 | HTTP | ✅ Open | Web traffic (redirect to HTTPS) |
| 443 | HTTPS | ✅ Open | Secure web traffic |
| 22 | SSH | ✅ Open | Server management |
| 3000 | App | ✅ Open | food-discount-frontend |
| 3001 | App | ✅ Open | paystr-stripe |
| 3002 | App | ✅ Open | training-planner-backend |
| 5000 | App | ✅ Open | food-discount-backend |
| 5174 | App | ✅ Open | training-planner-frontend |
| 6379 | Redis | 🔒 Localhost | Internal only (secure) |
| 9000-9001 | MinIO | ✅ Open | S3-compatible storage |

**Recommendation:** Use nginx reverse proxy for SnailMarketplace instead of exposing direct ports

---

## Suitability Analysis

### ✅ Strengths for MVP

1. **Already Running Production Apps**
   - Server is battle-tested with real traffic
   - 44 days uptime shows stability
   - Docker setup is proven

2. **Available Resources**
   - 5.4 GB free RAM (enough for NestJS + PostgreSQL + Redis)
   - 187 GB free disk space
   - Low current load (0.20)

3. **Infrastructure Ready**
   - Docker & Docker Compose installed
   - Reverse proxy (nginx) running
   - Public IP with domain configured

4. **Cost-Effective**
   - Zero cloud hosting fees for MVP
   - Good for bootstrapping/validation phase

5. **ARM64 Compatible**
   - Official Docker images support ARM (Node.js, PostgreSQL, Redis)
   - Your NestJS app will run fine

### ⚠️ Limitations & Risks

#### 1. **Performance Constraints**

| Metric | Raspberry Pi 4 | Typical VPS | Impact |
|--------|----------------|-------------|--------|
| CPU Cores | 4 @ 1.5GHz ARM | 4 @ 3.0GHz x86 | 🟡 ~50% slower |
| Single-thread | Weak | Strong | 🔴 Node.js is single-threaded |
| I/O throughput | Limited USB3/SD | NVMe SSD | 🟡 Database queries slower |
| Network | 1 Gbps shared | 1-10 Gbps dedicated | 🟢 Acceptable |

**Real-world Impact:**
- API response times: +50-100ms vs cloud VPS
- Database queries: +20-50ms
- Max concurrent users: **30-50** (vs 200-500 on VPS)
- Build times: 2-3x slower

**Mitigation:**
- Use aggressive Redis caching
- Optimize database indexes
- Enable CDN for static assets (frontend)

#### 2. **Scalability Issues**

**Vertical Scaling:** ❌ **IMPOSSIBLE**
- Cannot upgrade RAM/CPU on Raspberry Pi
- Hard limit at 8GB RAM

**Horizontal Scaling:** ❌ **NOT FEASIBLE**
- Single physical device
- No load balancing possible
- Single point of failure

**Database Scaling:** ❌ **LIMITED**
- PostgreSQL limited by RAM (5-6GB max)
- Cannot add read replicas easily
- ~10,000 orders maximum before slowdown

**Verdict:** 🔴 Must migrate to cloud VPS before significant growth

#### 3. **Reliability Concerns**

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Power outage | Medium | 🔴 Critical | UPS battery backup |
| SD card failure | Low (using SSD) | 🔴 Critical | Daily backups to cloud |
| ISP downtime | Medium | 🔴 Critical | None (consumer internet) |
| Hardware failure | Low | 🔴 Critical | Keep backup Pi ready |
| Overheating | Low (37°C) | 🟡 Medium | Ensure ventilation |
| DDoS attack | High (public IP) | 🔴 Critical | Cloudflare proxy |

**Critical Issues:**
- ❌ No redundancy (single server)
- ❌ No automated failover
- ❌ Residential internet (no SLA)
- ❌ No professional backup solution

**Recommendation:** Implement Cloudflare proxy + automated backups immediately

#### 4. **Security Concerns**

**Current State:**
- ✅ Ports 80, 443, 22 exposed (normal)
- ❌ Multiple app ports directly exposed (3000, 3001, 5000, 5174)
- ⚠️ SSL certificate misconfigured
- ❓ No firewall rules visible
- ❓ No fail2ban or intrusion detection

**Required Security Hardening:**
1. Close direct app ports (3000-5174)
2. Route all traffic through nginx reverse proxy
3. Configure SSL for smarket.sh3.su
4. Enable fail2ban for SSH
5. Set up automated security updates
6. Implement rate limiting in nginx
7. Add Cloudflare WAF

**Estimated Setup Time:** 2-3 hours

#### 5. **Operational Challenges**

**Deployment:**
- ❌ No CI/CD pipeline to Pi
- ❌ Manual SSH deployment required
- ⚠️ Must build Docker images on slow ARM CPU

**Monitoring:**
- ❓ No APM (Application Performance Monitoring)
- ❓ No centralized logging
- ❓ No uptime monitoring
- ❓ No alerting system

**Backups:**
- ❓ Unknown backup strategy
- ❓ No visible automated backups
- 🔴 Risk of data loss

**Recommendation:** Set up minimal monitoring (Uptime Robot + daily DB dumps to S3)

---

## Performance Projections

### Estimated Capacity

| Scenario | Concurrent Users | Requests/min | Database Rows | Status |
|----------|-----------------|--------------|---------------|--------|
| **Initial Launch** | 5-10 | 50-100 | < 1,000 | ✅ Excellent |
| **Early Adopters** | 10-30 | 100-300 | 1,000-10,000 | ✅ Good |
| **Growth Phase** | 30-50 | 300-500 | 10,000-50,000 | 🟡 Acceptable |
| **Scale Limit** | 50-100 | 500-1,000 | 50,000-100,000 | 🔴 Degraded |
| **Breaking Point** | > 100 | > 1,000 | > 100,000 | ❌ Fails |

### Benchmark Estimates

**API Response Times (p95):**
- Simple GET (cached): 50-100ms ✅
- Simple GET (uncached): 100-200ms ✅
- Complex query (joins): 200-500ms 🟡
- File upload (S3): 500-1500ms 🟡
- Checkout flow: 800-1500ms ⚠️

**Database Performance:**
- Simple SELECT: 5-20ms ✅
- SELECT with JOINs: 20-100ms 🟡
- INSERT/UPDATE: 10-50ms ✅
- Full-text search: 100-500ms ⚠️

**Verdict:** Meets MVP requirements (<500ms p95) for up to 30 users

---

## Cost-Benefit Analysis

### Using Raspberry Pi for MVP

| Factor | Cost/Value | Notes |
|--------|------------|-------|
| **Hardware Cost** | $0 (already owned) | No upfront investment |
| **Hosting Cost** | $0/month | vs $10-50/month VPS |
| **Domain Cost** | $0 (sh3.su owned) | Already paid |
| **SSL Certificate** | $0 (Let's Encrypt) | Free |
| **Electricity** | ~$2/month | 15W * 24h * 30d * $0.15/kWh |
| **Internet** | $0 (existing) | Already paying for home internet |
| **Setup Time** | 4-6 hours | vs 2-3 hours for VPS |
| **Migration Cost** | $0 initially | But will need to migrate later |
| **Total 3-month MVP** | **~$6** | vs **$150-300** for cloud VPS |

**ROI:** ✅ Excellent for MVP validation phase

### When to Migrate to Cloud

**Trigger Events:**
1. > 30 concurrent users regularly
2. > 1,000 orders/day
3. > 50,000 products in catalog
4. Raising investment
5. International expansion
6. Need 99.9% SLA

**Migration Timeline:** Plan for cloud move in 3-6 months

---

## Deployment Architecture

### Recommended Docker Stack for SnailMarketplace

```yaml
# docker-compose.yml on Pi4-2
services:
  smarket-nginx:
    image: nginx:alpine
    ports:
      - "8100:80"  # Internal port, proxied by system nginx
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - smarket-backend

  smarket-backend:
    image: snailmarket-backend:latest  # Must build on Pi or use ARM image
    environment:
      - NODE_ENV=production
      - DB_HOST=smarket-postgres
      - REDIS_HOST=smarket-redis
    depends_on:
      - smarket-postgres
      - smarket-redis

  smarket-postgres:
    image: postgres:15-alpine  # ARM-compatible
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    restart: always

  smarket-redis:
    image: redis:7-alpine  # ARM-compatible
    volumes:
      - redis-data:/data
    restart: always

  smarket-frontend:
    image: snailmarket-frontend:latest
    # Served by nginx as static files
```

**System Nginx Config:**
```nginx
# /etc/nginx/sites-enabled/smarket.sh3.su
server {
    listen 443 ssl http2;
    server_name smarket.sh3.su;

    ssl_certificate /etc/letsencrypt/live/smarket.sh3.su/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/smarket.sh3.su/privkey.pem;

    location / {
        proxy_pass http://localhost:8100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Resource Allocation

| Service | RAM Limit | CPU Priority | Notes |
|---------|-----------|--------------|-------|
| NestJS Backend | 1.5 GB | High | Node.js heap limit |
| PostgreSQL | 2 GB | High | Shared buffers: 512MB |
| Redis | 512 MB | Medium | maxmemory 512mb |
| Nginx | 128 MB | Low | Reverse proxy |
| **Total** | **~4 GB** | | Leaves 3.4 GB free |

---

## Setup Checklist

### Phase 1: Prerequisites (1 hour)

- [ ] Install Node.js 20 LTS on Pi
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

- [ ] Generate SSL certificate for smarket.sh3.su
  ```bash
  sudo certbot certonly --nginx -d smarket.sh3.su
  ```

- [ ] Create nginx config for smarket.sh3.su
- [ ] Test SSL: `curl -I https://smarket.sh3.su`

### Phase 2: Application Setup (2 hours)

- [ ] Clone repository to Pi
- [ ] Build Docker images (ARM-compatible)
- [ ] Create `.env.production` file
- [ ] Configure docker-compose.yml
- [ ] Test locally: `docker-compose up -d`

### Phase 3: Security Hardening (2 hours)

- [ ] Close unnecessary ports (iptables/ufw)
- [ ] Enable fail2ban for SSH
- [ ] Set up Cloudflare proxy (optional but recommended)
- [ ] Configure rate limiting in nginx
- [ ] Set up automated backups to cloud

### Phase 4: Monitoring (1 hour)

- [ ] Set up Uptime Robot (free tier)
- [ ] Configure daily PostgreSQL backups
- [ ] Set up disk space alerts
- [ ] Test backup restoration

**Total Setup Time:** ~6 hours

---

## Comparison: Raspberry Pi vs Cloud VPS

| Factor | Raspberry Pi 4 | DigitalOcean Droplet ($24/mo) | AWS Lightsail ($10/mo) |
|--------|----------------|-------------------------------|------------------------|
| **CPU** | 4 ARM cores @ 1.5GHz | 2 x86 cores @ 2.5GHz | 2 x86 cores @ 2.5GHz |
| **RAM** | 8 GB | 4 GB | 2 GB |
| **Storage** | 229 GB SSD | 80 GB SSD | 60 GB SSD |
| **Network** | 1 Gbps (shared) | 4 TB transfer | 3 TB transfer |
| **Uptime SLA** | ❌ None | ✅ 99.99% | ✅ 99.9% |
| **Backups** | ❌ Manual | ✅ Automated | ✅ Automated |
| **Scalability** | ❌ None | ✅ Resize anytime | ✅ Resize anytime |
| **Performance** | 🟡 Modest | ✅ Good | 🟡 Fair |
| **Cost (3 mo)** | $6 | $72 | $30 |
| **Best For** | MVP validation | Production | Small production |

**Recommendation:**
- **Months 1-3 (MVP validation):** Raspberry Pi ✅
- **Months 4-6 (early growth):** AWS Lightsail ($10/mo) ✅
- **Months 7+ (scaling):** DigitalOcean/AWS ($20-50/mo) ✅

---

## Risk Mitigation Strategies

### Critical Risks & Mitigations

1. **Hardware Failure**
   - ✅ Keep automated daily backups on AWS S3 ($1/mo)
   - ✅ Document disaster recovery procedure
   - ⚠️ Expect 2-4 hours downtime if failure occurs

2. **Performance Degradation**
   - ✅ Set up Redis aggressive caching
   - ✅ Use Cloudflare CDN for static assets
   - ✅ Monitor response times with Uptime Robot
   - ⚠️ Plan cloud migration before hitting 50 users

3. **Security Breach**
   - ✅ Cloudflare WAF (free tier)
   - ✅ fail2ban for SSH
   - ✅ Rate limiting in nginx
   - ✅ Weekly security audits

4. **Data Loss**
   - ✅ Daily PostgreSQL dumps to AWS S3
   - ✅ Test restore monthly
   - ✅ Keep 30-day backup history

5. **Internet Outage**
   - ⚠️ Accept risk (residential ISP)
   - ✅ Set up status page (status.smarket.sh3.su)
   - ⚠️ Maximum acceptable downtime: 4 hours

---

## Final Recommendation

### ✅ YES, Use Raspberry Pi for MVP Launch

**Conditions:**
1. **Limited to first 3 months** (MVP validation phase)
2. **Maximum 30 concurrent users** target
3. **Implement all security hardening** (Cloudflare, SSL, backups)
4. **Set up monitoring** (Uptime Robot, alerts)
5. **Plan cloud migration** from month 4

### Migration Timeline

```
Month 1-2: Raspberry Pi MVP
├─ Launch to friends & family
├─ Gather initial feedback
├─ Iterate on features
└─ Cost: $2-4

Month 3: Early Adopters
├─ Expand to 20-30 users
├─ Monitor performance closely
├─ Prepare cloud migration
└─ Cost: $2

Month 4+: Cloud Migration
├─ Move to AWS Lightsail $10/mo
├─ Seamless DNS switchover
├─ Scale to 100+ users
└─ Cost: $10-20/mo
```

### Why This Works

**For Early MVP:**
- ✅ Zero hosting cost allows budget for marketing
- ✅ Sufficient for 10-30 early adopters
- ✅ Fast iteration without cloud bills
- ✅ Learn what features users actually want

**Migration Path:**
- ✅ Docker setup transfers directly to cloud
- ✅ Database dump/restore tested
- ✅ DNS switch takes 5 minutes
- ✅ Total migration downtime: < 1 hour

---

## Alternative: Cloudflare Tunnel

### Zero-Trust Network Access

Instead of exposing ports, use **Cloudflare Tunnel** (free):

**Benefits:**
- ✅ No open ports (more secure)
- ✅ Free SSL (automatic)
- ✅ DDoS protection
- ✅ Hide home IP address
- ✅ No router port forwarding needed

**Setup:**
```bash
# Install cloudflared on Pi
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o cloudflared
chmod +x cloudflared

# Create tunnel
cloudflared tunnel create smarket
cloudflared tunnel route dns smarket smarket.sh3.su
cloudflared tunnel run smarket
```

**Estimated Setup Time:** 30 minutes
**Recommendation:** ✅ **HIGHLY RECOMMENDED** for production

---

## Conclusion

### Summary Table

| Criteria | Rating | Notes |
|----------|--------|-------|
| **Hardware Capability** | 🟡 7/10 | Sufficient for MVP, not production |
| **Cost Effectiveness** | ✅ 10/10 | $6 for 3 months vs $150+ cloud |
| **Reliability** | 🟡 6/10 | Single point of failure |
| **Performance** | 🟡 7/10 | Acceptable for <50 users |
| **Scalability** | 🔴 2/10 | Must migrate to cloud soon |
| **Security** | 🟡 6/10 | With hardening, acceptable |
| **Ease of Setup** | ✅ 8/10 | Docker already running |
| **Overall MVP Fit** | 🟡 7/10 | **Good for 3-month MVP** |

### Final Verdict

**✅ APPROVED for MVP Launch** with conditions:

1. Use for maximum 3 months
2. Limit to 30 concurrent users
3. Implement security hardening
4. Set up automated backups
5. Monitor performance actively
6. Plan cloud migration by Month 4

### Next Steps

1. **This Week:** Set up SSL + nginx config (2 hours)
2. **Next Week:** Deploy SnailMarketplace MVP (4 hours)
3. **Ongoing:** Monitor performance + backups
4. **Month 3:** Begin cloud migration planning

---

**Document Version:** 1.0
**Approved For:** MVP validation phase only
**Review Date:** After 1 month of operation
**Migration Deadline:** Before exceeding 30 concurrent users
