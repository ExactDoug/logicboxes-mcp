# LogicBoxes API — Customer Endpoints (Detailed)

## Overview

Customer endpoints manage the end-user accounts in the LogicBoxes reseller hierarchy. Customers are the entities that own domains and services.

---

## Get Customer Details by Username

**GET** `customers/details.json`

Retrieves full customer details using their username (email address).

### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `auth-userid` | string | Yes | Reseller ID |
| `api-key` | string | Yes | API key |
| `username` | string | Yes | Customer's email address |

### Response
```json
{
  "customerid": "12345678",
  "username": "customer@example.com",
  "resellerid": "999999",
  "parentid": "999999",
  "name": "John Doe",
  "company": "Example Corp",
  "address1": "123 Main Street",
  "address2": "",
  "city": "Denver",
  "state": "Colorado",
  "country": "US",
  "zip": "80202",
  "phone-cc": "1",
  "phone": "5551234567",
  "langpref": "en",
  "customerstatus": "Active",
  "saleschannel": "website",
  "totalreceipts": "250.00",
  "websitecount": "3",
  "twofactorauth_enabled": "false",
  "creationdt": "2024-01-15 10:30:00"
}
```

### Notes
- Username is always an email address
- Returns error if customer not found
- Response field names use mixed conventions (camelCase and hyphenated)

---

## Get Customer Details by ID

**GET** `customers/details-by-id.json`

Retrieves full customer details using their numeric customer ID.

### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `auth-userid` | string | Yes | Reseller ID |
| `api-key` | string | Yes | API key |
| `customer-id` | string | Yes | Numeric customer ID |

### Response
Same format as "Get by Username" above.

---

## Search Customers

**POST** `customers/search.json`

Searches for customers with optional filtering and pagination.

### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `auth-userid` | string | Yes | Reseller ID |
| `api-key` | string | Yes | API key |
| `no-of-records` | integer | Yes | Records per page (max 500) |
| `page-no` | integer | Yes | Page number (1-based) |
| `customer-id` | string | No | Filter by customer ID |
| `username` | string | No | Filter by username (email) — partial match |
| `name` | string | No | Filter by name — partial match |
| `company` | string | No | Filter by company — partial match |
| `city` | string | No | Filter by city |
| `state` | string | No | Filter by state |
| `status` | string | No | Filter by status: `Active`, `Suspended`, `Deleted` |

### Response
```json
{
  "recsindb": "25",
  "recsonpage": "10",
  "1": {
    "customer.customerid": "12345678",
    "customer.username": "customer@example.com",
    "customer.name": "John Doe",
    "customer.company": "Example Corp",
    "customer.city": "Denver",
    "customer.state": "Colorado",
    "customer.country": "US",
    "customer.customerstatus": "Active",
    "customer.totalreceipts": "250.00",
    "customer.websitecount": "3",
    "customer.creationdt": "2024-01-15 10:30:00"
  },
  "2": { ... }
}
```

### Pagination
- `recsindb`: Total customers matching the query
- `recsonpage`: Customers returned in this page
- Max `no-of-records` per page: 500

### Notes
- Search results use dotted key names (e.g., `customer.customerid`) unlike detail endpoints
- Name, username, and company filters support partial matching
- Results are returned as numbered properties (same pattern as DNS search)

---

## Error Responses

```json
{
  "status": "ERROR",
  "message": "Error description"
}
```

Common errors:
- `"No Entity found"` — customer not found
- `"Invalid parameter"` — bad filter value
