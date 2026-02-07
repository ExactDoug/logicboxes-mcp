# LogicBoxes API — DNS Record Types & Management

## Overview

The LogicBoxes DNS management API supports full CRUD operations on the following record types: A, AAAA, CNAME, MX, TXT, NS, SRV, and SOA. Records are managed per-domain through the `dns/manage/` endpoint group.

**Important concepts:**
- Records are identified by `domain-name` + `host` + `value` (not by a unique record ID)
- Update operations require both `current-value` and `new-value` to identify and modify a record
- Delete operations require `host` + `value` to identify the record to remove
- Minimum TTL is 7200 seconds (2 hours). Some sources suggest 14400 (4 hours) — to be verified during testing.
- The `host` parameter represents the subdomain portion. Use `@` or empty string for the root domain.

## Record Types

### A Record (IPv4)
Maps a hostname to an IPv4 address.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `domain-name` | Yes | The domain (e.g., `example.com`) |
| `host` | Yes | Subdomain or `@` for root |
| `value` | Yes | IPv4 address (e.g., `192.168.1.1`) |
| `ttl` | Yes | Time to Live in seconds (min 7200) |

**API path segment**: `ipv4`
- Add: `dns/manage/add-ipv4-record.json`
- Update: `dns/manage/update-ipv4-record.json`
- Delete: `dns/manage/delete-ipv4-record.json`

**Example — Add**:
```
POST dns/manage/add-ipv4-record.json
domain-name=example.com&host=www&value=93.184.216.34&ttl=14400
```

### AAAA Record (IPv6)
Maps a hostname to an IPv6 address.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `domain-name` | Yes | The domain |
| `host` | Yes | Subdomain or `@` for root |
| `value` | Yes | IPv6 address (e.g., `2001:0db8::1`) |
| `ttl` | Yes | Time to Live in seconds (min 7200) |

**API path segment**: `ipv6`
- Add: `dns/manage/add-ipv6-record.json`
- Update: `dns/manage/update-ipv6-record.json`
- Delete: `dns/manage/delete-ipv6-record.json`

### CNAME Record
Creates an alias pointing one hostname to another.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `domain-name` | Yes | The domain |
| `host` | Yes | Alias subdomain (cannot be `@`) |
| `value` | Yes | Canonical name target (e.g., `www.example.com`) |
| `ttl` | Yes | Time to Live in seconds (min 7200) |

**API path segment**: `cname`
- Add: `dns/manage/add-cname-record.json`
- Update: `dns/manage/update-cname-record.json`
- Delete: `dns/manage/delete-cname-record.json`

**Note**: CNAME records cannot coexist with other record types for the same host.

**Example — Add**:
```
POST dns/manage/add-cname-record.json
domain-name=example.com&host=blog&value=myblog.wordpress.com&ttl=14400
```

### MX Record
Specifies mail servers for the domain.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `domain-name` | Yes | The domain |
| `host` | Yes | Subdomain or `@` for root |
| `value` | Yes | Mail server hostname (e.g., `mail.example.com`) |
| `ttl` | Yes | Time to Live in seconds (min 7200) |
| `priority` | Yes | Numeric priority (lower = higher priority, e.g., 10, 20) |

**API path segment**: `mx`
- Add: `dns/manage/add-mx-record.json`
- Update: `dns/manage/update-mx-record.json`
- Delete: `dns/manage/delete-mx-record.json`

### TXT Record
Stores arbitrary text, commonly used for SPF, DKIM, DMARC, and domain verification.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `domain-name` | Yes | The domain |
| `host` | Yes | Subdomain or `@` for root |
| `value` | Yes | Text content (e.g., `v=spf1 include:_spf.google.com ~all`) |
| `ttl` | Yes | Time to Live in seconds (min 7200) |

**API path segment**: `txt`
- Add: `dns/manage/add-txt-record.json`
- Update: `dns/manage/update-txt-record.json`
- Delete: `dns/manage/delete-txt-record.json`

**Note**: Long TXT values may need special handling. Values over 255 characters are typically split into multiple strings by the DNS system.

