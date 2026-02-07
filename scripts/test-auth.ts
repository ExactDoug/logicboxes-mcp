/**
 * Authentication Test Script
 *
 * Verifies that LogicBoxes API credentials are valid by making a lightweight
 * domain search call. All output goes to stderr.
 *
 * Usage:
 *   npx tsx scripts/test-auth.ts
 *   npm run test:auth
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
const baseUrl = envName === 'test' ? TEST_BASE_URL : undefined;

const client = new LogicBoxesClient({
  authUserId,
  apiKey,
  ...(baseUrl ? { baseUrl } : {}),
});

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.error(`Testing credentials for account: ${authUserId}`);
  console.error(`Environment: ${envName === 'test' ? 'OTE sandbox' : 'production'}`);
  console.error(`Base URL: ${baseUrl ?? 'https://httpapi.com/api/'}`);
  console.error('');

  const result = await client.get<Record<string, unknown>>(
    'domains/search.json',
    {
      'no-of-records': 10,
      'page-no': 1,
    },
  );

  console.error('Authentication successful!');
  console.error(`  Account ID:      ${authUserId}`);
  console.error(`  Domains found:   ${result.recsindb ?? 'unknown'}`);
}

main().catch((err: unknown) => {
  console.error('\nAuthentication failed.\n');

  if (err instanceof Error) {
    console.error(`  Error: ${err.message}\n`);
  } else {
    console.error(`  Error: ${String(err)}\n`);
  }

  console.error('Common fixes:');
  console.error('  1. Verify LOGICBOXES_AUTH_USERID and LOGICBOXES_API_KEY in .env');
  console.error('  2. Ensure your server IP is whitelisted in the LogicBoxes control panel');
  console.error('  3. Set LOGICBOXES_ENV=test if using OTE sandbox credentials');

  process.exit(1);
});
