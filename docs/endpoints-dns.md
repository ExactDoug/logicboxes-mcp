# LogicBoxes API — DNS Endpoints (Detailed)

## Activate DNS Service

**POST** `dns/activate.json`

Activates DNS hosting for a domain order. Must be called before DNS records can be managed.

### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `auth-userid` | string | Yes | Reseller ID |
| `api-key` | string | Yes | API key |
| `order-id` | string | Yes | Domain order ID |

### Response
Success: `{"status": "Success"}`

---

## Search DNS Records

**GET** `dns/manage/search-records.json`

Retrieves DNS records for a domain with filtering and pagination.

### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `auth-userid` | string | Yes | Reseller ID |
| `api-key` | string | Yes | API key |
| `domain-name` | string | Yes | Domain name (e.g., `example.com`) |
| `type` | string | Yes | Record type: `A`, `AAAA`, `CNAME`, `MX`, `TXT`, `NS`, `SRV`, `SOA` |
| `no-of-records` | integer | Yes | Records per page (max 50) |
| `page-no` | integer | Yes | Page number (1-based) |
| `host` | string | No | Filter by hostname |
| `value` | string | No | Filter by record value |

### Response Format
Records are returned as numbered properties (not an array):
```json
{
  "recsindb": "3",
  "recsonpage": "3",
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
  },
  "3": {
    "host": "mail",
    "value": "93.184.216.35",
    "ttl": "14400",
    "type": "A",
    "status": "Active"
  }
}
```

### Pagination
- `recsindb`: Total records in database matching the query
- `recsonpage`: Number of records returned on this page
- Request more pages by incrementing `page-no`
- Max `no-of-records` per page: 50

---

## Add DNS Records

All add operations use **POST**.

### Common Parameters (all record types)
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `auth-userid` | string | Yes | Reseller ID |
| `api-key` | string | Yes | API key |
| `domain-name` | string | Yes | Domain name |
| `host` | string | Yes | Hostname / subdomain (`@` for root) |
| `value` | string | Yes | Record value |
| `ttl` | integer | Yes | TTL in seconds (min 7200) |

### Type-Specific Parameters

**MX records** (`dns/manage/add-mx-record.json`):
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `priority` | integer | Yes | MX priority (lower = higher priority) |

**SRV records** (`dns/manage/add-srv-record.json`):
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `priority` | integer | Yes | SRV priority |
| `port` | integer | Yes | Service port number |
| `weight` | integer | Yes | Load balancing weight |

### Endpoints by Record Type
| Type | Endpoint |
|------|----------|
| A | `dns/manage/add-ipv4-record.json` |
| AAAA | `dns/manage/add-ipv6-record.json` |
| CNAME | `dns/manage/add-cname-record.json` |
| MX | `dns/manage/add-mx-record.json` |
| TXT | `dns/manage/add-txt-record.json` |
| NS | `dns/manage/add-ns-record.json` |
| SRV | `dns/manage/add-srv-record.json` |

### Response
Success: `{"status": "Success"}`

---

## Update DNS Records

All update operations use **POST**. Records are identified by domain + host + current-value.

### Common Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `auth-userid` | string | Yes | Reseller ID |
| `api-key` | string | Yes | API key |
| `domain-name` | string | Yes | Domain name |
| `host` | string | Yes | Hostname / subdomain |
| `current-value` | string | Yes | Current record value (identifies the record) |
| `new-value` | string | Yes | New value to set |
| `ttl` | integer | Yes | New TTL in seconds (min 7200) |

### Type-Specific Parameters (same as add)
- **MX**: `priority`
- **SRV**: `priority`, `port`, `weight`

### SOA Record Update
Special endpoint: `dns/manage/update-soa-record.json`
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain-name` | string | Yes | Domain name |
| `responsible-person` | string | Yes | Admin email in DNS format |
| `refresh` | integer | Yes | Refresh interval (seconds) |
| `retry` | integer | Yes | Retry interval (seconds) |
| `expire` | integer | Yes | Expire time (seconds) |
| `ttl` | integer | Yes | Minimum TTL (seconds) |

### Endpoints by Record Type
| Type | Endpoint |
|------|----------|
| A | `dns/manage/update-ipv4-record.json` |
| AAAA | `dns/manage/update-ipv6-record.json` |
| CNAME | `dns/manage/update-cname-record.json` |
| MX | `dns/manage/update-mx-record.json` |
| TXT | `dns/manage/update-txt-record.json` |
| NS | `dns/manage/update-ns-record.json` |
| SRV | `dns/manage/update-srv-record.json` |
| SOA | `dns/manage/update-soa-record.json` |

### Response
Success: `{"status": "Success"}`

---

## Delete DNS Records

All delete operations use **POST**. Records are identified by domain + host + value.

### Common Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `auth-userid` | string | Yes | Reseller ID |
| `api-key` | string | Yes | API key |
| `domain-name` | string | Yes | Domain name |
| `host` | string | Yes | Hostname / subdomain |
| `value` | string | Yes | Record value (identifies the record) |

### Type-Specific Parameters
**SRV records** also require:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `port` | integer | Yes | Port number |
| `weight` | integer | Yes | Weight value |

### Endpoints by Record Type
| Type | Endpoint |
|------|----------|
| A | `dns/manage/delete-ipv4-record.json` |
| AAAA | `dns/manage/delete-ipv6-record.json` |
| CNAME | `dns/manage/delete-cname-record.json` |
| MX | `dns/manage/delete-mx-record.json` |
| TXT | `dns/manage/delete-txt-record.json` |
| NS | `dns/manage/delete-ns-record.json` |
| SRV | `dns/manage/delete-srv-record.json` |

### Response
Success: `{"status": "Success"}`

---

## Error Responses

All DNS endpoints may return:
```json
{
  "status": "ERROR",
  "message": "Error description"
}
```

Common errors:
- `"No Entity found"` — domain not found or DNS not activated
- `"Invalid value"` — malformed IP address or hostname
- `"Record already exists"` — duplicate record
- `"No record found"` — record to update/delete not found
