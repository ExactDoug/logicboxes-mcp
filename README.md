# logicboxes-mcp

MCP server and API client for the LogicBoxes domain registration and DNS hosting platform.

## Features

- 11 MCP tools (6 DNS, 2 customer, 3 domain)
- Full DNS record CRUD (A, AAAA, CNAME, MX, TXT, NS, SRV)
- Customer and domain search with pagination
- Standalone TypeScript API client (usable without MCP)
- DNS backup utility
- Node 18+ with native fetch (no external HTTP dependencies)

## Quick Start

### Prerequisites

- Node.js 18+
- LogicBoxes reseller account with API access
- API key and reseller ID
- IP address whitelisted in LogicBoxes control panel

### Install

```bash
git clone https://github.com/ExactDoug/logicboxes-mcp.git
cd logicboxes-mcp
npm install
```

### Configure

```bash
cp .env.example .env
# Edit .env with your credentials
```

### Add to Claude Code

Add to your `.mcp.json` (project-level or `~/.claude/.mcp.json` for global):

```json
{
  "mcpServers": {
    "logicboxes": {
      "command": "npx",
      "args": ["tsx", "/path/to/logicboxes-mcp/src/server/index.ts"],
      "cwd": "/path/to/logicboxes-mcp"
    }
  }
}
```

Replace `/path/to/logicboxes-mcp` with the absolute path to your clone.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `LOGICBOXES_AUTH_USERID` | Yes | Reseller account ID |
| `LOGICBOXES_API_KEY` | Yes | API key from LogicBoxes control panel |
| `LOGICBOXES_ENV` | No | Set to `test` to use OTE sandbox (default: production) |

## Tools Reference

### DNS Tools (6)

**`list_dns_records`** -- Search DNS records for a domain, filtered by record type and optional host/value. Returns a paginated table of matching records.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | Fully qualified domain name (e.g. "example.com") |
| `type` | enum | Yes | DNS record type: A, AAAA, CNAME, MX, TXT, NS, SRV, SOA |
| `host` | string | No | Filter by hostname/subdomain (e.g. "www", "mail") |
| `value` | string | No | Filter by record value (e.g. IP address, hostname) |
| `pageNo` | number | No | Page number, starting from 1 (default 1) |

**`list_all_dns_records`** -- Get ALL DNS records for a domain across every record type (A, AAAA, CNAME, MX, TXT, NS, SRV, SOA). Returns records grouped by type. Use this to see the complete DNS zone.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | Fully qualified domain name (e.g. "example.com") |

**`add_dns_record`** -- Add a new DNS record to a domain zone. Supports A, AAAA, CNAME, MX, TXT, NS, and SRV records (SOA records cannot be added).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | Fully qualified domain name (e.g. "example.com") |
| `type` | enum | Yes | DNS record type to add: A, AAAA, CNAME, MX, TXT, NS, SRV |
| `host` | string | Yes | Hostname / subdomain (use "@" for zone apex) |
| `value` | string | Yes | Record value (IP address, hostname, TXT content, etc.) |
| `ttl` | number | No | Time-to-live in seconds (minimum 7200, default 14400) |
| `priority` | number | No | Priority (required for MX and SRV records) |
| `port` | number | No | Port number (required for SRV records) |
| `weight` | number | No | Relative weight (required for SRV records) |

**`update_dns_record`** -- Update an existing DNS record in a domain zone. Identifies the record by host + currentValue, then replaces the value. SOA records cannot be updated.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | Fully qualified domain name (e.g. "example.com") |
| `type` | enum | Yes | DNS record type to update: A, AAAA, CNAME, MX, TXT, NS, SRV |
| `host` | string | Yes | Hostname / subdomain of the record to update |
| `currentValue` | string | Yes | Current record value (identifies which record to update) |
| `newValue` | string | Yes | New record value to replace the current one |
| `ttl` | number | No | Time-to-live in seconds (minimum 7200, default 14400) |
| `priority` | number | No | Priority (for MX and SRV records) |
| `port` | number | No | Port number (for SRV records) |
| `weight` | number | No | Relative weight (for SRV records) |

**`delete_dns_record`** -- Delete a DNS record from a domain zone. Identifies the record by host + value. SOA records cannot be deleted.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | Fully qualified domain name (e.g. "example.com") |
| `type` | enum | Yes | DNS record type to delete: A, AAAA, CNAME, MX, TXT, NS, SRV |
| `host` | string | Yes | Hostname / subdomain of the record to delete |
| `value` | string | Yes | Record value (identifies which record to delete) |
| `port` | number | No | Port number (required for SRV records) |
| `weight` | number | No | Relative weight (required for SRV records) |

