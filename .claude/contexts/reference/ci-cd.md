# CI/CD Pipeline

GitHub Actions workflows for continuous integration and deployment.

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to feature branches
- Pull requests to `develop`

**Jobs:**
1. **Lint** - ESLint and Prettier
2. **Type Check** - TypeScript compilation
3. **Unit Tests** - Jest unit tests
4. **Integration Tests** - Tests with test database
5. **Security Scan** - npm audit and Snyk

**Requirements:**
- Minimum test coverage: 80%
- All checks must pass

### 2. Staging Deployment (`.github/workflows/deploy-staging.yml`)

**Triggers:**
- Merge to `develop` branch

**Jobs:**
1. Build Docker images
2. Deploy to staging server
3. Run database migrations
4. Run E2E tests
5. Notify team (Slack/email)

**Automatic deployment** - no manual approval required.

### 3. Production Deployment (`.github/workflows/deploy-production.yml`)

**Triggers:**
- Merge to `main` branch

**Jobs:**
1. **Manual approval required** - Wait for maintainer approval
2. Backup production database
3. Build Docker images
4. Blue-green deployment
5. Run smoke tests
6. Automatic rollback on failure
7. Notify team

**Requires manual approval** before deploying to production.

## GitHub Secrets

Required secrets (set in repo Settings → Secrets):

```
# SSH Access
SSH_PRIVATE_KEY - SSH key for server access
PROD_SERVER_HOST - Production server IP/hostname
PROD_SERVER_USER - SSH username

# Database
DATABASE_URL - Production database connection string

# Docker Registry
DOCKER_USERNAME - Docker Hub username
DOCKER_PASSWORD - Docker Hub password/token

# Notifications
SLACK_WEBHOOK_URL - Slack notification webhook
```

## Setup Instructions

See `.github/SETUP.md` for detailed CI/CD configuration instructions.

## Branch Strategy

```
feature-branch → develop → main
     ↓             ↓         ↓
    CI         Staging   Production
```

- **Feature branches**: Development work, CI runs
- **develop**: Staging environment, auto-deployed
- **main**: Production environment, manual approval

## Running CI Locally

```bash
# Install act (GitHub Actions local runner)
brew install act  # macOS
# or: https://github.com/nektos/act

# Run CI workflow locally
act -j test

# Run specific job
act -j lint
```

## Monitoring Workflows

- View in GitHub: Actions tab
- Check status badges in README
- Slack notifications (if configured)

## Related

- See `.github/SETUP.md` for setup instructions
- See `production/deployment.md` for manual deployment
- See `development/testing.md` for test configuration
