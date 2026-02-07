# LogicBoxes API — Domain Endpoints (Detailed)

## Overview

Domain endpoints retrieve information about domain name registrations in the reseller's account. These are read-only operations for our MVP scope (we're not implementing domain registration, transfer, or modification through the MCP server).

---

## Search Domains

**GET** `domains/search.json`

Searches for domains with optional filtering and pagination.

### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `auth-userid` | string | Yes | Reseller ID |
| `api-key` | string | Yes | API key |
| `no-of-records` | integer | Yes | Records per page (10-500) |
| `page-no` | integer | Yes | Page number (1-based) |
| `customer-id` | string | No | Filter by customer ID |
| `reseller-id` | string | No | Filter by reseller ID |
| `domain-name` | string | No | Filter by domain name — partial match |
| `status` | string | No | Filter by status |
| `privacy-enabled` | string | No | Filter by privacy protection |
| `order-by` | string | No | Sort field |
| `creation-date-start` | string | No | Filter by creation date (UNIX timestamp) |
| `creation-date-end` | string | No | Filter by creation date (UNIX timestamp) |
| `expiry-date-start` | string | No | Filter by expiry date (UNIX timestamp) |
| `expiry-date-end` | string | No | Filter by expiry date (UNIX timestamp) |

### Response
```json
{
  "recsindb": "15",
  "recsonpage": "10",
  "1": {
    "orders.orderid": "87654321",
    "entity.domainname": "example.com",
    "entity.currentstatus": "Active",
    "entity.endtime": "1735689600",
    "entity.creationtime": "1672531200",
    "orders.customerid": "12345678",
    "orders.resellerId": "999999",
    "entity.description": "example.com",
    "entity.autorenew": "true"
  },
  "2": { ... }
}
```

### Status Values
- `Active` — currently registered and active
- `InActive` — not active
- `Deleted` — domain deleted
- `Archived` — archived domain
- `Suspended` — suspended by registrar
- `Fraud` — flagged for fraud
- `AwaitingPaymentConfirmation` — pending payment
- Other statuses may exist

### Pagination
- `recsindb`: Total domains matching the query
- `recsonpage`: Domains returned in this page
- Max `no-of-records` per page: 500

### Notes
- Search results use dotted key names (e.g., `orders.orderid`, `entity.domainname`)
- Results are returned as numbered properties
- Timestamps are UNIX epoch seconds
- The `customer-id` filter is crucial for listing domains belonging to a specific customer

---

## Get Domain Details by Order ID

**GET** `domains/details.json`

Retrieves comprehensive details about a domain registration.

### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `auth-userid` | string | Yes | Reseller ID |
| `api-key` | string | Yes | API key |
| `order-id` | string | Yes | Domain order ID |
| `options` | string | No | Comma-separated detail sections to include |

### Options Values
- `All` — include all available details
- `NsDetails` — nameserver information
- `ContactIds` — contact record IDs
- `RegistrantContactDetails` — full registrant contact
- `AdminContactDetails` — admin contact details
- `TechContactDetails` — tech contact details
- `BillingContactDetails` — billing contact details
- `DomainStatus` — detailed status information

### Response
```json
{
  "orderid": "87654321",
  "domainname": "example.com",
  "currentstatus": "Active",
  "endtime": "1735689600",
  "creationtime": "1672531200",
  "customerid": "12345678",
  "autorenew": "true",
  "description": "example.com",
  "isprivacyprotected": "false",
  "isOrderSuspendedUponExpiry": "false",
  "orderSuspendedByParent": "false",
  "ns1": "ns1.logicboxes.com",
  "ns2": "ns2.logicboxes.com",
  "cns": {},
  "registrantcontact": { ... },
  "admincontact": { ... },
  "techcontact": { ... },
  "billingcontact": { ... }
}
```

### Notes
- Without the `options` parameter, returns basic details only
- Use `options=All` to get the most comprehensive response
- Nameservers returned as `ns1`, `ns2`, `ns3`, `ns4` keys
- Contact details only included when corresponding option is specified

---

## Get Domain Details by Name

**GET** `domains/details-by-name.json`

Same as "Details by Order ID" but looks up by domain name instead.

### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `auth-userid` | string | Yes | Reseller ID |
| `api-key` | string | Yes | API key |
| `domain-name` | string | Yes | Domain name (e.g., `example.com`) |
| `options` | string | No | Same options as above |

### Response
Same format as "Details by Order ID" above.

---

## Get Order ID from Domain Name

**GET** `domains/orderid.json`

Resolves a domain name to its order ID. Useful when you know the domain name but need the order ID for other API calls.

### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `auth-userid` | string | Yes | Reseller ID |
| `api-key` | string | Yes | API key |
| `domain-name` | string | Yes | Domain name (e.g., `example.com`) |

### Response
Returns just the order ID as a string/number:
```
"87654321"
```

### Notes
- This is a lightweight lookup — use it when you only need the order ID
- The order ID is required for many other API operations (activate DNS, domain details, etc.)

---

## Error Responses

```json
{
  "status": "ERROR",
  "message": "Error description"
}
```

Common errors:
- `"No Entity found"` — domain not found in reseller's account
- `"Invalid OrderId"` — order ID doesn't exist
- `"Domain name is not valid"` — malformed domain name
