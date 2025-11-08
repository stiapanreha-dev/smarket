# CI/CD Setup Instructions

This guide will help you set up the CI/CD pipeline for SnailMarketplace.

## Prerequisites

- GitHub repository with admin access
- Docker Hub account
- Deployment infrastructure (servers, Kubernetes, cloud provider, etc.)

## Step 1: Configure GitHub Secrets

Go to `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

### Required Secrets

#### Docker Hub Integration
```
DOCKER_USERNAME=your-dockerhub-username
DOCKER_PASSWORD=your-dockerhub-access-token
```

**How to get Docker Hub token:**
1. Login to Docker Hub
2. Go to Account Settings → Security
3. Click "New Access Token"
4. Copy the token and save as `DOCKER_PASSWORD`

#### Staging Environment
```
STAGING_URL=https://staging.snailmarketplace.com
STAGING_SSH_USER=deploy
STAGING_HOST=staging.example.com
E2E_TEST_USERNAME=test@example.com
E2E_TEST_PASSWORD=secure-password
```

#### Production Environment
```
PRODUCTION_URL=https://snailmarketplace.com
PRODUCTION_GREEN_URL=https://green.snailmarketplace.com
PRODUCTION_SSH_USER=deploy
PRODUCTION_HOST=production.example.com
MONITORING_URL=https://monitoring.example.com
```

#### Optional Secrets
```
SNYK_TOKEN=your-snyk-token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## Step 2: Configure GitHub Environments

Go to `Settings` → `Environments`

### Environment 1: staging

1. Click "New environment" → Name: `staging`
2. Configure:
   - ✅ Enable "Required reviewers" (optional for staging)
   - ✅ Set "Deployment branches": `develop` only
   - ✅ Add environment URL: `https://staging.snailmarketplace.com`

### Environment 2: production-approval

1. Click "New environment" → Name: `production-approval`
2. Configure:
   - ✅ Enable "Required reviewers" → Add team members
   - ✅ Set "Deployment branches": `main` only
   - ⏱️ Optional: Set "Wait timer": 5 minutes

### Environment 3: production

1. Click "New environment" → Name: `production`
2. Configure:
   - ✅ Enable "Required reviewers" → Add senior team members
   - ✅ Set "Deployment branches": `main` only
   - ✅ Add environment URL: `https://snailmarketplace.com`
   - ⏱️ Optional: Set "Wait timer": 0 minutes

## Step 3: Set Up Docker Hub Repository

1. Create a repository on Docker Hub:
   ```
   snailmarketplace
   ```

2. Make it private or public based on your needs

3. Verify access with:
   ```bash
   docker login
   docker pull <username>/snailmarketplace:staging-latest
   ```

## Step 4: Configure Deployment Infrastructure

### Option A: SSH-based Deployment

1. Generate SSH key pair:
   ```bash
   ssh-keygen -t ed25519 -C "github-actions" -f github-actions-key
   ```

2. Add public key to server:
   ```bash
   ssh-copy-id -i github-actions-key.pub deploy@staging.example.com
   ssh-copy-id -i github-actions-key.pub deploy@production.example.com
   ```

3. Add private key as GitHub secret:
   ```
   STAGING_SSH_KEY=<contents of github-actions-key>
   PRODUCTION_SSH_KEY=<contents of github-actions-key>
   ```

4. Update workflow files to use SSH:
   ```yaml
   - name: Deploy via SSH
     uses: appleboy/ssh-action@master
     with:
       host: ${{ secrets.STAGING_HOST }}
       username: ${{ secrets.STAGING_SSH_USER }}
       key: ${{ secrets.STAGING_SSH_KEY }}
       script: |
         cd /app/snailmarketplace
         docker-compose pull
         docker-compose up -d
   ```

### Option B: Kubernetes Deployment

1. Get kubeconfig:
   ```bash
   kubectl config view --raw
   ```

2. Add as GitHub secret:
   ```
   KUBE_CONFIG=<contents of kubeconfig>
   ```

3. Update workflow files:
   ```yaml
   - name: Deploy to Kubernetes
     uses: azure/k8s-set-context@v1
     with:
       kubeconfig: ${{ secrets.KUBE_CONFIG }}

   - name: Deploy
     run: |
       kubectl set image deployment/snailmarketplace \
         app=${{ env.DOCKER_IMAGE_NAME }}:staging-latest \
         --namespace=staging
   ```