**`activate_dns`** -- Activate DNS hosting for a domain order. Must be called after purchasing DNS hosting before DNS records can be managed.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderId` | string | Yes | Order ID for the DNS hosting product |

### Customer Tools (2)

**`list_customers`** -- Search and list customers under the reseller account with optional filters. Returns a paginated table of customers with ID, username, name, company, and status.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pageNo` | number | No | Page number, starting from 1 (default 1) |
| `noOfRecords` | number | No | Results per page (10-500, default 25) |
| `username` | string | No | Filter by customer email/username (partial match supported) |
| `name` | string | No | Filter by customer name (partial match supported) |
| `company` | string | No | Filter by company name (partial match supported) |
| `status` | string | No | Filter by customer status: Active, InActive, Suspended, etc. |

**`get_customer`** -- Get detailed customer information by customer ID or username (email). Returns full contact details, address, phone, and account status. Provide either username or customerId.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | No* | Customer email/username. Provide either username or customerId. |
| `customerId` | string | No* | Customer ID number. Provide either username or customerId. |

### Domain Tools (3)

**`list_domains`** -- Search and list domains under the reseller account with optional filters. Returns a paginated table of domains with order ID, name, status, and expiry date.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pageNo` | number | No | Page number, starting from 1 (default 1) |
| `noOfRecords` | number | No | Results per page (10-500, default 25) |
| `customerId` | string | No | Filter by customer ID to show only that customer's domains |
| `domainName` | string | No | Filter by domain name (partial match supported) |
| `status` | string | No | Filter by domain status: Active, InActive, Deleted, Archived, etc. |

**`get_domain`** -- Get detailed domain information by order ID or domain name. Returns registration dates, nameservers, status, and contact details. Provide either orderId or domainName.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderId` | string | No* | Domain order ID. Provide either orderId or domainName. |
| `domainName` | string | No* | Domain name (e.g. "example.com"). Provide either orderId or domainName. |

**`get_domain_order_id`** -- Look up the order ID for a domain by its fully qualified domain name. Use this when you have a domain name and need the order ID for other API calls.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domainName` | string | Yes | Fully qualified domain name (e.g. "example.com") |

## API Client Library

The `src/api/` directory is a standalone TypeScript API client that can be used independently of the MCP server:

```typescript
import { LogicBoxesClient, DnsApi, CustomerApi, DomainApi } from './src/api/index.js';

const client = new LogicBoxesClient({
  authUserId: 'your-reseller-id',
  apiKey: 'your-api-key',
});

const dnsApi = new DnsApi(client);
const records = await dnsApi.searchAllRecords('example.com');

const customerApi = new CustomerApi(client);
const customers = await customerApi.search({});

const domainApi = new DomainApi(client);
const domains = await domainApi.search({});
```

## DNS Backup

```bash
# Backup all DNS records for a domain
npm run backup:dns                         # uses LOGICBOXES_TEST_DOMAIN from .env
npx tsx scripts/backup-dns.ts example.com  # specify domain
```

Backups are saved to `backups/{domain}/dns-backup-{date}.json` and committed to git as a safety measure. Always run a backup before modifying DNS records.

## Development

```bash
npm run build           # Compile TypeScript
npm run dev             # Run MCP server in dev mode (tsx)
npm run test:auth       # Verify API credentials
npm run test:customers  # Test customer endpoints
npm run test:domains    # Test domain endpoints
npm run test:dns        # Test DNS CRUD operations
```

### Project Structure

```
src/
├── api/              # Standalone API client (no MCP dependency)
│   ├── client.ts     # HTTP client with auth
│   ├── dns.ts        # DNS record operations
│   ├── customers.ts  # Customer operations
│   ├── domains.ts    # Domain operations
│   ├── types.ts      # TypeScript interfaces and constants
│   ├── errors.ts     # Error classes
│   └── index.ts      # Public exports
└── server/           # MCP server
    ├── index.ts      # Entry point
    └── tools/        # Tool implementations
        ├── dns.ts
        ├── customers.ts
        └── domains.ts
scripts/              # Test and utility scripts
docs/                 # API documentation
backups/              # DNS record backups
```

## API Documentation

Detailed API documentation is available in the `docs/` directory:

- `docs/api-reference.md` -- Complete endpoint reference
- `docs/authentication.md` -- Auth setup and IP whitelisting
- `docs/dns-records.md` -- DNS record types and parameters
- `docs/endpoints-dns.md` -- DNS endpoint documentation
- `docs/endpoints-customers.md` -- Customer endpoint documentation
- `docs/endpoints-domains.md` -- Domain endpoint documentation
- `docs/testing-guide.md` -- Testing procedures and safety guidelines

## License

MIT
