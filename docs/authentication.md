# LogicBoxes API — Authentication & Connectivity

## Base URLs

- **Production**: `https://httpapi.com/api/`
- **Test/Sandbox**: `https://test.httpapi.com/api/`

Important notes:
- The test URL should only be used for development/testing
- CRITICAL WARNING: Using Live Account credentials with the test URL will still perform actions in production! Always use Demo Account credentials with the test URL.
- All endpoints use the `.json` suffix for JSON responses (e.g., `domains/search.json`)

## Authentication

Every API request requires two query parameters:

| Parameter | Description |
|-----------|-------------|
| `auth-userid` | Your Reseller ID (numeric). Found in the Reseller Profile Details view (first field). |
| `api-key` | Alphanumeric API key. Found at: Menu → Settings → API → "View API key" link. |

There are no session tokens, OAuth flows, or bearer tokens. Authentication is purely per-request via query parameters.

### Example Request
```
GET https://httpapi.com/api/domains/search.json?auth-userid=123456&api-key=abc123def456&no-of-records=10&page-no=1
```

## IP Whitelisting

**Mandatory requirement**: You MUST register your IP addresses in the LogicBoxes control panel before making any API requests. The API will reject requests from non-whitelisted IPs.

- Navigate to: Settings → API → IP Addresses
- Up to 3 IPs can be registered (contact support for more)
- Both IPv4 and IPv6 are supported
- Changes take effect immediately

## HTTPS Requirement

All API requests MUST use HTTPS. HTTP requests will be rejected.

## HTTP Methods

- **GET**: Used for all read/query operations (search, details, lookups)
- **POST**: Used for all write operations (create, modify, delete)
- GET parameters are sent as query string parameters
- POST parameters are sent as `application/x-www-form-urlencoded` form data
- Auth parameters (`auth-userid`, `api-key`) are always sent as query parameters, even on POST requests

## Response Format

All responses are JSON. The API uses the `.json` suffix on endpoint paths to indicate JSON format.

### Success Responses
Vary by endpoint. Some return objects, some return arrays, some return simple values (like order IDs as strings).

### Error Responses
```json
{
  "status": "ERROR",
  "message": "Description of what went wrong"
}
```

Common error scenarios:
- Invalid or missing auth credentials
- IP not whitelisted
- Missing required parameters
- Resource not found
- Invalid parameter values

## Demo/Sandbox Account

For testing without affecting production data:

1. Create a demo account at: `https://demoserver.supersite2.myorderbox.com/login.php`
2. Use demo credentials with the test URL (`https://test.httpapi.com/api/`)
3. The demo environment has its own reseller ID and API key
4. Create demo customer accounts for testing workflows

**Important**: Demo accounts are separate from production. You cannot use production credentials on the demo environment or vice versa safely.

## Rate Limits

- The HTTP API is available for free with standard usage
- Subject to rate limits on request volume (exact limits not publicly documented)
- For high-volume requirements, contact LogicBoxes support
- No per-endpoint rate limit headers are returned in responses

## Compatible Platforms

The LogicBoxes API is shared across multiple domain registrar brands. The same API endpoints and authentication mechanism work for:
- **LogicBoxes** (primary platform)
- **ResellerClub** (major brand on LogicBoxes)
- **NetEarthOne**
- **Resell.biz**
- **Directi**

Documentation from ResellerClub (manage.resellerclub.com/kb) is fully applicable to LogicBoxes and vice versa.

## Quick Connectivity Test

To verify your credentials and IP whitelisting work:

```bash
curl "https://httpapi.com/api/domains/search.json?auth-userid=YOUR_ID&api-key=YOUR_KEY&no-of-records=1&page-no=1"
```

A successful response returns domain data (or an empty list). An error response indicates credential or IP whitelisting issues.
