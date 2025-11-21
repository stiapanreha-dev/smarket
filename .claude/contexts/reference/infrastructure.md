# Docker Infrastructure

Docker services for local development.

## Services

Default ports (configurable in `docker-compose.yml` and `.env`):

- **PostgreSQL**: 5432 (or 5433 to avoid conflicts)
- **Redis**: 6379 (or 6380 to avoid conflicts)
- **LocalStack** (S3/SQS): 4566
- **Adminer** (DB UI): 9090 (or 8081)

## Starting Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres

# Stop all services
docker-compose down

# View logs
docker-compose logs -f postgres
```

## Adminer (Database UI)

Access at `http://localhost:9090`

**Connection details:**
- System: PostgreSQL
- Server: postgres
- Username: snailmarket
- Password: snailmarket_password
- Database: snailmarket

## PostgreSQL

**Container:** `snailmarket-postgres`

```bash
# Connect to database
docker-compose exec postgres psql -U snailmarket -d snailmarket

# Backup database
docker-compose exec postgres pg_dump -U snailmarket snailmarket > backup.sql

# Restore database
docker-compose exec -T postgres psql -U snailmarket -d snailmarket < backup.sql
```

## Redis

**Container:** `snailmarket-redis`

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Check keys
docker-compose exec redis redis-cli KEYS '*'

# Get cart data
docker-compose exec redis redis-cli GET cart:user:123

# Flush all data (careful!)
docker-compose exec redis redis-cli FLUSHALL
```

## LocalStack (S3/SQS Emulator)

**Container:** `snailmarket-localstack`

**Endpoints:**
- S3: `http://localhost:4566`
- SQS: `http://localhost:4566`

```bash
# List S3 buckets
aws --endpoint-url=http://localhost:4566 s3 ls

# Create bucket
aws --endpoint-url=http://localhost:4566 s3 mb s3://snailmarket-uploads

# Upload file
aws --endpoint-url=http://localhost:4566 s3 cp file.jpg s3://snailmarket-uploads/
```

## Port Conflicts

If ports are already in use, change in `docker-compose.yml`:

```yaml
services:
  postgres:
    ports:
      - '5433:5432'  # Use 5433 instead of 5432

  redis:
    ports:
      - '6380:6379'  # Use 6380 instead of 6379
```

Then update `.env`:
```bash
DATABASE_PORT=5433
REDIS_PORT=6380
```

## Docker Volumes

Data persisted in Docker volumes:
- `postgres-data` - PostgreSQL data
- `redis-data` - Redis data
- `localstack-data` - LocalStack data

```bash
# List volumes
docker volume ls

# Remove volumes (destructive!)
docker-compose down -v
```

## Troubleshooting

**Port already in use:**
- Change port in `docker-compose.yml`
- Or stop conflicting service

**Container won't start:**
```bash
# View logs
docker-compose logs postgres

# Restart container
docker-compose restart postgres
```

**Database connection refused:**
- Check container is running: `docker-compose ps`
- Check port mapping: `docker-compose port postgres 5432`
- Verify `.env` configuration

## Related

- See `development/commands.md` for Docker commands
- See `production/deployment.md` for production Docker
