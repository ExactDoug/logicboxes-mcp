# LogicBoxes API — Existing Client Libraries & Implementations

## Overview

This document catalogs existing open-source implementations of the LogicBoxes/ResellerClub API found during research. These serve as reference implementations for understanding API behavior and endpoint patterns, even though we are building our own TypeScript client from scratch.

**Key finding**: No existing MCP server for LogicBoxes exists. No quality TypeScript/JavaScript implementation exists.

---

## Go

### Urethramancer/lbapi ⭐ Best Reference Implementation

- **Repository**: https://github.com/Urethramancer/lbapi
- **Language**: Go (99.9%)
- **License**: MIT
- **Stars**: 1 | **Commits**: 106
- **Status**: Most complete implementation found; work in progress

**API Coverage**:
- Customer management (account details, signup, password reset, authentication, suspend, delete)
- Domain management (lookup, listing, editing, lock toggling, transfers, renewals, nameserver changes)
- DNS record operations (add, remove, modify all record types)
- Includes CLI tools for direct usage

**Why it's the best reference**:
- Most complete endpoint coverage
- Clean, well-structured Go code
- Includes type definitions that reveal API response shapes
- DNS operations cover all record types including SOA
- Enforces minimum TTL of 7200 seconds

**Limitations**:
- Needs Windows compatibility improvements
- REST API proxy layer planned but not implemented
- Low star count (despite code quality)

---

## Node.js / JavaScript

### apocas/node-logicboxes

- **Repository**: https://github.com/apocas/node-logicboxes
- **npm**: `logicboxes`
- **Language**: JavaScript
- **License**: Apache 2.0
- **Status**: Outdated (likely 6+ years old), callback-based

**API Coverage**:
- Billing (reseller balance)
- Contacts (add, get, search)
- Customers (get by ID, get by username, add)
- Domains (info, availability, register, transfer, renew, modify NS, child nameservers, auth, theft protection, privacy)

**Limitations**:
- Callback-based API (no Promises/async-await)
- No TypeScript definitions
- No DNS record management
- Appears unmaintained

### lukavia/resellerclub (npm: `resellerclub`)

- **Repository**: https://github.com/lukavia/resellerclub
- **npm**: `resellerclub` (1.0.0, last published 6+ years ago, 0 downloads/week)
- **Language**: JavaScript
- **License**: MIT
- **Stars**: 1 | **Forks**: 2

**API Coverage**: Minimal — domain availability, registration only

**Status**: Effectively abandoned. Not recommended as reference.

---

## PHP

### netinternet/logicboxes-api ⭐ Good Endpoint Reference

- **Repository**: https://github.com/netinternet/logicboxes-api
- **Packagist**: `netinternet/logicboxes`
- **Language**: PHP (Laravel package)
- **Stars**: 15 | **Forks**: 7

**API Coverage** (extensive):
- Domain: nameservers, details, status, DNSSEC, availability, theft protection, registration, transfer, renewal, deletion
- Contact management: registrant, admin, tech, billing contacts
- Customer management: create, get by ID, get by username
- DNS management: supported

**Why it's useful**: Documents many endpoint paths and parameter names in clean PHP syntax. Good for cross-referencing endpoint signatures.

**Compatible platforms**: ResellerClub, whois.com, and other LogicBoxes-based registrars.

### phillipsdata/logicboxes

- **Repository**: https://github.com/phillipsdata/logicboxes
- **Language**: PHP
- **License**: MIT
- **Stars**: 4 | **Forks**: 5
- **Last Commit**: June 2013

**API Coverage**: One-to-one mapping of API commands to classes/methods. Supports multiple platforms (Directi, ResellerClub, NetEarthOne, Resell.biz).

**Status**: Unmaintained since 2013. Historical reference only.

### nextgi/logicboxes-api

- **Repository**: https://github.com/nextgi/logicboxes-api
- **Language**: PHP

**API Coverage**: Actions, billing, contacts, customers, DNS, domains, orders, products. Supports LogicBoxes and ResellerClub.

### Other PHP packages

- **amirkhiz/resellerclub-php-api** — Domains, contacts, customers
- **dhawton/laravel-logicbox** — Laravel wrapper
- **lokat/laravel-logicbox** — Laravel wrapper
- **Pitchero/ResellerClub** — PHP SDK with email and DNS support
- **dhawton/laravel-logicbox** — Laravel wrapper
- **notmaintained/orderbox.php** — Unmaintained (as the name suggests)

---

## Python

### miracle2k/resellerclub

- **Repository**: https://github.com/miracle2k/resellerclub
- **PyPI**: `resellerclub`
- **Language**: Python
- **Created**: January 2014

**API Coverage**: Limited — "only a couple of DNS related functions"
- DNS operations: add, delete, list records
- Can be used as CLI tool or Python library

**Notes**:
- Requires IP whitelisting
- Suggests Docker proxy for local development
- DNS-only scope, but confirms DNS endpoint patterns

---

## Ruby

### damianrr/resellerclub

- **Repository**: https://github.com/damianrr/resellerclub
- **Language**: Ruby

**API Coverage**: Customers, Resellers, Contacts, Domains (partial implementation)

---

## Perl

### drzigman/WWW-LogicBoxes

- **Repository**: https://github.com/drzigman/WWW-LogicBoxes
- **Language**: Perl

---

## Related MCP Servers (Domain Management)

No LogicBoxes-specific MCP server exists. The closest related MCP servers are:

- **FastDomainCheck-MCP-Server** — Bulk domain availability checking via WHOIS/DNS
- **Domain Tools MCP Server** — WHOIS, DNS records, DNS health checks
- **Instant Domain Search MCP** — Domain name search
- **Domain Checker MCP Server** — Domain availability via WHOIS/DNS

None of these integrate with the LogicBoxes registrar API.

---

## WHMCS / Blesta Integrations

Several billing platform integrations exist that use the LogicBoxes API:

- **WHMCS ResellerClub Module** — https://docs.whmcs.com/ResellerClub
- **WHMCS LogicBoxes Module** — https://marketplace.whmcs.com/product/538-logicboxes-compatible-domain-registrar-module
- **WHMCS Advanced DNS Interface** — https://www.resellerclub-mods.com/whmcs/advanced-dns-interface-docs.php
- **Blesta LogicBoxes Module** — https://docs.blesta.com/integrations/modules/logicboxes/

These are closed-source commercial modules but their documentation confirms API endpoint patterns.

---

## Summary

| Language | Best Implementation | DNS Support | Quality | Status |
|----------|-------------------|-------------|---------|--------|
| **Go** | Urethramancer/lbapi | Full CRUD | Good | Active |
| **Node.js** | apocas/node-logicboxes | None | Low | Abandoned |
| **PHP** | netinternet/logicboxes-api | Yes | Good | Unknown |
| **Python** | miracle2k/resellerclub | Limited | Limited | Unknown |
| **TypeScript** | None | N/A | N/A | N/A |
| **MCP Server** | None | N/A | N/A | N/A |

**Conclusion**: We are building the first TypeScript implementation and the first MCP server for LogicBoxes. The Go `lbapi` SDK is our primary reference for API behavior and endpoint signatures. The PHP `netinternet/logicboxes-api` provides a good secondary reference for endpoint paths and parameters.
