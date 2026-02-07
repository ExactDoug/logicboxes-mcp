/**
 * Customer API Test Script
 *
 * Runs three sequential tests against the LogicBoxes customer endpoints:
 *   1. Search for customers (paginated)
 *   2. Get customer by ID
 *   3. Get customer by username (email)
 *
 * Usage:
 *   npx tsx scripts/test-customers.ts
 *   npm run test:customers
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
import { CustomerApi } from '../src/api/customers.js';
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

const customerApi = new CustomerApi(client);

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;

function printResult(testName: string, success: boolean): void {
  if (success) {
    passed++;
    console.error(`\n  Result: PASS\n`);
  } else {
    failed++;
    console.error(`\n  Result: FAIL\n`);
  }
}

// ---------------------------------------------------------------------------
// Test 1: Customer Search
// ---------------------------------------------------------------------------
interface SearchResult {
  firstCustomerId: string | undefined;
  firstUsername: string | undefined;
}

async function testCustomerSearch(): Promise<SearchResult> {
  console.error('='.repeat(60));
  console.error('Test 1: Customer Search');
  console.error('='.repeat(60));

  try {
    const result = await customerApi.search({ noOfRecords: 5, pageNo: 1 });

    console.error(`  Total customers found: ${result.total}`);
    console.error(`  Showing first ${result.customers.length} customer(s):\n`);

    for (const customer of result.customers) {
      console.error(`    ID: ${customer.customerid}`);
      console.error(`    Username: ${customer.username}`);
      console.error(`    Name: ${customer.name}`);
      console.error(`    Status: ${customer.customerstatus}`);
      console.error('');
    }

    printResult('Customer Search', true);

    return {
      firstCustomerId: result.customers[0]?.customerid,
      firstUsername: result.customers[0]?.username,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  Error: ${message}`);
    printResult('Customer Search', false);
    return { firstCustomerId: undefined, firstUsername: undefined };
  }
}

// ---------------------------------------------------------------------------
// Test 2: Get Customer by ID
// ---------------------------------------------------------------------------
async function testGetCustomerById(customerId: string | undefined): Promise<void> {
  console.error('='.repeat(60));
  console.error('Test 2: Get Customer by ID');
  console.error('='.repeat(60));

  if (!customerId) {
    console.error('  Skipped — no customer ID available from Test 1');
    printResult('Get Customer by ID', false);
    return;
  }

  try {
    console.error(`  Looking up customer ID: ${customerId}`);
    const customer = await customerApi.getById(parseInt(customerId));

    console.error(`  Name: ${customer.name}`);
    console.error(`  Email: ${customer.username}`);
    console.error(`  Company: ${customer.company}`);
    console.error(`  City: ${customer.city}`);
    console.error(`  State: ${customer.state}`);
    console.error(`  Country: ${customer.country}`);
    console.error(`  Status: ${customer.customerstatus}`);

    printResult('Get Customer by ID', true);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  Error: ${message}`);
    printResult('Get Customer by ID', false);
  }
}

// ---------------------------------------------------------------------------
// Test 3: Get Customer by Username
// ---------------------------------------------------------------------------
async function testGetCustomerByUsername(
  username: string | undefined,
  expectedCustomerId: string | undefined,
): Promise<void> {
  console.error('='.repeat(60));
  console.error('Test 3: Get Customer by Username');
  console.error('='.repeat(60));

  if (!username) {
    console.error('  Skipped — no username available from Test 1');
    printResult('Get Customer by Username', false);
    return;
  }

  try {
    console.error(`  Looking up username: ${username}`);
    const customer = await customerApi.getByUsername(username);

    console.error(`  Name: ${customer.name}`);
    console.error(`  Email: ${customer.username}`);
    console.error(`  Company: ${customer.company}`);
    console.error(`  City: ${customer.city}`);
    console.error(`  State: ${customer.state}`);
    console.error(`  Country: ${customer.country}`);
    console.error(`  Status: ${customer.customerstatus}`);

    if (expectedCustomerId) {
      const matches = customer.customerid === expectedCustomerId;
      console.error(`\n  ID match with Test 2: ${matches ? 'Yes' : 'No'} (${customer.customerid})`);
    }

    printResult('Get Customer by Username', true);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  Error: ${message}`);
    printResult('Get Customer by Username', false);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.error(`\nLogicBoxes Customer API Tests`);
  console.error(`Environment: ${envName === 'test' ? 'OTE Sandbox' : 'Production'}\n`);

  const { firstCustomerId, firstUsername } = await testCustomerSearch();
  await testGetCustomerById(firstCustomerId);
  await testGetCustomerByUsername(firstUsername, firstCustomerId);

  console.error('='.repeat(60));
  console.error(`Summary: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.error('='.repeat(60));

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error(`\nUnhandled error:`);
  if (err instanceof Error) {
    console.error(`  ${err.message}`);
  } else {
    console.error(`  ${String(err)}`);
  }
  process.exit(1);
});
