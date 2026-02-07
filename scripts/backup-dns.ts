/**
 * DNS Backup Script
 *
 * Exports all DNS records for a domain to a dated JSON backup file.
 * Handles pagination automatically (LogicBoxes API max 50 records per page).
 *
 * Usage:
 *   npx tsx scripts/backup-dns.ts [domain]
 *   npm run backup:dns -- [domain]
 *
 * Environment variables (loaded from .env):
 *   LOGICBOXES_AUTH_USERID - Reseller account ID
 *   LOGICBOXES_API_KEY     - API key
 *   LOGICBOXES_ENV         - Set to 'test' to use the OTE sandbox
 */

import * as dotenv from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { LogicBoxesClient } from '../src/api/client.js';
import { DnsApi } from '../src/api/dns.js';
import { TEST_BASE_URL } from '../src/api/types.js';
import type { DnsRecord } from '../src/api/types.js';

// ---------------------------------------------------------------------------
// ESM __dirname equivalent
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
dotenv.config({ path: path.resolve(projectRoot, '.env') });

const domainName = process.argv[2] ?? 'kgotsi.com';

const authUserId = process.env.LOGICBOXES_AUTH_USERID;
const apiKey = process.env.LOGICBOXES_API_KEY;
const envName = process.env.LOGICBOXES_ENV;

if (!authUserId || !apiKey) {
  console.error(
    'Error: Missing API credentials.\n\n' +
    'Please create a .env file in the project root with:\n' +
    '  LOGICBOXES_AUTH_USERID=your_reseller_id\n' +
    '  LOGICBOXES_API_KEY=your_api_key\n' +
    '  LOGICBOXES_ENV=test          # optional — use OTE sandbox\n',
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Client setup
// ---------------------------------------------------------------------------
const client = new LogicBoxesClient({
  authUserId,
  apiKey,
  ...(envName === 'test' ? { baseUrl: TEST_BASE_URL } : {}),
});

const dns = new DnsApi(client);

// ---------------------------------------------------------------------------
// Fetch all records (iterates every record type with pagination)
// ---------------------------------------------------------------------------
async function fetchAllRecords(domain: string): Promise<DnsRecord[]> {
  const result = await dns.searchAllRecords(domain);
  return result.records;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.error(`Backing up DNS records for: ${domainName}`);

  const records = await fetchAllRecords(domainName);

  // Build backup payload
  const backup = {
    domain: domainName,
    backupDate: new Date().toISOString(),
    totalRecords: records.length,
    records,
  };

  // Prepare output directory and file path
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const backupDir = path.join(projectRoot, 'backups', domainName);
  fs.mkdirSync(backupDir, { recursive: true });

  const backupFile = path.join(backupDir, `dns-backup-${today}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2) + '\n', 'utf-8');

  // Summary (to stderr — MCP safety habit)
  const typeCounts: Record<string, number> = {};
  for (const rec of records) {
    const t = rec.type ?? 'UNKNOWN';
    typeCounts[t] = (typeCounts[t] ?? 0) + 1;
  }

  console.error(`\nBackup complete.`);
  console.error(`  Domain:        ${domainName}`);
  console.error(`  Total records: ${records.length}`);
  console.error(`  Backup file:   ${backupFile}`);
  console.error(`  Record types:`);
  for (const [type, count] of Object.entries(typeCounts).sort()) {
    console.error(`    ${type.padEnd(8)} ${count}`);
  }
}

main().catch((err: unknown) => {
  console.error(`\nFailed to backup DNS records for ${domainName}:`);
  if (err instanceof Error) {
    console.error(`  ${err.message}`);
  } else {
    console.error(`  ${String(err)}`);
  }
  process.exit(1);
});
