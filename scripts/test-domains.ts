/**
 * Domain API Test Script
 *
 * Tests domain search, order ID lookup, and detail retrieval endpoints
 * against the LogicBoxes API.
 *
 * Usage:
 *   npx tsx scripts/test-domains.ts
 *   npm run test:domains
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
import { DomainApi } from '../src/api/domains.js';
import { TEST_BASE_URL } from '../src/api/types.js';

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

const domainApi = new DomainApi(client);

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

function formatEpoch(epoch: string): string {
  const ms = parseInt(epoch, 10);
  if (isNaN(ms)) return epoch;
  return new Date(ms * 1000).toISOString();
}

// ---------------------------------------------------------------------------
// Test 1: Domain Search
// ---------------------------------------------------------------------------
async function testDomainSearch(): Promise<void> {
  console.error('\n--- Test 1: Domain Search ---');
  try {
    const result = await domainApi.search({ noOfRecords: 10, pageNo: 1 });

    console.error(`Total domains found: ${result.total}`);
    console.error(`Domains on this page: ${result.domains.length}`);
    console.error('');

    for (const domain of result.domains.slice(0, 10)) {
      console.error(
        `  Order ${domain.orderid ?? 'N/A'}  ${(domain.domainname ?? 'N/A').padEnd(30)}` +
        `  ${(domain.currentstatus ?? 'N/A').padEnd(10)}` +
        `  expires ${formatEpoch(domain.endtime ?? '')}`,
      );
    }

    console.error('\nTest 1: PASS');
    passed++;
  } catch (err: unknown) {
    console.error(`\nTest 1: FAIL`);
    console.error(`  ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Test 2: Get Order ID for test domain
// ---------------------------------------------------------------------------
const TEST_DOMAIN = process.env.LOGICBOXES_TEST_DOMAIN ?? 'example.com';
let savedOrderId = '';

async function testGetOrderId(): Promise<void> {
  console.error(`\n--- Test 2: Get Order ID for ${TEST_DOMAIN} ---`);
  try {
    const orderId = await domainApi.getOrderId(TEST_DOMAIN);
    savedOrderId = orderId;

    console.error(`Order ID for ${TEST_DOMAIN}: ${orderId}`);

    console.error('\nTest 2: PASS');
    passed++;
  } catch (err: unknown) {
    console.error(`\nTest 2: FAIL`);
    console.error(`  ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Test 3: Get Domain Details by Order ID
// ---------------------------------------------------------------------------
async function testGetDetailsByOrderId(): Promise<void> {
  console.error('\n--- Test 3: Get Domain Details by Order ID ---');

  if (!savedOrderId) {
    console.error('  Skipped — no order ID available from Test 2');
    console.error('\nTest 3: FAIL');
    failed++;
    return;
  }

  try {
    const details = await domainApi.getDetails(savedOrderId);

    console.error(`  Domain name:  ${details.domainname}`);
    console.error(`  Status:       ${details.currentstatus}`);
    console.error(`  Created:      ${formatEpoch(details.creationtime)}`);
    console.error(`  Expires:      ${formatEpoch(details.endtime)}`);
    console.error(`  Nameservers:  ${[details.ns1, details.ns2, details.ns3, details.ns4].filter(Boolean).join(', ')}`);
    console.error(`  Customer ID:  ${details.customerid}`);

    console.error('\nTest 3: PASS');
    passed++;
  } catch (err: unknown) {
    console.error(`\nTest 3: FAIL`);
    console.error(`  ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Test 4: Get Domain Details by Name
// ---------------------------------------------------------------------------
async function testGetDetailsByName(): Promise<void> {
  console.error('\n--- Test 4: Get Domain Details by Name ---');
  try {
    const details = await domainApi.getDetailsByName(TEST_DOMAIN);

    console.error(`  Domain name:  ${details.domainname}`);
    console.error(`  Status:       ${details.currentstatus}`);
    console.error(`  Created:      ${formatEpoch(details.creationtime)}`);
    console.error(`  Expires:      ${formatEpoch(details.endtime)}`);
    console.error(`  Nameservers:  ${[details.ns1, details.ns2, details.ns3, details.ns4].filter(Boolean).join(', ')}`);
    console.error(`  Customer ID:  ${details.customerid}`);

    // Verify match with Test 3 if we have an order ID
    if (savedOrderId && details.orderid === savedOrderId) {
      console.error(`  Order ID matches Test 2/3: ${details.orderid}`);
    } else if (savedOrderId) {
      console.error(`  WARNING: Order ID mismatch — expected ${savedOrderId}, got ${details.orderid}`);
    }

    console.error('\nTest 4: PASS');
    passed++;
  } catch (err: unknown) {
    console.error(`\nTest 4: FAIL`);
    console.error(`  ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.error('=== LogicBoxes Domain API Tests ===');
  console.error(`Environment: ${envName === 'test' ? 'OTE Sandbox' : 'Production'}`);

  await testDomainSearch();
  await testGetOrderId();
  await testGetDetailsByOrderId();
  await testGetDetailsByName();

  console.error('\n=== Results ===');
  console.error(`  Passed: ${passed}`);
  console.error(`  Failed: ${failed}`);
  console.error(`  Total:  ${passed + failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error('\nUnhandled error:');
  console.error(`  ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