### NS Record
Delegates a subdomain to specific nameservers.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `domain-name` | Yes | The domain |
| `host` | Yes | Subdomain to delegate |
| `value` | Yes | Nameserver hostname (e.g., `ns1.example.com`) |
| `ttl` | Yes | Time to Live in seconds (min 7200) |

**API path segment**: `ns`
- Add: `dns/manage/add-ns-record.json`
- Update: `dns/manage/update-ns-record.json`
- Delete: `dns/manage/delete-ns-record.json`

**Note**: Root-level NS records are typically managed through the domain registrar, not through DNS record management.

### SRV Record
Specifies service location (hostname and port) for specific services.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `domain-name` | Yes | The domain |
| `host` | Yes | Service name in format `_service._protocol` (e.g., `_sip._tcp`) |
| `value` | Yes | Target hostname |
| `ttl` | Yes | Time to Live in seconds (min 7200) |
| `priority` | Yes | Priority (lower = preferred) |
| `port` | Yes | Port number |
| `weight` | Yes | Weight for load balancing among same-priority records |

**API path segment**: `srv`
- Add: `dns/manage/add-srv-record.json`
- Update: `dns/manage/update-srv-record.json`
- Delete: `dns/manage/delete-srv-record.json`

**Note**: Delete operations for SRV records also require `port` and `weight` parameters to uniquely identify the record.

### SOA Record (Update Only)
Start of Authority record. Auto-created when DNS is activated. Can be updated but not added or deleted.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `domain-name` | Yes | The domain |
| `responsible-person` | Yes | Admin email in DNS format (e.g., `admin.example.com`) |
| `refresh` | Yes | Refresh interval in seconds |
| `retry` | Yes | Retry interval in seconds |
| `expire` | Yes | Expire time in seconds |
| `ttl` | Yes | Minimum TTL in seconds |

**API path**: `dns/manage/update-soa-record.json`

## Searching Records

The search endpoint retrieves records for a domain with optional filtering.

**Endpoint**: `GET dns/manage/search-records.json`

| Parameter | Required | Description |
|-----------|----------|-------------|
| `domain-name` | Yes | The domain to query |
| `type` | Yes | Record type: `A`, `AAAA`, `CNAME`, `MX`, `TXT`, `NS`, `SRV`, `SOA` |
| `no-of-records` | Yes | Page size (max 50) |
| `page-no` | Yes | Page number (1-based) |
| `host` | No | Filter by host/subdomain |
| `value` | No | Filter by value |

### Expected Response Shape
```json
{
  "recsindb": "5",
  "recsonpage": "5",
  "1": {
    "host": "www",
    "value": "93.184.216.34",
    "ttl": "14400",
    "type": "A",
    "status": "Active"
  },
  "2": {
    "host": "@",
    "value": "93.184.216.34",
    "ttl": "14400",
    "type": "A",
    "status": "Active"
  }
}
```

**Note**: Records are returned as numbered keys (1, 2, 3...) rather than as an array. This is a quirk of the LogicBoxes API that needs to be handled in parsing. The `recsindb` field gives total count and `recsonpage` gives the count in the current page.

## CRUD Operation Summary

| Operation | HTTP Method | Identifies Record By |
|-----------|------------|---------------------|
| Search | GET | domain-name + type (optional: host, value) |
| Add | POST | N/A (creates new) |
| Update | POST | domain-name + host + current-value |
| Delete | POST | domain-name + host + value (+ port/weight for SRV) |

## Common Patterns

### Adding Multiple Records
Multiple records of the same type can exist for the same host (e.g., multiple A records for round-robin, multiple MX records with different priorities).

### Record Conflicts
- CNAME records cannot coexist with other record types for the same host
- Only one SOA record exists per domain
- Multiple A/AAAA records can exist for the same host

### TTL Values
| TTL (seconds) | Duration |
|--------------|----------|
| 7200 | 2 hours (minimum) |
| 14400 | 4 hours (common default) |
| 28800 | 8 hours |
| 43200 | 12 hours |
| 86400 | 1 day (recommended for stable records) |

## DNS Activation

Before managing DNS records for a domain, DNS service must be activated:

**Endpoint**: `POST dns/activate.json`

| Parameter | Required | Description |
|-----------|----------|-------------|
| `order-id` | Yes | The domain order ID |

This creates the DNS zone and the default SOA and NS records.
