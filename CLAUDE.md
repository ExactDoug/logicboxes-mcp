# LogicBoxes MCP Server

## Project Overview
MCP server + TypeScript API client for the LogicBoxes domain registration and DNS hosting platform.

## Architecture
- `src/api/` — Standalone API client library (no MCP dependency)
- `src/server/` — MCP server wrapping the API client
- `scripts/` — Test and utility scripts
- `docs/` — API documentation and references
- `backups/` — DNS record backups (committed to git, never delete)

## Build & Run
- `npm run build` — Compile TypeScript
- `npm run dev` — Run MCP server in dev mode (tsx)
- `npm run start` — Run compiled MCP server

## Testing
- `npm run test:auth` — Verify API credentials
- `npm run test:customers` — Test customer endpoints
- `npm run test:domains` — Test domain endpoints
- `npm run test:dns` — Test DNS CRUD operations

## DNS Backup
- `npm run backup:dns` — Export all DNS records for a domain
- Backups saved to `backups/{domain}/dns-backup-{date}.json`
- ALWAYS run backup before modifying DNS records

## Code Conventions
- TypeScript strict mode, ESM modules
- Node 18+ (native fetch, no external HTTP dependency)
- Async/await throughout
- Zod for MCP tool input validation
- Auth via query params (auth-userid + api-key)

## API Reference
See `docs/` directory for comprehensive endpoint documentation.

## Safety
- Test domain: kgotsi.com
- DNS tests use only `_test-logicboxes-mcp` TXT subdomain
- Never modify existing production records during testing
- Always backup before any DNS operations
