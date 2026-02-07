# LogicBoxes API — Endpoint Reference

## Overview

Base URL: `https://httpapi.com/api/` (production) or `https://test.httpapi.com/api/` (test)

All endpoints require `auth-userid` and `api-key` query parameters. All endpoints use `.json` suffix.

## DNS Management

### Activate DNS Service
| | |
|---|---|
| **Method** | POST |
| **Path** | `dns/activate.json` |
| **Parameters** | `order-id` (required) — the domain order ID |
| **Returns** | Success status |

### Search DNS Records
| | |
|---|---|
| **Method** | GET |
| **Path** | `dns/manage/search-records.json` |
| **Parameters** | `domain-name` (required), `type` (required — A, AAAA, CNAME, MX, TXT, NS, SRV, SOA), `no-of-records` (required, max 50), `page-no` (required, 1-based), `host` (optional), `value` (optional) |
| **Returns** | Record list with count and pagination |

### Add DNS Record
| | |
|---|---|
| **Method** | POST |
| **Path** | `dns/manage/add-{type}-record.json` |
| **Types** | `ipv4` (A), `ipv6` (AAAA), `cname`, `mx`, `txt`, `ns`, `srv` |

Common parameters for all add operations:
- `domain-name` (required) — the domain name
- `value` (required) — record value (IP address, hostname, text, etc.)
- `host` (required) — subdomain/host part (use `@` for root, or subdomain name)
- `ttl` (required) — Time to Live in seconds (minimum 7200)

Additional parameters by type:
- **MX**: `priority` (required)
- **SRV**: `priority` (required), `port` (required), `weight` (required)

Full endpoint paths:
- `dns/manage/add-ipv4-record.json` — A record
- `dns/manage/add-ipv6-record.json` — AAAA record
- `dns/manage/add-cname-record.json` — CNAME record
- `dns/manage/add-mx-record.json` — MX record
- `dns/manage/add-txt-record.json` — TXT record
- `dns/manage/add-ns-record.json` — NS record
- `dns/manage/add-srv-record.json` — SRV record

### Update DNS Record
| | |
|---|---|
| **Method** | POST |
| **Path** | `dns/manage/update-{type}-record.json` |
| **Types** | Same as add: `ipv4`, `ipv6`, `cname`, `mx`, `txt`, `ns`, `srv` |

Common parameters:
- `domain-name` (required)
- `host` (required)
- `current-value` (required) — existing value to identify the record
- `new-value` (required) — replacement value
- `ttl` (required) — minimum 7200

Additional parameters by type:
- **MX**: `priority` (required)
- **SRV**: `priority` (required), `port` (required), `weight` (required)

**Note**: Records are identified by host + current-value (not by an ID). The update operation replaces the value.

Special case — **SOA record update**:
| | |
|---|---|
| **Path** | `dns/manage/update-soa-record.json` |
| **Parameters** | `domain-name`, `responsible-person`, `refresh`, `retry`, `expire`, `ttl` |

Full endpoint paths:
- `dns/manage/update-ipv4-record.json`
- `dns/manage/update-ipv6-record.json`
- `dns/manage/update-cname-record.json`
- `dns/manage/update-mx-record.json`
- `dns/manage/update-txt-record.json`
- `dns/manage/update-ns-record.json`
- `dns/manage/update-srv-record.json`
- `dns/manage/update-soa-record.json`

### Delete DNS Record
| | |
|---|---|
| **Method** | POST |
| **Path** | `dns/manage/delete-{type}-record.json` |
| **Types** | Same as add: `ipv4`, `ipv6`, `cname`, `mx`, `txt`, `ns`, `srv` |

Common parameters:
- `domain-name` (required)
- `host` (required)
- `value` (required) — identifies which record to delete

Additional parameters:
- **SRV**: `port` (required), `weight` (required)

Full endpoint paths:
- `dns/manage/delete-ipv4-record.json`
- `dns/manage/delete-ipv6-record.json`
- `dns/manage/delete-cname-record.json`
- `dns/manage/delete-mx-record.json`
- `dns/manage/delete-txt-record.json`
- `dns/manage/delete-ns-record.json`
- `dns/manage/delete-srv-record.json`

---

## Customer Management

### Get Customer by Username (Email)
| | |
|---|---|
| **Method** | GET |
| **Path** | `customers/details.json` |
| **Parameters** | `username` (required) — customer's email address |
| **Returns** | Customer details object |

### Get Customer by ID
| | |
|---|---|
| **Method** | GET |
| **Path** | `customers/details-by-id.json` |
| **Parameters** | `customer-id` (required) — numeric customer ID |
| **Returns** | Customer details object |

### Search Customers
| | |
|---|---|
| **Method** | POST |
| **Path** | `customers/search.json` |
| **Parameters** | `no-of-records` (required, max 500), `page-no` (required, 1-based), `customer-id` (opt), `username` (opt), `name` (opt), `company` (opt), `city` (opt), `state` (opt), `status` (opt — Active, Suspended, etc.) |
| **Returns** | Paginated customer list with count |

---

## Domain Management

### Search Domains
| | |
|---|---|
| **Method** | GET |
| **Path** | `domains/search.json` |
| **Parameters** | `no-of-records` (required, 10-500), `page-no` (required, 1-based), `customer-id` (opt), `reseller-id` (opt), `domain-name` (opt), `status` (opt — Active, InActive, Deleted, etc.), `order-by` (opt), `expiry-date-start` (opt, UNIX timestamp), `expiry-date-end` (opt, UNIX timestamp) |
| **Returns** | Paginated domain list with count |

### Get Domain Details by Order ID
| | |
|---|---|
| **Method** | GET |
| **Path** | `domains/details.json` |
| **Parameters** | `order-id` (required), `options` (opt — comma-separated list: All, NsDetails, ContactIds, RegistrantContactDetails, AdminContactDetails, TechContactDetails, BillingContactDetails, DomainStatus) |
| **Returns** | Domain details object |

### Get Domain Details by Name
| | |
|---|---|
| **Method** | GET |
| **Path** | `domains/details-by-name.json` |
| **Parameters** | `domain-name` (required), `options` (opt — same as above) |
| **Returns** | Domain details object |

### Get Order ID from Domain Name
| | |
|---|---|
| **Method** | GET |
| **Path** | `domains/orderid.json` |
| **Parameters** | `domain-name` (required) |
| **Returns** | Order ID (string/number) |

---

## Pagination

Most list/search endpoints use a consistent pagination pattern:

| Parameter | Description |
|-----------|-------------|
| `no-of-records` | Page size. Maximum varies by endpoint (50 for DNS, 500 for customers/domains). |
| `page-no` | Page number, 1-based. |

Response includes:
- `recsindb` or similar count field — total records matching the query
- `recsonpage` or similar — records returned in this page
- The actual data records

## Common Response Fields

### Domain Details Response
Key fields typically returned:
- `orderid` — unique order identifier
- `domainname` — the domain name
- `currentstatus` — Active, InActive, Deleted, etc.
- `endtime` — expiry timestamp
- `creationtime` — registration timestamp
- `autorenew` — boolean
- `customerId` — owning customer

### Customer Details Response
Key fields typically returned:
- `customerid` — unique ID
- `username` — email address
- `name` — full name
- `company` — company name
- `city`, `state`, `country` — location
- `status` — Active, Suspended, etc.
- `totalreceipts` — billing total
