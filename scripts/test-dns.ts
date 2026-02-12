/**
 * DNS CRUD Test Script
 *
 * Tests the full lifecycle of DNS record management:
 * search, add, verify, update, verify, delete.
 *
 * SAFETY: This script ONLY creates/modifies/deletes records in the
 * `_test-logicboxes-mcp` TXT subdomain. It NEVER touches existing
 * production records.
 *
 * Usage:
 *   npx tsx scripts/test-dns.ts
 *   npm run test:dns
 *
 * Environment variables (loaded from .env):
 *   LOGICBOXES_AUTH_USERID - Reseller account ID
 *   LOGICBOXES_API_KEY     - API key
 *   LOGICBOXES_ENV         - Set to 'test' to use the OTE sandbox
 */

import * as dotenv from 'dotenv';
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

const dnsApi = new DnsApi(client);

// ---------------------------------------------------------------------------
// Test constants
// ---------------------------------------------------------------------------
const TEST_DOMAIN = process.env.LOGICBOXES_TEST_DOMAIN ?? 'example.com';
const TEST_HOST = '_test-logicboxes-mcp';
const TEST_VALUE = 'v=test logicboxes-mcp-' + Date.now();
const UPDATED_VALUE = 'v=test logicboxes-mcp-updated-' + Date.now();

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

function pass(testNum: number, name: string): void {
  passed++;
  console.error(`  PASS  Test ${testNum}: ${name}`);
}

function fail(testNum: number, name: string, error: unknown): void {
  failed++;
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`  FAIL  Test ${testNum}: ${name}`);
  console.error(`        ${msg}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.error(`\nDNS CRUD Test — ${TEST_DOMAIN}`);
  console.error(`  Test host:     ${TEST_HOST}`);
  console.error(`  Test value:    ${TEST_VALUE}`);
  console.error(`  Updated value: ${UPDATED_VALUE}`);
  console.error(`  Environment:   ${envName === 'test' ? 'OTE sandbox' : 'production'}`);
  console.error('');

  // ---------- Test 1: Search existing records ----------
  try {
    const result = await dnsApi.searchRecords({
      domainName: TEST_DOMAIN,
      type: 'A',
    });
    console.error(`  Found ${result.records.length} A record(s) (total: ${result.total})`);
    pass(1, 'Search existing records');
  } catch (err) {
    fail(1, 'Search existing records', err);
  }

  // ---------- Tests 2-5 wrapped in try/finally for cleanup ----------
  try {
    // ---------- Test 2: Add TXT record ----------
    try {
      const addResult = await dnsApi.addRecord('TXT', {
        domainName: TEST_DOMAIN,
        host: TEST_HOST,
        value: TEST_VALUE,
        ttl: 7200,
      });
      console.error(`  Add result: ${JSON.stringify(addResult)}`);
      pass(2, 'Add TXT record');
    } catch (err) {
      fail(2, 'Add TXT record', err);
    }

    // ---------- Test 3: Verify record was added ----------
    try {
      // Wait for API propagation
      await new Promise(resolve => setTimeout(resolve, 1000));
      const searchResult = await dnsApi.searchRecords({
        domainName: TEST_DOMAIN,
        type: 'TXT',
      });
      const found = searchResult.records.find(
        (r: DnsRecord) => r.host === TEST_HOST,
      );
      if (found) {
        console.error(`  Found record: host=${found.host}, value=${found.value}`);
        pass(3, 'Verify record was added');
      } else {
        fail(3, 'Verify record was added', 'Record not found after add');
      }
    } catch (err) {
      fail(3, 'Verify record was added', err);
    }

    // ---------- Test 4: Update the record ----------
    try {
      const updateResult = await dnsApi.updateRecord('TXT', {
        domainName: TEST_DOMAIN,
        host: TEST_HOST,
        currentValue: TEST_VALUE,
        newValue: UPDATED_VALUE,
        ttl: 7200,
      });
      console.error(`  Update result: ${JSON.stringify(updateResult)}`);
      pass(4, 'Update the record');
    } catch (err) {
      fail(4, 'Update the record', err);
    }

    // ---------- Test 5: Verify record was updated ----------
    try {
      // Wait for API propagation
      await new Promise(resolve => setTimeout(resolve, 2000));
      const searchResult = await dnsApi.searchRecords({
        domainName: TEST_DOMAIN,
        type: 'TXT',
      });
      // TXT record values are returned wrapped in quotes by the API —
      // strip surrounding quotes before comparing.
      const stripQuotes = (s: string): string => s.replace(/^"|"$/g, '');
      const found = searchResult.records.find(
        (r: DnsRecord) =>
          r.host === TEST_HOST &&
          stripQuotes(r.value) === UPDATED_VALUE,
      );
      if (found) {
        console.error(`  Found updated record: host=${found.host}, value=${found.value}`);
        pass(5, 'Verify record was updated');
      } else {
        fail(5, 'Verify record was updated', 'Record not found with updated value');
      }
    } catch (err) {
      fail(5, 'Verify record was updated', err);
    }
  } finally {
    // ---------- Test 6: Delete the record (CLEANUP) ----------
    // Always runs, even if earlier tests fail. We must not leave test records behind.
    try {
      const deleteResult = await dnsApi.deleteRecord('TXT', {
        domainName: TEST_DOMAIN,
        host: TEST_HOST,
        value: UPDATED_VALUE,
      });
      console.error(`  Delete result: ${JSON.stringify(deleteResult)}`);
      pass(6, 'Delete the record (cleanup)');
    } catch (err) {
      fail(6, 'Delete the record (cleanup)', err);
    }
  }

  // ---------- Summary ----------
  const total = passed + failed;
  console.error('');
  console.error(`${passed}/${total} tests passed.`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error('\nUnhandled error:');
  if (err instanceof Error) {
    console.error(`  ${err.message}`);
  } else {
    console.error(`  ${String(err)}`);
  }
  process.exit(1);
});
