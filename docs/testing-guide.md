# LogicBoxes API — Testing Guide

## Prerequisites

Before testing the LogicBoxes API, you need:

1. **A LogicBoxes Reseller Account** — with API access enabled
2. **Your Reseller ID** (`auth-userid`) — found in your Reseller Profile Details
3. **Your API Key** (`api-key`) — found at Settings → API → "View API key"
4. **IP Address Whitelisted** — your current IP must be registered in Settings → API → IP Addresses

## Environment Setup

### Credentials File

Create a `.env` file in the project root (never commit this to git):

```env
LOGICBOXES_AUTH_USERID=your-reseller-id-here
LOGICBOXES_API_KEY=your-api-key-here
LOGICBOXES_ENV=production
```

**Environment values:**
- `production` — uses `https://httpapi.com/api/` (your live account)
- `test` — uses `https://test.httpapi.com/api/` (demo/sandbox)

> **Warning**: If using `test` environment, you should use demo account credentials. Using production credentials with the test URL can still affect your live account!

### IP Whitelisting

1. Log into your LogicBoxes control panel
2. Navigate to Settings → API → IP Addresses
3. Add the IP address of the machine that will make API requests
4. Up to 3 IPs can be registered (contact support for more)
5. Changes take effect immediately

To find your current public IP:
```bash
curl -s https://ifconfig.me
```

## Connectivity Test

### Quick curl test

Verify your credentials and IP whitelisting work:

```bash
# Replace with your actual credentials
AUTH_USERID="your-reseller-id"
API_KEY="your-api-key"
BASE_URL="https://httpapi.com/api"

# Simple domain search (should return results or empty list)
curl -s "$BASE_URL/domains/search.json?auth-userid=$AUTH_USERID&api-key=$API_KEY&no-of-records=1&page-no=1" | python3 -m json.tool
```

**Expected success**: JSON response with domain data or empty result set
**Expected failure**: Error JSON with authentication or IP whitelisting message

### Common connectivity issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Connection refused / timeout | IP not whitelisted | Add IP in control panel |
| `{"status": "ERROR", "message": "...authentication..."}` | Wrong credentials | Verify auth-userid and api-key |
| SSL/TLS error | Using HTTP instead of HTTPS | Always use `https://` |
| Empty response | Possible rate limit | Wait and retry |

## Testing Workflow

### Phase 1: Authentication

Run the auth test script:
```bash
npm run test:auth
```

This verifies:
- Credentials are valid
- IP is whitelisted
- API is reachable
- JSON responses parse correctly

### Phase 2: Customer Endpoints

Run the customer test script:
```bash
npm run test:customers
```

Tests:
1. `customers/search.json` — list customers with pagination
2. `customers/details-by-id.json` — get a specific customer by ID (using one from search results)
3. `customers/details.json` — get a customer by username/email

**What to verify:**
- Response shape matches our TypeScript types
- Pagination fields (`recsindb`, `recsonpage`) are present
- Customer fields (`customerid`, `username`, `name`, `company`, `status`) are populated
- Dotted key names in search results (e.g., `customer.customerid`)

### Phase 3: Domain Endpoints

Run the domain test script:
```bash
npm run test:domains
```

Tests:
1. `domains/search.json` — list all domains
2. `domains/search.json` with `customer-id` filter — list domains for a specific customer
3. `domains/orderid.json` — get order ID for a known domain
4. `domains/details.json` — get domain details by order ID
5. `domains/details-by-name.json` — get domain details by name

**What to verify:**
- Search returns expected domains
- Order ID lookup works
- Domain details include nameservers, status, timestamps
- Dotted key names in search results (e.g., `orders.orderid`, `entity.domainname`)

### Phase 4: DNS Record Endpoints

Run the DNS test script:
```bash
npm run test:dns
```

This performs a full CRUD cycle on a safe record type (TXT):

1. **Search** — List existing records for a domain
2. **Add** — Create a TXT record (e.g., `_test-logicboxes-mcp` with value `test-value-timestamp`)
3. **Verify Add** — Search again to confirm the record exists
4. **Update** — Change the TXT record value
5. **Verify Update** — Search again to confirm the new value
6. **Delete** — Remove the test TXT record
7. **Verify Delete** — Search again to confirm the record is gone

**What to verify:**
- All CRUD operations return success
- Search response shape (numbered keys, `recsindb`, `recsonpage`)
- Record fields (`host`, `value`, `ttl`, `type`, `status`)
- Update requires `current-value` and `new-value`
- Minimum TTL is enforced (test with values below 7200)

**Important**: Use a test subdomain (like `_test-logicboxes-mcp`) that won't conflict with real DNS records.

## Documenting Discrepancies

During testing, watch for any differences between our documented API behavior and actual responses:

- Unexpected field names or formats
- Different pagination patterns
- Additional or missing response fields
- HTTP method requirements that differ from docs
- Parameter naming differences
- TTL minimum enforcement behavior
- Error message formats

Document any discrepancies in `docs/api-discrepancies.md`.

## Demo/Sandbox Account (Optional)

If you want a separate test environment:

1. Go to `https://demoserver.supersite2.myorderbox.com/login.php`
2. Create a demo reseller account
3. Get demo API credentials
4. Use with `LOGICBOXES_ENV=test` (which uses `test.httpapi.com`)

**Note**: The demo environment has its own data — production domains won't appear there.

## Script Output

All test scripts should:
- Print clear step-by-step progress
- Show raw API responses for documentation
- Report success/failure for each operation
- Log any unexpected response shapes
- Exit with code 0 on success, 1 on failure
