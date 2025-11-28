# Local API Testing

Guide for testing backend API endpoints locally with authentication.

## The Shell Escaping Problem

When making curl requests with special characters in passwords (like `!`, `$`, `@`), bash interprets them as special characters, causing errors.

**Common errors:**
```bash
# This FAILS - bash interprets ! and $ specially
curl -d '{"email":"user@test.com","password":"270176As!"}' ...
# Error: bash: !: event not found

# This also FAILS - variable substitution issues
curl -d "{\"password\":\"$PASS\"}" ...
```

## Solution: File-Based JSON Input

**Step 1: Write credentials to file**

Create `/tmp/login.json` with login credentials:
```json
{"email":"stepun+2@gmail.com","password":"270176As!"}
```

Use the Write tool in Claude Code to create this file - avoids all escaping issues.

**Step 2: Login and save response**

```bash
curl -s "http://localhost:3000/api/v1/auth/login" \
  -X POST \
  -H "Content-Type: application/json" \
  -d @/tmp/login.json > /tmp/auth_resp.json
```

**Step 3: View response**

```bash
cat /tmp/auth_resp.json
```

Response structure:
```json
{
  "user": {
    "id": "uuid",
    "email": "...",
    "role": "merchant|customer",
    ...
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Step 4: Make authenticated requests**

Copy the `accessToken` value and use it:

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# GET request
curl -s "http://localhost:3000/api/v1/merchant/dashboard/analytics" \
  -H "Authorization: Bearer $TOKEN"

# POST request with JSON body
curl -s "http://localhost:3000/api/v1/cart/items" \
  -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @/tmp/request.json
```

## Quick Reference

### Test Accounts

After seeding (`npm run seed`):
- **Customer**: customer@test.com / test123
- **Merchant**: merchant@test.com / test123

### Common Endpoints

```bash
# Health check (no auth)
curl http://localhost:3000/api/health

# Login
curl -s "http://localhost:3000/api/v1/auth/login" -X POST -H "Content-Type: application/json" -d @/tmp/login.json

# Get products (public)
curl http://localhost:3000/api/v1/catalog/products

# Get cart (needs x-session-id for guests)
curl http://localhost:3000/api/v1/cart -H "x-session-id: test-session-123"

# Merchant analytics (needs auth)
curl "http://localhost:3000/api/v1/merchant/dashboard/analytics?startDate=2025-11-01&endDate=2025-11-26" \
  -H "Authorization: Bearer $TOKEN"
```

### Token Expiration

- **Access token**: 15 minutes (configurable in JWT_EXPIRATION)
- **Refresh token**: 30 days

If access token expires, login again or use refresh endpoint:
```bash
curl -s "http://localhost:3000/api/v1/auth/refresh" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token>"}'
```

## Workflow for Claude Code

When testing API endpoints:

1. **Use Write tool** to create JSON files in `/tmp/`:
   - `/tmp/login.json` - login credentials
   - `/tmp/request.json` - request body for POST/PUT

2. **Use Bash tool** for curl commands with `-d @/tmp/file.json`

3. **Save responses** to files for inspection:
   ```bash
   curl ... > /tmp/response.json
   ```

4. **Read responses** with Read tool or `cat`

This approach:
- Avoids all shell escaping issues
- Works with any special characters in passwords
- Keeps credentials/tokens in temporary files
- Easy to inspect and debug

## Temporary Files Used

| File | Purpose |
|------|---------|
| `/tmp/login.json` | Login credentials |
| `/tmp/auth_resp.json` | Login response with tokens |
| `/tmp/request.json` | Generic request body |
| `/tmp/merchant_token.txt` | Saved token for reuse |

## Related

- See `modules/auth.md` for authentication architecture
- See `development/commands.md` for npm scripts
- See `01-quickstart.md` for test accounts