### Option C: Cloud Provider (AWS/GCP/Azure)

**AWS ECS Example:**

1. Configure AWS credentials:
   ```
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_REGION=us-east-1
   ```

2. Update workflow:
   ```yaml
   - name: Configure AWS credentials
     uses: aws-actions/configure-aws-credentials@v2
     with:
       aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
       aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
       aws-region: ${{ secrets.AWS_REGION }}

   - name: Deploy to ECS
     run: |
       aws ecs update-service \
         --cluster staging-cluster \
         --service snailmarketplace \
         --force-new-deployment
   ```

## Step 5: Set Up Monitoring (Optional)

### Snyk Security Scanning

1. Sign up at https://snyk.io
2. Go to Account Settings → API Token
3. Add as `SNYK_TOKEN` secret

### Slack Notifications

1. Create a Slack app: https://api.slack.com/apps
2. Enable Incoming Webhooks
3. Create webhook for your channel
4. Add as `SLACK_WEBHOOK_URL` secret

### Codecov Integration

1. Sign up at https://codecov.io
2. Add your repository
3. Get upload token
4. Add as `CODECOV_TOKEN` secret (optional, public repos work without it)

## Step 6: Test the Pipeline

### Test CI Pipeline

1. Create a test branch:
   ```bash
   git checkout -b feature/test-ci
   echo "test" >> README.md
   git commit -am "Test CI pipeline"
   git push origin feature/test-ci
   ```

2. Check GitHub Actions tab for running workflow

3. Verify all jobs pass:
   - Code Quality & Type Check
   - Unit Tests
   - Build Docker Image

### Test PR Workflow

1. Create PR from `feature/test-ci` to `develop`
2. Verify additional checks run:
   - Integration Tests
   - Security Scan
   - Coverage Report

### Test Staging Deployment

1. Merge PR to `develop`
2. Watch the deployment workflow
3. Verify staging environment updates
4. Check E2E tests pass

### Test Production Deployment

1. Create PR from `develop` to `main`
2. Merge PR
3. Approve deployment in GitHub UI
4. Watch blue-green deployment
5. Verify production environment updates

## Step 7: Customize Deployment Scripts

The workflows contain placeholder deployment scripts. Update them based on your infrastructure:

### In `deploy-staging.yml`:

Replace the deploy step (lines ~60-75):
```yaml
- name: Deploy to staging
  id: deploy
  run: |
    # Add your actual deployment script here
    # Examples provided in comments
```

### In `deploy-production.yml`:

Replace the deployment steps:
- Deploy to Green environment (~125)
- Switch traffic to Green (~175)
- Rollback procedure (~250)

## Troubleshooting

### Workflows not triggering

- Check branch protection rules
- Verify workflow files are in `.github/workflows/`
- Check workflow syntax with: https://rhysd.github.io/actionlint/

### Secrets not working

- Verify secret names match exactly (case-sensitive)
- Check environment-specific secrets are set
- Ensure secrets are available in the environment scope

### Docker push fails

- Verify Docker Hub credentials
- Check repository exists and is accessible
- Ensure image name format is correct: `username/repository:tag`

### Deployment fails

- Check server/cluster is accessible
- Verify credentials are correct
- Check logs in GitHub Actions
- Ensure deployment scripts have proper permissions

### Health checks fail

- Verify application is running
- Check health endpoint returns 200
- Ensure database/redis are accessible
- Review application logs

## Security Best Practices

1. **Rotate secrets regularly** - Update credentials every 90 days
2. **Use least privilege** - Give minimum required permissions
3. **Enable 2FA** - On GitHub, Docker Hub, cloud providers
4. **Audit access** - Review who has access to secrets
5. **Use environment protection** - Require approvals for production
6. **Monitor workflows** - Watch for unusual activity
7. **Keep actions updated** - Update GitHub Actions regularly

## Next Steps

1. Set up monitoring and alerting
2. Configure automatic scaling
3. Implement canary deployments
4. Add database backup automation
5. Set up disaster recovery plan
6. Configure CDN for static assets
7. Implement feature flags
8. Set up log aggregation

## Support

For questions or issues:
- Check GitHub Actions logs
- Review workflow documentation
- Open an issue in the repository
- Contact DevOps team

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [NestJS Documentation](https://docs.nestjs.com/)
